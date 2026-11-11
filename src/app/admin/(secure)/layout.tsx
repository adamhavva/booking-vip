import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getAdminSession } from "@/lib/admin/session";
import AdminShell from "@/components/admin/AdminShell";

/**
 * Layout of the guarded admin area.
 *
 * The session is read at request time. With Cache Components enabled a
 * `cookies()` read outside a `<Suspense>` boundary is a build error, so the
 * guard lives in its own component behind a boundary — the rest of the admin
 * subtree streams in once the session has been verified.
 */
export default function AdminSecureLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<AdminFallback />}>
      <AdminGuard>{children}</AdminGuard>
    </Suspense>
  );
}

/** Fallback shown while the session is being verified. */
function AdminFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white text-[13px] text-[var(--admin-muted)]">
      Memuat…
    </div>
  );
}

/** Reads the session and redirects to the login page when there is none. */
async function AdminGuard({ children }: { children: React.ReactNode }) {
  // Verifying the Firebase session cookie reads the clock, which is not
  // allowed while prerendering — the guard must only run for a real request.
  await connection();

  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return <AdminShell email={session.email}>{children}</AdminShell>;
}
