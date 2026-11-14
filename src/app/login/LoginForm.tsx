"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  signInUser,
  requestPasswordReset,
  type UserAuthState,
} from "@/app/actions/user-auth";
import AuthField from "@/components/auth/AuthField";
import FacebookButton from "@/components/auth/FacebookButton";
import GoogleButton from "@/components/auth/GoogleButton";
import TurnstileWidget from "@/components/auth/TurnstileWidget";

/**
 * Customer login form — email + password, or Google.
 *
 * The password path runs entirely on the server (the Firebase API key never
 * reaches the browser). The Google path opens the Firebase popup in the
 * browser and hands the resulting id token to the server, which verifies it
 * before creating the session cookie.
 */
export default function LoginForm() {
  const [state, formAction, pending] = useActionState<UserAuthState, FormData>(
    signInUser,
    {},
  );
  const [resetPending, startReset] = useTransition();
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  // React resets uncontrolled form fields after a server action completes, so
  // the email is kept in state and restored on the next render.
  const [email, setEmail] = useState("");
  // Turnstile tokens are single-use — the widget is reset after a rejected
  // submission so the user can solve it again.
  const [turnstileReset, setTurnstileReset] = useState(0);

  useEffect(() => {
    // `state` is replaced on every action result — the error text alone is
    // not a reliable dependency (the same message twice would not re-run it).
    if (state.error) setTurnstileReset((n) => n + 1);
  }, [state]);


  function handleForgotPassword() {
    const email = document.querySelector<HTMLInputElement>(
      'input[name="email"]',
    )?.value.trim();
    if (!email) {
      setResetError("Isi email kamu dulu.");
      return;
    }

    setResetError(null);
    setResetMessage(null);
    startReset(async () => {
      const result = await requestPasswordReset(email);
      if (result?.error) {
        setResetError(result.error);
      } else {
        setResetMessage(
          "Jika email tersebut terdaftar, kami sudah mengirim tautan reset password.",
        );
      }
    });
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Selamat datang kembali
        </h1>
        <p className="mt-2 text-sm text-muted">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="font-medium text-ink underline underline-offset-4 transition-colors hover:text-brand"
          >
            Daftar
          </Link>
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <AuthField
          label="Email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="nama@email.com"
          value={email}
          onChange={setEmail}
        />

        <div>
          <AuthField
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
          />
          <div className="mt-2.5 flex items-center justify-between">
            <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-muted">
              <input
                type="checkbox"
                name="remember"
                value="1"
                defaultChecked
                className="h-4 w-4 rounded border-line accent-ink"
              />
              Ingat saya
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={resetPending}
              className="text-[13px] font-medium text-ink underline-offset-4 transition-colors hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resetPending ? "Mengirim…" : "Lupa password?"}
            </button>
          </div>
        </div>

        {state.error ? (
          <p className="rounded-lg border border-danger/25 bg-danger/5 px-3 py-2 text-[13px] text-danger">
            {state.error}
          </p>
        ) : null}

        {resetError ? (
          <p className="rounded-lg border border-danger/25 bg-danger/5 px-3 py-2 text-[13px] text-danger">
            {resetError}
          </p>
        ) : null}

        {resetMessage ? (
          <p className="rounded-lg border border-success/25 bg-success/5 px-3 py-2 text-[13px] text-success">
            {resetMessage}
          </p>
        ) : null}

        <TurnstileWidget
          sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
          action="login"
          resetSignal={turnstileReset}
        />

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-ink text-sm font-semibold text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Memproses…" : "Masuk"}
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
