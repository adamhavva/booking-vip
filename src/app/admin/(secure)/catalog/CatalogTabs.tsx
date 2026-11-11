"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/catalog/products", label: "Produk" },
  { href: "/admin/catalog/packages", label: "Paket" },
  { href: "/admin/catalog/service-types", label: "Tipe Layanan" },
  { href: "/admin/catalog/price-tiers", label: "Price Tier" },
  { href: "/admin/catalog/places", label: "Place" },
  { href: "/admin/catalog/service-lines", label: "Service Line" },
  { href: "/admin/catalog/amenities", label: "Amenity" },
];

/** Tab navigation of the catalog section. */
export default function CatalogTabs() {
  const pathname = usePathname();

  return (
    <div className="mb-6 border-b border-[var(--admin-line)]">
      <nav className="-mb-px flex gap-6 overflow-x-auto">
        {TABS.map((tab) => {
          // The create and edit pages live below the module path, so the
          // active tab is matched by prefix.
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`whitespace-nowrap border-b-2 pb-2.5 text-[13px] font-medium transition-colors ${
                active
                  ? "border-[var(--admin-accent)] text-[var(--admin-ink)]"
                  : "border-transparent text-[var(--admin-muted)] hover:text-[var(--admin-ink)]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
