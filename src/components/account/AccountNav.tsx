"use client";

import Link from "next/link";
import type { AccountOverviewDTO } from "@/app/actions/account";

/**
 * The account sidebar.
 *
 * The identity card on top (name, tier, points — all from the database)
 * followed by the account routes. The caller passes the active route so the
 * sidebar does not have to read the pathname itself.
 */
export default function AccountNav({
  overview,
  active,
}: {
  overview: AccountOverviewDTO | null;
  active: string;
}) {
  return (
    <aside className="space-y-4">
      {/* Identity */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white p-4">
        <p className="text-[15px] font-bold tracking-[-0.01em] text-ink">
          {overview?.name ?? overview?.email ?? "—"}
        </p>

        <div className="mt-3 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 p-3 text-white">
          <p className="text-[12px] font-semibold">
            {overview?.level ? `Tier ${overview.level.name}` : "Tanpa tier"}
          </p>
          <p className="mt-1 text-[15px] font-bold">
            {(overview?.points ?? 0).toLocaleString("id-ID")} Poin
          </p>
        </div>
      </div>

      {/* Routes */}
      <nav className="overflow-hidden rounded-2xl border border-line bg-white">
        {ITEMS.map((item) => {
          const isActive = item.href === active;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`block border-b border-line px-4 py-3 text-[13px] transition-colors last:border-b-0 ${
                isActive
                  ? "bg-brand-soft font-semibold text-brand"
                  : "text-ink hover:bg-canvas"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

const ITEMS = [
  { href: "/account", label: "Pusat Akun" },
  { href: "/account/profile", label: "Profil Saya" },
  { href: "/account/orders", label: "Pesanan Saya" },
  { href: "/account/loyalty", label: "Poin & Level" },
  { href: "/account/payments", label: "Metode Pembayaran" },
  { href: "/account/reviews", label: "Review Saya" },
  { href: "/account/help", label: "Bantuan" },
  { href: "/account/settings", label: "Pengaturan" },
];
