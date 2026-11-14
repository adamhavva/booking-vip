import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import AuthShell from "@/components/auth/AuthShell";
import { getAdminSession } from "@/lib/admin/session";
import AdminLoginForm from "./AdminLoginForm";

export const metadata: Metadata = {
  title: "Masuk · Admin",
  robots: { index: false, follow: false },
};

/**
 * Operator login — public route.
 *
 * It lives outside the `(secure)` route group so the guarded layout never
 * wraps it (no redirect loop). Shares the centered AuthShell canvas with the
 * customer pages; the page itself reveals nothing about roles or allowlists.
 */
export default function AdminLoginPage() {
  return (
    <AuthShell>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Selamat datang kembali
        </h1>
        <p className="mt-2 text-sm text-muted">
          Masuk untuk mengelola katalog.
        </p>
      </div>

      <Suspense fallback={null}>
        <AlreadySignedIn />
      </Suspense>
      <AdminLoginForm />
    </AuthShell>
  );
}

/**
 * Sends an already-authenticated operator straight to the dashboard.
 *
 * The session is read on the server (the cookie is HttpOnly and never reaches
 * the browser) inside a Suspense boundary so the route can still be
 * prerendered.
 */
async function AlreadySignedIn() {
  // The session check reads the clock (Firebase token verification), which is
  // only allowed once a real request has arrived.
  await connection();

  const session = await getAdminSession();
  if (session) {
    redirect("/admin");
  }
  return null;
}
