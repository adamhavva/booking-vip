"use client";

import { useCallback } from "react";
import Link from "next/link";
import { getAdminStats } from "@/app/actions/admin";
import type { AdminStats } from "@/types/admin";
import { adminClass } from "@/components/admin/tokens";
import { useAdminValue } from "@/components/admin/useAdminList";

const CARDS: { key: keyof AdminStats; label: string; href: string }[] = [
  { key: "products", label: "Produk", href: "/admin/catalog/products" },
  { key: "packages", label: "Paket", href: "/admin/catalog/packages" },
  { key: "serviceTypes", label: "Tipe Layanan", href: "/admin/catalog/service-types" },
  { key: "priceTiers", label: "Price Tier", href: "/admin/catalog/price-tiers" },
  { key: "places", label: "Place", href: "/admin/catalog/places" },
  { key: "serviceLines", label: "Service Line", href: "/admin/catalog/service-lines" },
  { key: "amenities", label: "Amenity", href: "/admin/catalog/amenities" },
  { key: "productAmenities", label: "Relasi Amenity", href: "/admin/catalog/products" },
  { key: "productAddOns", label: "Relasi Add-on", href: "/admin/catalog/products" },
];

/** Admin dashboard — a snapshot of the catalog plus quick links. */
export default function AdminDashboard() {
  const load = useCallback(() => getAdminStats(), []);
  const { data: stats, loading, error } = useAdminValue<AdminStats>(load);

  return (
    <div>
      <div className="mb-6">
        <h2 className={adminClass.h1}>Dashboard</h2>
        <p className="mt-1 text-[13px] text-[var(--admin-muted)]">
          Ringkasan isi katalog. Semua angka dibaca langsung dari database.
        </p>
      </div>

      {error ? (
        <p className={`${adminClass.panel} mb-4 px-3 py-2 text-[12px] text-danger`}>{error}</p>
      ) : null}

      {loading ? (
        <p className="text-[13px] text-[var(--admin-muted)]">Memuat…</p>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {CARDS.map((card) => (
              <Link
                key={card.key}
                href={card.href}
                className={`${adminClass.panel} px-4 py-4 transition-colors hover:bg-[var(--admin-hover)]`}
              >
                <span className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--admin-muted)]">
                  {card.label}
                </span>
                <span className="mt-1.5 block text-[22px] font-semibold tabular-nums tracking-[-0.02em]">
                  {stats[card.key]}
                </span>
              </Link>
            ))}
          </div>

          <div className={`${adminClass.panel} mt-6 px-5 py-4`}>
            <p className="text-[13px]">
              <span className="tabular-nums font-medium">{stats.activeProducts}</span> dari{" "}
              <span className="tabular-nums">{stats.products}</span> produk sedang aktif.
            </p>
            <p className="mt-1 text-[12px] text-[var(--admin-muted)]">
              Halaman ini hanya mencakup slice katalog. Pengaturan, media, promo, banner, artikel,
              dan booking belum termasuk.
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
