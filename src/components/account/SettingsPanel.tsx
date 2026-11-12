"use client";

import Link from "next/link";
import AccountPageHeader from "@/components/account/AccountPageHeader";
import { useAccountOverview } from "@/components/providers/AccountProvider";
import { useLocale } from "@/components/providers/LocaleProvider";

/**
 * The settings page.
 *
 * The navigation on the left comes from the account shell, so this panel is
 * only the settings themselves. Every control here is wired to something
 * real — the profile forms live on `/account/profile`, and the
 * language/currency switch is the site-wide one from `LocaleProvider`.
 */
export default function SettingsPanel() {
  const { overview } = useAccountOverview();
  const { lang, setLang, currency, setCurrency } = useLocale();

  return (
    <div>
      <AccountPageHeader
        title="Pengaturan"
        description="Atur akun, keamanan dan preferensi tampilan."
      />

      <div className="space-y-5">
        {/* Account & security */}
        <section className="rounded-2xl border border-line bg-white p-5 md:p-6">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
            Pusat Akun
          </h2>
          <p className="mt-1 text-[13px] text-muted">
            Ubah data profil dan kata sandi akun kamu.
          </p>

          <ul className="mt-4 divide-y divide-line border-y border-line">
            <SettingRow
              href="/account/profile"
              title="Pengaturan akun & profil"
              description="Nama dan nomor telepon."
            />
            <SettingRow
              href="/account/profile"
              title="Ganti kata sandi"
              description="Minimal 8 karakter, perlu kata sandi lama."
            />
            <SettingRow
              href="/account/loyalty"
              title="Poin & level"
              description={
                overview?.level
                  ? `Tier ${overview.level.name} · ${overview.points.toLocaleString("id-ID")} poin`
                  : "Lihat perolehan poin kamu."
              }
            />
          </ul>
        </section>

        {/* Language & currency */}
        <section className="rounded-2xl border border-line bg-white p-5 md:p-6">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
            Bahasa & mata uang
          </h2>
          <p className="mt-1 text-[13px] text-muted">
            Berlaku untuk seluruh halaman dan tersimpan di perangkat ini.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-ink">
                Bahasa
              </span>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as "en" | "id")}
                className="h-10 w-full rounded-lg border border-line bg-white px-3 text-[13px] text-ink outline-none transition-colors focus:border-brand"
              >
                <option value="id">Bahasa Indonesia</option>
                <option value="en">English</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-ink">
                Mata uang
              </span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as "USD" | "IDR")}
                className="h-10 w-full rounded-lg border border-line bg-white px-3 text-[13px] text-ink outline-none transition-colors focus:border-brand"
              >
                <option value="IDR">IDR — Rupiah</option>
                <option value="USD">USD — US Dollar</option>
              </select>
            </label>
          </div>
      </section>
      </div>
    </div>
  );
}

function SettingRow({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center justify-between gap-4 py-3.5 transition-colors hover:bg-canvas"
      >
        <span>
          <span className="block text-[13px] font-medium text-ink">{title}</span>
          <span className="block text-[12px] text-muted">{description}</span>
        </span>
        <span className="shrink-0 text-[13px] font-semibold text-brand">Buka</span>
      </Link>
    </li>
  );
}
