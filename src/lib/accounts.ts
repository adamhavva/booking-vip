import { db } from "@/prisma/db";

/**
 * Accounts — the shared user/admin identity layer.
 *
 * The identity itself lives in Firebase Auth; this module mirrors it into the
 * Postgres `User` table, which is the single source of truth for the role
 * split:
 *
 *   - "ADMIN" → may only sign in through `/admin/login`
 *   - "USER"  → may only sign in through `/login` / `/register`
 *
 * `ADMIN_EMAILS` is the bootstrap allowlist: the first time an allowlisted
 * email signs in to the admin area it is promoted to the ADMIN role. After
 * that the database decides, so revoking access is a matter of setting
 * `role = 'USER'` (or deleting the row) for that account.
 */

export const ADMIN_ROLE = "ADMIN";
export const USER_ROLE = "USER";

export type AccountRole = typeof ADMIN_ROLE | typeof USER_ROLE;

export type AccountRecord = {
  id: string;
  email: string;
  name: string | null;
  role: AccountRole;
  emailVerified: boolean;
};

/**
 * Emails allowed to bootstrap the admin role (comma separated, case
 * insensitive).
 */
export function isAllowlistedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return false;
  return allowed.includes(email.trim().toLowerCase());
}

/** Narrow a raw database value to a known role. */
export function toAccountRole(value: string | null | undefined): AccountRole {
  return value === ADMIN_ROLE ? ADMIN_ROLE : USER_ROLE;
}

/** Read one account row (keyed by the Firebase UID). */
export async function getAccount(uid: string): Promise<AccountRecord | null> {
  const row = await db.orm.public.User
    .select("id", "email", "name", "role", "emailVerified")
    .where({ id: uid })
    .first();

  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name ?? null,
    role: toAccountRole(row.role),
    emailVerified: row.emailVerified,
  };
}

/** Read one account row by its email address. */
export async function getAccountByEmail(
  email: string,
): Promise<AccountRecord | null> {
  const row = await db.orm.public.User
    .select("id", "email", "name", "role", "emailVerified")
    .where({ email: email.trim().toLowerCase() })
    .first();

  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name ?? null,
    role: toAccountRole(row.role),
    emailVerified: row.emailVerified,
  };
}

/**
 * Mirror a Firebase identity into the database.
 *
 * An existing row keeps its role — the role is only ever changed by the
 * admin bootstrap (see {@link ensureAdminAccount}). A brand new row inherits
 * the bootstrap role from the allowlist.
 *
 * The lookup is by UID first, then by email. A Firebase account that was
 * deleted and re-created gets a new UID for the same address; the existing
 * row is then re-keyed to the new UID (the booking FK cascades with it) so
 * the account keeps its role and its booking history.
 */
export async function syncAccount(input: {
  uid: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  emailVerified?: boolean;
}): Promise<AccountRecord> {
  const email = input.email.trim().toLowerCase();
  const existing = await getAccount(input.uid);
  const name = input.name ?? existing?.name ?? null;
  const emailVerified = input.emailVerified ?? existing?.emailVerified ?? false;

  if (existing) {
    if (existing.name !== name || existing.emailVerified !== emailVerified) {
      await db.orm.public.User.where({ id: input.uid }).update({ name, emailVerified });
    }
    return { ...existing, name, emailVerified };
  }

  // A row for the same address under a stale UID: re-key it to the current
  // one instead of failing the unique constraint on `User.email_key`.
  const stale = await getAccountByEmail(email);
  if (stale && stale.id !== input.uid) {
    await db.orm.public.User.where({ id: stale.id }).update({
      id: input.uid,
      name,
      emailVerified,
    });
    return { ...stale, id: input.uid, name, emailVerified };
  }

  const role: AccountRole = isAllowlistedAdminEmail(email) ? ADMIN_ROLE : USER_ROLE;
  await db.orm.public.User.create({
    id: input.uid,
    email,
    name,
    phone: input.phone ?? null,
    role,
    emailVerified,
  });

  return { id: input.uid, email, name, role, emailVerified };
}

/**
 * Resolve the admin role for an operator signing in to `/admin`.
 *
 * Allowlisted emails are promoted to ADMIN (creating the row when needed);
 * every other account keeps — or is limited to — the USER role.
 */
export async function ensureAdminAccount(input: {
  uid: string;
  email: string;
  name?: string | null;
  emailVerified?: boolean;
}): Promise<AccountRecord | null> {
  const email = input.email.trim().toLowerCase();
  const existing = await getAccount(input.uid);

  if (existing) {
    if (existing.role === ADMIN_ROLE) {
      if (input.name && input.name !== existing.name) {
        await db.orm.public.User.where({ id: input.uid }).update({ name: input.name });
        return { ...existing, name: input.name };
      }
      return existing;
    }

    // A known user account is only promoted when the allowlist says so.
    if (!isAllowlistedAdminEmail(email)) return existing;
    await db.orm.public.User.where({ id: input.uid }).update({ role: ADMIN_ROLE });
    return { ...existing, role: ADMIN_ROLE };
  }

  if (!isAllowlistedAdminEmail(email)) return null;

  // The address is allowlisted but the row is still keyed by a stale UID —
  // re-key it so the operator keeps the account and its history.
  const stale = await getAccountByEmail(email);
  if (stale) {
    const name = input.name ?? stale.name ?? null;
    const emailVerified = input.emailVerified ?? stale.emailVerified ?? false;
    await db.orm.public.User.where({ id: stale.id }).update({
      id: input.uid,
      name,
      role: ADMIN_ROLE,
      emailVerified,
    });
    return { ...stale, id: input.uid, name, role: ADMIN_ROLE, emailVerified };
  }

  const name = input.name ?? null;
  const emailVerified = input.emailVerified ?? false;
  await db.orm.public.User.create({
    id: input.uid,
    email,
    name,
    role: ADMIN_ROLE,
    emailVerified,
  });

  return { id: input.uid, email, name, role: ADMIN_ROLE, emailVerified };
}
