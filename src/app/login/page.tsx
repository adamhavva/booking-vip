import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import AuthShell from "@/components/auth/AuthShell";
import { getUserSession } from "@/lib/user/session";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Masuk · Booking VIP",
  description: "Masuk ke akun Booking VIP kamu.",
};

/**
 * Customer login — the public counterpart of `/admin/login`.
 *
 * Admin operators cannot sign in here: their account carries the ADMIN role
 * and the server rejects it, pointing them to the admin area instead.
 *
 * The page deliberately renders without the site header/footer — it is a
 * focused, centered step.
 */
export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <AlreadySignedIn />
      </Suspense>
      <Suspense fallback={null}>
        <LoginNotice searchParams={searchParams} />
      </Suspense>
      <LoginForm />
    </AuthShell>
  );
}

/** Sends an already-authenticated customer straight to the home page. */
async function AlreadySignedIn() {
  // Reading the session verifies a Firebase token, which reads the clock —
  // only allowed once a real request arrived.
  await connection();

  const session = await getUserSession();
  if (session) {
    redirect("/");
  }
  return null;
}

/** Banner for the failure codes the Google sign-in flow redirects back with. */
async function LoginNotice({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const message =
    error === "admin"
      ? "Akun ini terdaftar sebagai admin. Silakan masuk lewat halaman admin."
      : error === "google"
        ? "Gagal masuk dengan Google. Coba lagi atau gunakan email & password."
        : null;

  if (!message) return null;

  return (
    <p className="mb-5 rounded-lg border border-danger/25 bg-danger/5 px-3 py-2 text-[13px] text-danger">
      {message}
    </p>
  );
}
