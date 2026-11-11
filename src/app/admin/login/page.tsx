import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getAdminSession } from "@/lib/admin/session";
import AdminLoginForm from "./AdminLoginForm";

export const metadata: Metadata = {
  title: "Masuk · Admin",
  robots: { index: false, follow: false },
};

/**
 * Admin login — public route.
 *
 * It lives outside the `(secure)` route group so the guarded layout never
 * wraps it (no redirect loop).
 */
export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-[360px]">
        <div className="mb-7">
          <span className="text-[13px] font-semibold tracking-[-0.01em]">Booking VIP</span>
          <h1 className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-[var(--admin-muted)]">
            Admin
          </h1>
        </div>

        <div className="rounded-lg border border-[var(--admin-line)] bg-white p-6">
          <h2 className="mb-4 text-[15px] font-semibold tracking-[-0.01em]">Masuk</h2>
          <Suspense fallback={null}>
            <AlreadySignedIn />
          </Suspense>
          <AdminLoginForm />
        </div>

        <p className="mt-4 text-[12px] text-[var(--admin-muted)]">
          Area khusus operator. Akun harus punya role <code>ADMIN</code> — email
          yang terdaftar di <code>ADMIN_EMAILS</code> otomatis mendapat role itu
          saat login pertama.
        </p>

        <p className="mt-2 text-[12px] text-[var(--admin-muted)]">
          Bukan admin?{" "}
          <Link href="/login" className="underline hover:text-[var(--admin-ink)]">
            Masuk sebagai user
          </Link>
        </p>
      </div>
    </div>
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
