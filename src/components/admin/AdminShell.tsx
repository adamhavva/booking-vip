import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

/**
 * Admin shell — sidebar + topbar + content.
 *
 * The admin area has its own structure: it never reuses the public site
 * `Header` / `Footer` / `Container`.
 */
export default function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-white text-[var(--admin-ink)]">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar email={email} />
        <main className="flex-1 px-8 py-7">{children}</main>
      </div>
    </div>
  );
}
