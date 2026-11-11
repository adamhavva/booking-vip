import { getAdminAuth } from "@/lib/firebase";

/**
 * Identity Toolkit helpers — server side only.
 *
 * Email + password sign-in goes through the Firebase REST API so the API key
 * never reaches the browser. Account creation uses the Admin SDK instead,
 * because it is the only way to create a user without a client SDK.
 */

export type PasswordSignInResult =
  | { ok: true; idToken: string }
  | { ok: false; error: string };

const GENERIC_ERROR = "Email atau password salah.";

/**
 * Exchange email + password for an id token using the Identity Toolkit REST
 * API. Every failure collapses into the same generic error so the form never
 * reveals whether an account exists.
 */
export async function signInWithPassword(
  email: string,
  password: string,
): Promise<PasswordSignInResult> {
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) return { ok: false, error: GENERIC_ERROR };

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
        cache: "no-store",
      },
    );

    if (!res.ok) return { ok: false, error: GENERIC_ERROR };
    const data = (await res.json()) as { idToken?: string };
    if (!data.idToken) return { ok: false, error: GENERIC_ERROR };
    return { ok: true, idToken: data.idToken };
  } catch {
    return { ok: false, error: GENERIC_ERROR };
  }
}

export type CreateAccountResult =
  | { ok: true; uid: string }
  | { ok: false; error: string };

/**
 * Create an email + password account in Firebase.
 *
 * Only used by the public registration form — the account is always a plain
 * user account (admins are promoted by the allowlist, never registered here).
 */
export async function createEmailPasswordAccount(
  displayName: string,
  email: string,
  password: string,
): Promise<CreateAccountResult> {
  try {
    const user = await getAdminAuth().createUser({
      email,
      password,
      displayName,
      emailVerified: false,
      disabled: false,
    });
    return { ok: true, uid: user.uid };
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === "auth/email-already-exists") {
      return { ok: false, error: "Email sudah terdaftar. Silakan masuk." };
    }
    if (code === "auth/invalid-email") {
      return { ok: false, error: "Format email tidak valid." };
    }
    if (code === "auth/weak-password") {
      return { ok: false, error: "Password minimal 8 karakter." };
    }
    if (code === "auth/operation-not-allowed") {
      return { ok: false, error: "Login dengan email & password belum diaktifkan." };
    }
    return { ok: false, error: "Gagal membuat akun. Coba lagi sebentar." };
  }
}

/**
 * Send a password reset email through the Identity Toolkit REST API.
 *
 * The response never reveals whether the address exists — a successful call
 * is reported the same way for unknown and known emails.
 */
export async function sendPasswordResetEmail(email: string): Promise<void> {
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) return;

  try {
    await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          requestType: "PASSWORD_RESET",
          email,
          continueUrl: process.env.NEXT_PUBLIC_SITE_URL
            ? `${process.env.NEXT_PUBLIC_SITE_URL}/login`
            : undefined,
        }),
        cache: "no-store",
      },
    );
  } catch {
    // Swallowed on purpose: the caller always reports the same message.
  }
}

/** Delete a Firebase account (used to roll back a rejected registration). */
export async function deleteFirebaseUser(uid: string): Promise<void> {
  try {
    await getAdminAuth().deleteUser(uid);
  } catch {
    // Nothing else to do — the caller already failed the request.
  }
}
