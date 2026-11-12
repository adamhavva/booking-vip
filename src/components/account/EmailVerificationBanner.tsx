"use client";

import { useCallback, useEffect, useState } from "react";
import { showToast } from "@/components/ui/toast";
import {
  getVerificationStatus,
  resendVerificationEmail,
} from "@/app/actions/verification";

/**
 * The verification banner of the profile page.
 *
 * The banner is shown while the email address is not verified yet and offers
 * a "kirim ulang" button. When the address is verified the banner turns into
 * a small, quiet confirmation.
 */
export default function EmailVerificationBanner() {
  const [verified, setVerified] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const status = await getVerificationStatus();
    setVerified(status.verified);
    setEmail(status.email);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resend = async () => {
    if (sending) return;
    setSending(true);
    const result = await resendVerificationEmail();
    setSending(false);

    if (!result.ok) {
      showToast(result.error, "error");
      return;
    }
    showToast("Email verifikasi sudah dikirim ulang. Cek inbox kamu.");
  };

  if (verified === null) return null;

  if (verified) {
    return (
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-line bg-white p-4">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft">
          <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17Z"
            />
          </svg>
        </span>
        <div>
          <p className="text-[13px] font-semibold text-ink">
            Email kamu sudah terverifikasi
          </p>
          <p className="mt-0.5 text-[12px] text-muted">
            {email ?? "Alamat email kamu"} aktif dan siap dipakai.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-line bg-canvas p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 2 1 21h22L12 2Zm1 14h-2v2h2v-2Zm0-7h-2v5h2V9Z"
            />
          </svg>
        </span>
        <div>
          <p className="text-[13px] font-semibold text-ink">
            Email belum diverifikasi
          </p>
          <p className="mt-0.5 text-[12px] text-muted">
            {email
              ? `Tautan verifikasi sudah dikirim ke ${email}.`
              : "Tautan verifikasi sudah dikirim ke email kamu."}{" "}
            Belum menerimanya? Kirim ulang.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={resend}
        disabled={sending}
        className="h-9 shrink-0 rounded-lg border border-line bg-white px-3 text-[12px] font-semibold text-ink transition-colors hover:bg-canvas disabled:opacity-50"
      >
        {sending ? "Mengirim…" : "Kirim ulang"}
      </button>
    </div>
  );
}
