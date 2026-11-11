"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import {
  signInUser,
  requestPasswordReset,
  type UserAuthState,
} from "@/app/actions/user-auth";
import AuthField from "@/components/auth/AuthField";
import GoogleButton from "@/components/auth/GoogleButton";

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
      <div className="mb-7">
        <h1 className="text-[26px] font-extrabold tracking-[-0.02em] text-ink">
          Selamat datang kembali
        </h1>
        <p className="mt-1.5 text-[14px] text-muted">
          Masuk untuk melihat pesanan dan mengelola akun kamu.
        </p>
      </div>

      <GoogleButton />

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-[12px] uppercase tracking-[0.08em] text-muted">
          atau lanjut dengan email
        </span>
        <span className="h-px flex-1 bg-line" />
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
                className="h-4 w-4 rounded border-line accent-[#0064d2]"
              />
              Ingat saya
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={resetPending}
              className="text-[13px] font-medium text-brand hover:underline disabled:opacity-60"
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

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Memproses…" : "Masuk"}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-muted">
        Belum punya akun?{" "}
        <Link href="/register" className="font-semibold text-brand hover:underline">
          Daftar
        </Link>
      </p>

      <p className="mt-2 text-center text-[13px] text-muted">
        <Link
          href="/admin/login"
          className="font-semibold text-ink hover:underline"
        >
          Masuk ke area admin
        </Link>
      </p>
    </div>
  );
}
