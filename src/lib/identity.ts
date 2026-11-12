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

/* -------------------------------------------------------------------------
 * Email verification
 * ------------------------------------------------------------------------- */

/**
 * The URL the verification link points to.
 *
 * The mail links to the Firebase action page, which verifies the address and
 * then hands the visitor over to this page. The email address is passed along
 * as a query parameter, so the landing page can check the Firebase state and
 * refresh the database mirror without the visitor having to sign in first.
 *
 * The public site URL is used when it is configured; otherwise the host of
 * the current request is used, so the link also works on a deployment without
 * `NEXT_PUBLIC_SITE_URL`.
 */
async function verificationContinueUrl(email: string): Promise<string | undefined> {
  const query = `?email=${encodeURIComponent(email)}`;

  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (base) return `${base.replace(/\/$/, "")}/verify-email${query}`;

  try {
    const { headers } = await import("next/headers");
    const list = await headers();
    const host = list.get("x-forwarded-host") ?? list.get("host");
    if (!host) return undefined;
    const proto = list.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}/verify-email${query}`;
  } catch {
    return undefined;
  }
}

/**
 * Send the "verify your email" message.
 *
 * The Identity Toolkit REST API only accepts `requestType: VERIFY_EMAIL`
 * together with the id token of the account itself — a bare email is
 * rejected with `INVALID_ID_TOKEN`. The id token therefore comes from the
 * sign-in that just happened (register) or from a fresh custom-token sign-in
 * (resend).
 */
export async function sendEmailVerificationEmail(
  email: string,
  idToken: string,
): Promise<void> {
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) return;

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          requestType: "VERIFY_EMAIL",
          email,
          idToken,
          continueUrl: await verificationContinueUrl(email),
          // The link points at our own `/verify-email` page — the address is
          // passed along, so the page can refresh the verification state after
          // Firebase applied the code.
          handleCodeInApp: true,
        }),
        cache: "no-store",
      },
    );

    if (!res.ok) {
      console.error(
        "[identity] could not send the verification email",
        res.status,
        await res.text(),
      );
    }
  } catch {
    // Swallowed on purpose: a failed send must never break the sign-up.
  }
}

/**
 * Sign in with a custom token and return the id token.
 *
 * Used when the customer asks for the verification email again — the server
 * mints a short-lived custom token for the uid, exchanges it for an id token
 * and hands that to the verification mailer.
 */
async function mintIdToken(uid: string): Promise<string | null> {
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) return null;

  try {
    const customToken = await getAdminAuth().createCustomToken(uid);
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: customToken, returnSecureToken: true }),
        cache: "no-store",
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { idToken?: string };
    return data.idToken ?? null;
  } catch {
    return null;
  }
}

/**
 * Send (or resend) the verification email for a uid.
 */
export async function sendVerificationForUser(
  uid: string,
  email: string,
): Promise<boolean> {
  const idToken = await mintIdToken(uid);
  if (!idToken) return false;
  await sendEmailVerificationEmail(email, idToken);
  return true;
}

/**
 * Apply an out-of-band code (the `oobCode` from the verification link).
 *
 * The Admin SDK has no `applyActionCode`, so the code is applied through the
 * Identity Toolkit REST API (`accounts:update`). On success Firebase marks
 * the account as verified.
 */
export async function applyEmailVerificationCode(
  oobCode: string,
): Promise<{ ok: true; email: string | null } | { ok: false; error: string }> {
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Verifikasi email belum bisa diproses." };
  }

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ oobCode }),
        cache: "no-store",
      },
    );

    if (!res.ok) return { ok: false, error: "Kode verifikasi tidak valid atau sudah dipakai." };

    const data = (await res.json()) as { email?: string; localId?: string };
    return { ok: true, email: data.email ?? null };
  } catch {
    return { ok: false, error: "Verifikasi email gagal diproses. Coba lagi." };
  }
}

/**
 * Is the account already verified in Firebase?
 */
export async function isEmailVerified(uid: string): Promise<boolean> {
  try {
    const user = await getAdminAuth().getUser(uid);
    return user.emailVerified === true;
  } catch {
    return false;
  }
}

/**
 * The verification state of an address, looked up by email.
 *
 * The mail link hands the visitor over to our own page after Firebase
 * applied the code — the page then asks for the state of the address to
 * refresh the database mirror.
 */
export async function getEmailVerificationState(
  email: string,
): Promise<{ verified: boolean; uid: string | null }> {
  try {
    const user = await getAdminAuth().getUserByEmail(email.trim().toLowerCase());
    return { verified: user.emailVerified === true, uid: user.uid };
  } catch {
    return { verified: false, uid: null };
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
