"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase";
import {
  createEmailPasswordAccount,
  deleteFirebaseUser,
  sendEmailVerificationEmail,
  sendPasswordResetEmail,
  signInWithPassword,
} from "@/lib/identity";
import { ADMIN_ROLE, syncAccount } from "@/lib/accounts";
import { verifyTurnstileToken } from "@/lib/turnstile";
import {
  USER_SESSION_COOKIE,
  USER_SESSION_TTL_REMEMBER_SECONDS,
  USER_SESSION_TTL_SECONDS,
  clearUserSessionCookie,
  createUserSessionCookie,
  getUserSession,
} from "@/lib/user/session";

/**
 * Customer authentication.
 *
 * The identity lives in Firebase Auth (email + password, or Google), the
 * profile and the role live in Postgres (`User`). Only accounts with the
 * USER role get a customer session — admin operators are redirected to
 * `/admin/login`, so an admin can never browse the site as a customer and a
 * customer can never reach the admin area.
 */

export type UserAuthState = {
  error?: string;
};

const GENERIC_ERROR = "Email atau password salah.";
const ADMIN_ONLY_ERROR =
  "Akun ini terdaftar sebagai admin. Silakan masuk lewat halaman admin.";
const TURNSTILE_ERROR =
  "Verifikasi keamanan gagal. Muat ulang halaman lalu coba lagi.";

async function issueUserSession(
  idToken: string,
  remember = false,
): Promise<void> {
  const ttl = remember
    ? USER_SESSION_TTL_REMEMBER_SECONDS
    : USER_SESSION_TTL_SECONDS;
  const sessionCookie = await createUserSessionCookie(idToken, ttl);
  (await cookies()).set(USER_SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ttl,
  });
}

/** Server action backing the customer login form. */
export async function signInUser(
  _prev: UserAuthState,
  formData: FormData,
): Promise<UserAuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  // Bot check first: the Turnstile token is redeemed before the credentials
  // are even looked at.
  const turnstileOk = await verifyTurnstileToken(
    String(formData.get("cf-turnstile-response") ?? ""),
    "login",
  );
  if (!turnstileOk) {
    return { error: TURNSTILE_ERROR };
  }

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

  let account;
  try {
    account = await syncAccount({
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name ?? null,
      emailVerified: decoded.email_verified ?? false,
    });
  } catch {
    return { error: "Gagal masuk. Coba lagi sebentar." };
  }

  if (account.role === ADMIN_ROLE) {
    return { error: ADMIN_ONLY_ERROR };
  }

  await issueUserSession(signIn.idToken, formData.get("remember") === "1");
  redirect("/");
}

/**
 * Send a password reset email.
 *
 * The answer never differs between a known and an unknown address, so the
 * form cannot be used to probe which emails have accounts.
 */
export async function requestPasswordReset(
  email: string,
): Promise<UserAuthState> {
  const trimmed = email.trim();
  if (!trimmed) {
    return { error: "Email wajib diisi." };
  }

  await sendPasswordResetEmail(trimmed);
  return {};
}

/** Server action backing the customer registration form. */
export async function registerUser(
  _prev: UserAuthState,
  formData: FormData,
): Promise<UserAuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  // Bot check first: the Turnstile token is redeemed before the account is
  // created.
  const turnstileOk = await verifyTurnstileToken(
    String(formData.get("cf-turnstile-response") ?? ""),
    "register",
  );
  if (!turnstileOk) {
    return { error: TURNSTILE_ERROR };
  }

  if (formData.get("terms") !== "1") {
    return { error: "Kamu harus menyetujui Syarat & Ketentuan." };
  }
  if (!name || !email || !password) {
    return { error: "Nama, email, dan password wajib diisi." };
  }
  if (password.length < 8) {
    return { error: "Password minimal 8 karakter." };
  }
  if (password !== confirm) {
    return { error: "Konfirmasi password tidak sama." };
  }

  const created = await createEmailPasswordAccount(name, email, password);
  if (!created.ok) {
    return { error: created.error };
  }

  const signIn = await signInWithPassword(email, password);
  if (!signIn.ok) {
    await deleteFirebaseUser(created.uid);
    return { error: "Akun dibuat, tetapi gagal masuk. Silakan coba masuk." };
  }

  let decoded;
  try {
    decoded = await getAdminAuth().verifyIdToken(signIn.idToken);
  } catch {
    await deleteFirebaseUser(created.uid);
    return { error: "Akun dibuat, tetapi gagal masuk. Silakan coba masuk." };
  }

  let account;
  try {
    account = await syncAccount({
      uid: decoded.uid,
      email: decoded.email ?? email,
      name,
      emailVerified: false,
    });
  } catch {
    // The database refused the account — roll the Firebase user back so the
    // address can be registered again instead of being half-created.
    await deleteFirebaseUser(created.uid);
    return { error: "Gagal membuat akun. Coba lagi sebentar." };
  }

  if (account.role === ADMIN_ROLE) {
    // The email belongs to the admin allowlist — the account stays, but it
    // is an admin account and must not be used on the customer side.
    return { error: ADMIN_ONLY_ERROR };
  }

  await issueUserSession(signIn.idToken);

  // The verification mail goes out right after the account exists — the
  // sign-in token doubles as the proof the Identity Toolkit asks for.
  await sendEmailVerificationEmail(email, signIn.idToken);

  redirect("/verify-email?sent=1");
}

/**
 * Complete a Google sign-in.
 *
 * The client SDK opens the Google popup and hands over the freshly minted id
 * token; the token is verified here before a session cookie is issued.
 */
export async function signInUserWithGoogle(idToken: string): Promise<void> {
  if (!idToken) {
    redirect("/login?error=google");
  }

  let decoded;
  try {
    decoded = await getAdminAuth().verifyIdToken(idToken);
  } catch {
    redirect("/login?error=google");
  }

  if (!decoded.email) {
    redirect("/login?error=google");
  }

  const account = await syncAccount({
    uid: decoded.uid,
    email: decoded.email,
    name: decoded.name ?? null,
    emailVerified: decoded.email_verified ?? false,
  });

  if (account.role === ADMIN_ROLE) {
    redirect("/login?error=admin");
  }

  await issueUserSession(idToken);
  redirect("/");
}

/**
 * Server action that drops the customer session.
 *
 * It deliberately does not redirect: the caller sends the browser to "/"
 * with a full page load, so the header re-reads the session instead of
 * keeping the signed-in state of the component that is already mounted.
 */
export async function signOutUser(): Promise<void> {
  await clearUserSessionCookie();
}

/**
 * Lightweight session probe used by the header to swap between the
 * "Masuk" and "Akun saya" links.
 */
export async function getSessionUser(): Promise<{
  name: string | null;
  email: string;
  role: string;
} | null> {
  const session = await getUserSession();
  if (!session) return null;
  return { name: session.name, email: session.email, role: session.role };
}
