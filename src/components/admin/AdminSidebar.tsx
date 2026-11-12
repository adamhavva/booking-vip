"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BoxIcon,
  LayersIcon,
  ListIcon,
  MapPinIcon,
  TagIcon,
} from "@/components/icons";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const catalogItems: NavItem[] = [
  { href: "/admin/catalog/products", label: "Produk", icon: <BoxIcon width={16} height={16} /> },
  { href: "/admin/catalog/packages", label: "Paket", icon: <LayersIcon width={16} height={16} /> },
  { href: "/admin/catalog/service-types", label: "Tipe Layanan", icon: <ListIcon width={16} height={16} /> },
  { href: "/admin/catalog/price-tiers", label: "Price Tier", icon: <TagIcon width={16} height={16} /> },
  { href: "/admin/catalog/places", label: "Place", icon: <MapPinIcon width={16} height={16} /> },
  { href: "/admin/catalog/service-lines", label: "Service Line", icon: <LayersIcon width={16} height={16} /> },
  { href: "/admin/catalog/amenities", label: "Amenity", icon: <TagIcon width={16} height={16} /> },
  { href: "/admin/catalog/promos", label: "Promo", icon: <TagIcon width={16} height={16} /> },
];

const settingsItems: NavItem[] = [
  { href: "/admin/settings/popup", label: "Popup Homepage", icon: <ListIcon width={16} height={16} /> },
  { href: "/admin/settings/tax", label: "Pajak", icon: <TagIcon width={16} height={16} /> },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Admin sidebar — its own navigation, independent of the public site header.
 * Active state uses `usePathname()`, the same pattern as `NavBar`.
 */
export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex h-full w-[240px] shrink-0 flex-col border-r border-[var(--admin-line)] bg-white">
      <div className="px-6 py-5">
        <Link href="/admin" className="block">
          <span className="text-[13px] font-semibold tracking-[-0.01em]">Booking VIP</span>
          <span className="mt-0.5 block text-[11px] uppercase tracking-[0.08em] text-[var(--admin-muted)]">
            Admin
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-6">
        <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--admin-muted)]">
          Overview
        </p>
        <Link
          href="/admin"
          className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors ${
            pathname === "/admin"
              ? "bg-[var(--admin-hover)] font-medium text-[var(--admin-ink)]"
              : "text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-ink)]"
          }`}
        >
          <ListIcon width={16} height={16} />
          Dashboard
        </Link>

        <p className="px-3 pb-2 pt-6 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--admin-muted)]">
          Catalog
        </p>
        {catalogItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors ${
              isActive(pathname, item.href)
                ? "bg-[var(--admin-hover)] font-medium text-[var(--admin-ink)]"
                : "text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-ink)]"
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}

        <p className="px-3 pb-2 pt-6 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--admin-muted)]">
          Pengaturan
        </p>
        {settingsItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors ${
              isActive(pathname, item.href)
                ? "bg-[var(--admin-hover)] font-medium text-[var(--admin-ink)]"
                : "text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-ink)]"
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
