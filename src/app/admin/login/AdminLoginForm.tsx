"use client";

import { useActionState } from "react";
import { signInAdmin, type AdminLoginState } from "@/app/actions/admin-auth";

/**
 * Admin login form.
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
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--admin-muted)]">
          Email
        </span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className="h-9 w-full rounded-lg border border-[var(--admin-line)] bg-white px-3 text-[13px] outline-none placeholder:text-[var(--admin-muted)] focus:border-[var(--admin-ink)] focus:ring-2 focus:ring-brand/15"
          placeholder="admin@example.com"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--admin-muted)]">
          Password
        </span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-9 w-full rounded-lg border border-[var(--admin-line)] bg-white px-3 text-[13px] outline-none placeholder:text-[var(--admin-muted)] focus:border-[var(--admin-ink)] focus:ring-2 focus:ring-brand/15"
          placeholder="••••••••"
        />
      </label>

      {state.error ? (
        <p className="rounded-lg border border-[var(--admin-line)] bg-[var(--admin-hover)] px-3 py-2 text-[12px] text-danger">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--admin-accent)] px-3 text-[13px] font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Memproses…" : "Masuk"}
      </button>
    </form>
  );
}
