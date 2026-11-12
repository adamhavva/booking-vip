"use server";

import { db } from "@/prisma/db";
import { getAdminAuth } from "@/lib/firebase";
import {
  applyEmailVerificationCode,
  getEmailVerificationState,
  isEmailVerified,
  sendVerificationForUser,
} from "@/lib/identity";
import { getUserSession } from "@/lib/user/session";

/**
 * Email verification actions.
 *
 * The identity lives in Firebase, the mirror lives in `User.emailVerified`.
 * Applying the code marks the Firebase account as verified; the database is
 * updated right after so the UI shows the new state without waiting for the
 * next sign-in.
 */

export type VerificationResult =
  | { ok: true; verified: boolean }
  | { ok: false; error: string };

/**
 * The message used whenever the link cannot be used.
 *
 * The same text is shown for an unknown address and for an already used
 * link, so the page cannot be used to probe which addresses exist.
 */
const GENERIC_VERIFICATION_ERROR =
  "Tautan verifikasi tidak valid atau sudah dipakai.";

/**
 * Apply the `oobCode` from the verification link.
 *
 * The action is public — the link itself is the proof, exactly like the
 * password reset flow.
 */
export async function verifyEmailCode(oobCode: string): Promise<VerificationResult> {
  const code = oobCode.trim();
  if (!code) return { ok: false, error: "Kode verifikasi tidak ditemukan." };

  const result = await applyEmailVerificationCode(code);
  if (!result.ok) return { ok: false, error: result.error };

  if (result.email) {
    const row = await db.orm.public.User
      .select("id")
      .where({ email: result.email.trim().toLowerCase() })
      .first();
    if (row) {
      await db.orm.public.User.where({ id: row.id }).update({ emailVerified: true });
    }
  }

  return { ok: true, verified: true };
}

/**
 * Refresh the verification state of an address.
 *
 * The mail link is handled by Firebase — it applies the code and then sends
 * the visitor to our landing page with the address in the query string. The
 * page calls this action to learn the new state and to refresh the database
 * mirror, so the account menu shows the right badge right away.
 *
 * Only addresses that exist in the database are answered, so the action
 * cannot be used to find out which addresses are registered.
 */
export async function syncVerificationByEmail(
  email: string,
): Promise<VerificationResult> {
  const address = email.trim().toLowerCase();
  if (!address) return { ok: false, error: GENERIC_VERIFICATION_ERROR };

  const row = await db.orm.public.User
    .select("id")
    .where({ email: address })
    .first();
  if (!row) return { ok: false, error: GENERIC_VERIFICATION_ERROR };

  const state = await getEmailVerificationState(address);
  if (state.verified) {
    await db.orm.public.User.where({ id: row.id }).update({ emailVerified: true });
    return { ok: true, verified: true };
  }

  return { ok: true, verified: false };
}

/**
 * Send the verification email again.
 *
 * Only a signed-in customer can ask for it — the address is taken from the
 * session, never from the form.
 */
export async function resendVerificationEmail(): Promise<VerificationResult> {
  const session = await getUserSession();
  if (!session) {
    return { ok: false, error: "Silakan masuk terlebih dahulu." };
  }

  if (session.emailVerified) {
    return { ok: true, verified: true };
  }

  const sent = await sendVerificationForUser(session.uid, session.email);
  if (!sent) {
    return { ok: false, error: "Email verifikasi gagal dikirim. Coba lagi sebentar." };
  }

  return { ok: true, verified: false };
}

/**
 * The verification status of the signed-in customer.
 *
 * Firebase is the source of truth, the database is only the mirror — so the
 * Firebase state is read first and the mirror is refreshed when it drifted.
 */
export async function getVerificationStatus(): Promise<{
  verified: boolean;
  email: string | null;
}> {
  const session = await getUserSession();
  if (!session) return { verified: false, email: null };

  const verified = await isEmailVerified(session.uid);
  if (verified && !session.emailVerified) {
    await db.orm.public.User.where({ id: session.uid }).update({ emailVerified: true });
  }

  return { verified, email: session.email };
}

/**
 * Force the verification flag of an account (used by the admin tools).
 */
export async function setEmailVerifiedFlag(
  uid: string,
  verified: boolean,
): Promise<void> {
  try {
    await getAdminAuth().updateUser(uid, { emailVerified: verified });
    await db.orm.public.User.where({ id: uid }).update({ emailVerified: verified });
  } catch {
    // Nothing else to do — the caller reports a generic failure.
  }
}
