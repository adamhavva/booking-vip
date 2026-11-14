"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { registerUser, type UserAuthState } from "@/app/actions/user-auth";
import AuthField from "@/components/auth/AuthField";
import FacebookButton from "@/components/auth/FacebookButton";
import GoogleButton from "@/components/auth/GoogleButton";
import TurnstileWidget from "@/components/auth/TurnstileWidget";

/**
 * Customer registration form.
 *
 * Only customer accounts are created here — an email on the admin allowlist
 * is flagged as an admin account by the server and cannot be used on the
 * customer side.
 */
export default function RegisterForm() {
  const [state, formAction, pending] = useActionState<UserAuthState, FormData>(
    registerUser,
    {},
  );
  // Turnstile tokens are single-use — the widget is reset after a rejected
  // submission so the user can solve it again.
  const [turnstileReset, setTurnstileReset] = useState(0);

  useEffect(() => {
    // `state` is replaced on every action result — the error text alone is
    // not a reliable dependency (the same message twice would not re-run it).
    if (state.error) setTurnstileReset((n) => n + 1);
  }, [state]);

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Buat akun kamu
        </h1>
        <p className="mt-2 text-sm text-muted">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-medium text-ink underline underline-offset-4 transition-colors hover:text-brand"
          >
            Masuk
          </Link>
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <AuthField
          label="Nama lengkap"
          name="name"
          autoComplete="name"
          placeholder="Nama lengkap"
        />

        <AuthField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="nama@email.com"
        />

        <AuthField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          placeholder="Minimal 8 karakter"
        />

        <AuthField
          label="Ulangi password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          placeholder="••••••••"
        />

        <div className="-mt-1 flex items-start gap-2 text-[12px] leading-relaxed text-muted">
          <input
            type="checkbox"
            name="terms"
            value="1"
            required
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-line accent-ink"
          />
          <span>
            Saya menyetujui Syarat &amp; Ketentuan serta Kebijakan Privasi
            Booking VIP.
          </span>
        </div>

        {state.error ? (
          <p className="rounded-lg border border-danger/25 bg-danger/5 px-3 py-2 text-[13px] text-danger">
            {state.error}
          </p>
        ) : null}

        <TurnstileWidget
          sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
          action="register"
          resetSignal={turnstileReset}
        />

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-ink text-sm font-semibold text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Membuat akun…" : "Daftar"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs text-muted">Atau</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <GoogleButton label="Google" className="w-full" />
        <FacebookButton className="w-full" />
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-muted">
        Dengan melanjutkan, kamu menyetujui Syarat &amp; Ketentuan dan
        Kebijakan Privasi Booking VIP.
      </p>
    </div>
  );
}
