"use client";

import Link from "next/link";
import {
  BellIcon,
  BoxIcon,
  ChevronRight,
  GiftIcon,
  ListIcon,
  StarIcon,
  TagIcon,
  UserIcon,
} from "@/components/icons";
import { useAccountOverview } from "@/components/providers/AccountProvider";
import SignOutButton from "@/components/account/SignOutButton";

/**
 * The account hub ("Pusat Akun").
 *
 * A greeting card with the points and the level on top, then the grid of
 * account menus. Everything is white with a thin border — the same quiet
 * surface as the rest of the site.
 */

type MenuItem = {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
};

const MENUS: MenuItem[] = [
  {
    href: "/account/profile",
    label: "Profil Saya",
    description: "Nama, email, nomor telepon dan password",
    icon: <UserIcon width={18} height={18} />,
  },
  {
    href: "/account/loyalty",
    label: "Poin & Level",
    description: "Lihat poin yang dikumpulkan dan level kamu",
    icon: <GiftIcon width={18} height={18} />,
  },
  {
    href: "/account/payments",
    label: "Metode Pembayaran",
    description: "Kartu tersimpan, Xendit dan PayPal",
    icon: <TagIcon width={18} height={18} />,
  },
  {
    href: "/account/reviews",
    label: "Review Saya",
    description: "Komentar kamu di setiap tempat yang dikunjungi",
    icon: <StarIcon width={18} height={18} />,
  },
  {
    href: "/account/orders",
    label: "Pesanan",
    description: "Riwayat pesanan dan unduh invoice",
    icon: <BoxIcon width={18} height={18} />,
  },
  {
    href: "/account/help",
    label: "Bantuan",
    description: "Pusat bantuan customer service",
    icon: <BellIcon width={18} height={18} />,
  },
];

export default function AccountHub() {
  const { overview, loading } = useAccountOverview();

  const firstName = (overview?.name ?? "").split(" ")[0] || "Kamu";
  const level = overview?.level;
  const next = overview?.nextLevel;
  const progress =
    level && next && next.minPoints > level.minPoints
      ? Math.min(
          100,
          Math.max(
            0,
            ((overview!.points - level.minPoints) / (next.minPoints - level.minPoints)) * 100,
          ),
        )
      : 100;

  return (
    <div>
      {/* Greeting + points */}
      <section className="rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">
              Halo, {firstName}
            </p>
            <h1 className="mt-1 truncate text-[22px] font-bold tracking-[-0.01em] text-ink md:text-[26px]">
              {overview?.name ?? "Akun Saya"}
            </h1>
            <p className="mt-0.5 truncate text-[13px] text-muted">{overview?.email}</p>
          </div>
          <SignOutButton />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {/* Points */}
          <div className="rounded-xl border border-line bg-canvas/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted">
                Poin
              </span>
              <GiftIcon width={16} height={16} className="text-brand" />
            </div>
            <p className="mt-1 text-[28px] font-extrabold leading-none tracking-[-0.02em] text-ink">
              {loading ? "—" : (overview?.points ?? 0).toLocaleString("id-ID")}
            </p>
            <p className="mt-1 text-[12px] text-muted">Poin tersedia</p>
          </div>

          {/* Level */}
          <div className="rounded-xl border border-line bg-canvas/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted">
                Level
              </span>
              <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-brand-dark">
                {level?.name ?? "Member"}
              </span>
            </div>
            <p className="mt-1 text-[28px] font-extrabold leading-none tracking-[-0.02em] text-ink">
              {level?.code ?? "—"}
            </p>
            <p className="mt-1 text-[12px] text-muted">
              {next
                ? `${overview?.pointsToNext ?? 0} poin lagi menuju ${next.name}`
                : "Level tertinggi"}
            </p>
          </div>
        </div>

        {/* Progress to the next level */}
        {next ? (
          <div className="mt-5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas">
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : null}
      </section>

      {/* Menu grid */}
      <section className="mt-8">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
          Menu akun
        </h2>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MENUS.map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              className="group flex items-start gap-3.5 rounded-xl border border-line bg-white p-4 transition-colors hover:border-brand/40 hover:bg-brand-soft/40"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-dark">
                {menu.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold text-ink">{menu.label}</span>
                <span className="mt-0.5 block text-[12px] leading-relaxed text-muted">
                  {menu.description}
                </span>
              </span>
              <ChevronRight
                width={16}
                height={16}
                className="mt-1 shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
