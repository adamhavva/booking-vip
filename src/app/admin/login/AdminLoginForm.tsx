"use client";

import { useActionState } from "react";
import { signInAdmin, type AdminLoginState } from "@/app/actions/admin-auth";
import AuthField from "@/components/auth/AuthField";

/**
 * Operator login form — same centered look as the customer forms.
 *
 * The error message is deliberately generic ("Email atau password salah") so
 * the form never reveals whether an account exists.
 */
export default function AdminLoginForm() {
  const [state, formAction, pending] = useActionState<AdminLoginState, FormData>(
    signInAdmin,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <AuthField
        label="Email"
        name="email"
        type="email"
        autoComplete="username"
        placeholder="nama@email.com"
      />

      <AuthField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
      />

      {state.error ? (
        <p className="rounded-lg border border-danger/25 bg-danger/5 px-3 py-2 text-[13px] text-danger">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-ink text-sm font-semibold text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Memproses…" : "Masuk"}
      </button>
    </form>
  );
}
