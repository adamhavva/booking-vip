import "server-only";

import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase";
import { getAccount } from "@/lib/accounts";

/**
 * Admin session helpers — server side only.
 *
 * The session cookie is a Firebase session cookie (`createSessionCookie`),
 * stored HttpOnly. Nothing here ever reaches the browser: the admin UI only
 * ever receives the email of the signed-in operator.
 *
 * Authorization is decided by the `User.role` column in Postgres: only an
 * account with the ADMIN role gets a session here. `ADMIN_EMAILS` is the
 * bootstrap allowlist used when the account row is created.
 */

export const ADMIN_SESSION_COOKIE = "admin_session";

export { isAllowlistedAdminEmail as isAllowedAdminEmail } from "@/lib/accounts";

/** Session lifetime in milliseconds (8 hours). */
const SESSION_TTL_MS = 60 * 60 * 8 * 1000;

/** Session lifetime in seconds (8 hours) — used for the browser cookie. */
export const SESSION_TTL_SECONDS = SESSION_TTL_MS / 1000;

export type AdminSession = {
  uid: string;
  email: string;
};

/**
 * Emails allowed to use the admin area.
 * `ADMIN_EMAILS` is a comma-separated list, compared case-insensitively.
 */

/**
 * Read and verify the admin session cookie.
 *
 * Returns null when there is no cookie, the cookie is expired/revoked, or the
 * account behind the cookie is not an admin (`User.role = 'ADMIN'`).
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookie = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!cookie) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(cookie, true);
    if (!decoded.email) return null;

    const account = await getAccount(decoded.uid);
    if (!account || account.role !== "ADMIN") return null;

    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return null;
  }
}

/** Create a Firebase session cookie for a verified id token. */
export async function createAdminSessionCookie(idToken: string): Promise<string> {
  // `expiresIn` is expressed in milliseconds by the Firebase Admin SDK.
  return getAdminAuth().createSessionCookie(idToken, { expiresIn: SESSION_TTL_MS });
}

/** Remove the admin session cookie. */
export async function clearAdminSessionCookie(): Promise<void> {
  (await cookies()).delete(ADMIN_SESSION_COOKIE);
}
