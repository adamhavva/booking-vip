"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { syncVerificationByEmail, verifyEmailCode } from "@/app/actions/verification";

type Props = {
  /** The out-of-band code taken from the verification link. */
  oobCode: string | null;
  /** The address the link belongs to (Firebase applies the code itself). */
  email: string | null;
  /** The link was opened straight after registering — the mail is on its way. */
  sent: boolean;
};

type State = "working" | "verified" | "error" | "idle";

/**
 * The verification landing page.
 *
 * Two ways to arrive here:
 *
 * - with an `oobCode` — the code is applied here, once, and the result is
 *   reported to the visitor;
 * - with an `email` — Firebase has already applied the code on its own action
 *   page, so the state is only refreshed here.
 *
 * When the page is opened without either (for example from the profile page)
 * the visitor only gets an explanation and a link back to the account.
 */
export default function VerifyEmailClient({ oobCode, email, sent }: Props) {
  const [state, setState] = useState<State>(oobCode || email ? "working" : "idle");
  const [message, setMessage] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    if (!oobCode && !email) return;
    started.current = true;

    void (async () => {
      const result = oobCode
        ? await verifyEmailCode(oobCode)
        : await syncVerificationByEmail(email ?? "");

      if (result.ok) {
        if (result.verified) {
          setState("verified");
          setMessage("Email kamu sudah terverifikasi. Terima kasih!");
          return;
        }
        setState("error");
        setMessage(
          "Email kamu belum terverifikasi. Silakan buka ulang tautan di dalam email verifikasi.",
        );
        return;
      }

      setState("error");
      setMessage(result.error);
    })();
  }, [oobCode, email]);

  return (
    <div className="mx-auto w-full max-w-[460px] rounded-2xl border border-line bg-white p-6 md:p-8">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft">
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M20 4H4a2 2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z"
          />
        </svg>
      </div>

      <h1 className="mt-4 text-[22px] font-extrabold tracking-[-0.02em] text-ink">
        {state === "verified"
          ? "Email terverifikasi"
          : state === "error"
            ? "Verifikasi gagal"
            : "Verifikasi email"}
      </h1>

      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        {state === "working"
          ? "Sedang memproses tautan verifikasi kamu…"
          : state === "verified"
            ? message
            : state === "error"
              ? message
              : sent
                ? "Email verifikasi sudah dikirim ke alamat kamu. Buka tautan di dalam email tersebut untuk menyelesaikan proses verifikasi."
                : "Buka tautan verifikasi yang kami kirim ke email kamu. Tautan ini hanya bisa digunakan satu kali."}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {state === "error" ? (
          <Link
            href="/account/profile"
            className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            Kirim ulang email verifikasi
          </Link>
        ) : null}

        {state === "verified" ? (
          <Link
            href="/my-booking"
            className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            Lihat pesanan saya
          </Link>
        ) : null}

        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-lg border border-line bg-white px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-canvas"
        >
          Kembali ke beranda
        </Link>
      </div>
    </div>
  );
}
