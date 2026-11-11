"use client";

import { usePathname } from "next/navigation";
import { signOutAdmin } from "@/app/actions/admin-auth";
import { LogoutIcon } from "@/components/icons";

const TITLES: [string, string][] = [
  ["/admin/catalog/products", "Produk"],
  ["/admin/catalog/packages", "Paket"],
  ["/admin/catalog/service-types", "Tipe Layanan"],
  ["/admin/catalog/price-tiers", "Price Tier"],
  ["/admin/catalog/places", "Place"],
  ["/admin/catalog/service-lines", "Service Line"],
  ["/admin/catalog/amenities", "Amenity"],
];

/**
 * The title of the current section.
 *
 * The create and edit pages live below the module path
 * (`/admin/catalog/products/new`), so the title is matched by prefix — the
 * longest matching prefix wins.
 */
function titleFor(pathname: string): string {
  if (pathname === "/admin") return "Dashboard";

  let title = "Admin";
  let best = -1;
  for (const [prefix, label] of TITLES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      if (prefix.length > best) {
        best = prefix.length;
        title = label;
      }
    }
  }
  return title;
}

/**
 * Admin topbar — current section, the signed-in operator and a logout button.
 */
export default function AdminTopbar({ email }: { email: string }) {
  const pathname = usePathname();
  const title = titleFor(pathname);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-[var(--admin-line)] bg-white px-8">
      <h1 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h1>

      <div className="flex items-center gap-4">
        <span className="max-w-[220px] truncate text-[12px] text-[var(--admin-muted)]">{email}</span>
        <form action={signOutAdmin}>
          <button
            type="submit"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--admin-line)] bg-white px-2.5 text-[12px] font-medium text-[var(--admin-ink)] transition-colors hover:bg-[var(--admin-hover)]"
          >
            <LogoutIcon width={14} height={14} />
            Keluar
          </button>
        </form>
      </div>
    </header>
  );
}
