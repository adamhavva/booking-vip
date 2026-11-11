"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase";
import { signInWithPassword } from "@/lib/identity";
import { ensureAdminAccount } from "@/lib/accounts";
import {
  ADMIN_SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  clearAdminSessionCookie,
  createAdminSessionCookie,
} from "@/lib/admin/session";

/**
 * Admin authentication.
 *
 * Sign-in goes through the Firebase Identity Toolkit REST API from the
 * server (the API key never reaches the browser), the returned id token is
 * verified with `firebase-admin`, and the account must carry the ADMIN role
 * in Postgres before a session cookie is issued.
 *
 * Customer accounts are rejected here — admins and users never share a
 * session.
 */

export type AdminLoginState = {
  error?: string;
};

const GENERIC_ERROR = "Email atau password salah.";
const NOT_ADMIN_ERROR =
  "Akun ini terdaftar sebagai user, bukan admin. Gunakan halaman Masuk untuk user.";

/** Server action backing the admin login form. */
export async function signInAdmin(
  _prev: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: GENERIC_ERROR };
  }

  const signIn = await signInWithPassword(email, password);
  if (!signIn.ok) {
    return { error: GENERIC_ERROR };
  }

  let decoded;
  try {
    decoded = await getAdminAuth().verifyIdToken(signIn.idToken);
  } catch {
    return { error: GENERIC_ERROR };
  }

  if (!decoded.email) {
    return { error: GENERIC_ERROR };
  }

  // The account must be an admin. Allowlisted emails are promoted here the
  // first time they sign in; everybody else keeps their current role.
  const account = await ensureAdminAccount({
    uid: decoded.uid,
    email: decoded.email,
    name: decoded.name ?? null,
    emailVerified: decoded.email_verified ?? false,
  });

  if (!account) {
    return { error: GENERIC_ERROR };
  }
  if (account.role !== "ADMIN") {
    return { error: NOT_ADMIN_ERROR };
  }

  const sessionCookie = await createAdminSessionCookie(signIn.idToken);

  (await cookies()).set(ADMIN_SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  redirect("/admin");
}

/** Server action that drops the admin session and returns to the login page. */
export async function signOutAdmin(): Promise<void> {
  await clearAdminSessionCookie();
  redirect("/admin/login");
}
