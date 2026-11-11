import "server-only";

import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase";
import { getAccount, type AccountRecord } from "@/lib/accounts";

/**
 * User session helpers — server side only.
 *
 * The cookie is a Firebase session cookie (HttpOnly), scoped to the public
 * site. Admin operators use a separate cookie (`admin_session`) and can never
 * use this one: an account whose role is ADMIN is rejected here, so admins
 * cannot browse the site as a customer and customers cannot reach `/admin`.
 */

export const USER_SESSION_COOKIE = "user_session";

/** Session lifetime in seconds when "remember me" is unchecked (8 hours). */
export const USER_SESSION_TTL_SECONDS = 60 * 60 * 8;

/** Session lifetime in seconds when "remember me" is checked (14 days). */
export const USER_SESSION_TTL_REMEMBER_SECONDS = 60 * 60 * 24 * 14;

export type UserSession = AccountRecord & {
  /** The Firebase UID (same value as `id`). */
  uid: string;
};

/** Create a Firebase session cookie for a verified id token. */
export async function createUserSessionCookie(
  idToken: string,
  ttlSeconds: number = USER_SESSION_TTL_SECONDS,
): Promise<string> {
  return getAdminAuth().createSessionCookie(idToken, { expiresIn: ttlSeconds * 1000 });
}

/** Remove the user session cookie. */
export async function clearUserSessionCookie(): Promise<void> {
  (await cookies()).delete(USER_SESSION_COOKIE);
}

/**
 * Read and verify the user session cookie.
 *
 * Returns null when there is no cookie, the cookie expired/was revoked, the
 * account is unknown, or the account is an admin (admins belong to the
 * `/admin` area, not to the customer session).
 */
export async function getUserSession(): Promise<UserSession | null> {
  const cookie = (await cookies()).get(USER_SESSION_COOKIE)?.value;
  if (!cookie) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(cookie, true);
    if (!decoded.email) return null;

    const account = await getAccount(decoded.uid);
    if (!account) return null;
    if (account.role === "ADMIN") return null;

    return { uid: account.id, ...account };
  } catch {
    return null;
  }
}
