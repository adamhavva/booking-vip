"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Container from "@/components/ui/Container";
import { CloseIcon, MenuIcon, SearchIcon } from "@/components/icons";
import { searchPlaceholders } from "@/data/home";
import { serviceNav } from "@/data/services";
import { useLocale, type Lang } from "@/components/providers/LocaleProvider";
import { SUPPORTED, type CurrencyCode } from "@/lib/currency";

/**
 * Primary navigation bar: the search field plus the four service menus.
 * Rendered on every page — over the hero on the home page (`overlay`),
 * on a solid white bar on the service sub-pages (`solid`).
 */
export default function NavBar({
  variant = "overlay",
}: {
  variant?: "overlay" | "solid";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, setLang, currency, setCurrency, t } = useLocale();
  const solid = variant === "solid";

  const [idx, setIdx] = useState(0);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(
      () => setIdx((i) => (i + 1) % searchPlaceholders.length),
      2800
    );
    return () => clearInterval(t);
  }, []);

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  return (
    <nav
      className={
        solid
          ? "border-t border-line bg-white"
          : "border-t border-white/10 bg-transparent"
      }
    >
      <Container className="flex items-center gap-3 py-2.5">
        {/* Search lives in the navbar */}
        <form onSubmit={submit} className="relative w-full lg:max-w-sm lg:flex-1">
          <SearchIcon
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            width={18}
            height={18}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholders[idx]}
            aria-label={t("nav.searchAria")}
            className="h-11 w-full rounded-full bg-white pl-11 pr-4 text-sm text-ink shadow-sm outline-none placeholder:text-muted"
          />
        </form>

        {/* Service menus */}
        <ul className="no-scrollbar hidden items-center gap-1 lg:ml-auto lg:flex lg:gap-2">
          {serviceNav.map((s) => {
            const active = pathname === s.href;
            return (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className={`block whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-brand-soft text-brand"
                      : solid
                        ? "text-ink hover:bg-canvas"
                        : "text-white/90 hover:bg-white/10"
                  }`}
                >
                  {s.label}
                </Link>
              </li>
            );
          })}
          <li>
            <Link
              href="/airport-vip"
              className={`block whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                pathname === "/airport-vip"
                  ? "bg-brand-soft text-brand"
                  : solid
                    ? "text-ink hover:bg-canvas"
                    : "text-white/90 hover:bg-white/10"
              }`}
            >
              Fast Track
            </Link>
          </li>
          <li>
            <Link
              href="/my-booking"
              className={`block whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                pathname === "/my-booking"
                  ? "bg-brand-soft text-brand"
                  : solid
                    ? "text-ink hover:bg-canvas"
                    : "text-white/90 hover:bg-white/10"
              }`}
            >
              {t("nav.myBooking")}
            </Link>
          </li>
        </ul>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={t("nav.menu")}
          aria-expanded={menuOpen}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full lg:hidden ${
            solid ? "bg-canvas text-ink" : "bg-white/20 text-white"
          }`}
        >
          {menuOpen ? (
            <CloseIcon width={18} height={18} />
          ) : (
            <MenuIcon width={18} height={18} />
          )}
        </button>
      </Container>

      {/* Mobile drawer */}
      {menuOpen && (
        <div
          className={`border-t lg:hidden ${
            solid ? "border-line bg-white" : "border-white/10 bg-hero-to"
          }`}
        >
          <Container className="py-2">
            <ul className="flex flex-col">
              {serviceNav.map((s) => {
                const active = pathname === s.href;
                return (
                  <li key={s.href}>
                    <Link
                      href={s.href}
                      className={`flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm font-semibold ${
                        active
                          ? "bg-brand-soft text-brand"
                          : solid
                            ? "text-ink"
                            : "text-white/90"
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br ${s.tone} text-[9px] font-bold text-white`}
                      >
                        {s.short}
                      </span>
                      {s.label}
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link
                  href="/airport-vip"
                  className={`flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm font-semibold ${
                    pathname === "/airport-vip"
                      ? "bg-brand-soft text-brand"
                      : solid
                        ? "text-ink"
                        : "text-white/90"
                  }`}
                >
                  Fast Track
                </Link>
              </li>
              <li>
                <Link
                  href="/my-booking"
                  className={`flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm font-semibold ${
                    pathname === "/my-booking"
                      ? "bg-brand-soft text-brand"
                      : solid
                        ? "text-ink"
                        : "text-white/90"
                  }`}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-brand to-brand-dark text-[9px] font-bold text-white">
                    MB
                  </span>
                  {t("nav.myBooking")}
                </Link>
              </li>
              <li>
                <Link
                  href="/account"
                  className={`flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm font-semibold ${
                    pathname === "/account"
                      ? "bg-brand-soft text-brand"
                      : solid
                        ? "text-ink"
                        : "text-white/90"
                  }`}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-ink to-muted text-[9px] font-bold text-white">
                    AK
                  </span>
                  {t("nav.account")}
                </Link>
              </li>
            </ul>

            <div
              className={`my-2 h-px ${
                solid ? "bg-line" : "bg-white/15"
              }`}
            />

            <div
              className={`px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider ${
                solid ? "text-muted" : "text-white/50"
              }`}
            >
              {t("locale.language")}
            </div>
            <div className="flex gap-2 px-2">
              {([
                { code: "en" as Lang, label: t("locale.english") },
                { code: "id" as Lang, label: t("locale.indonesia") },
              ]).map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-semibold transition-colors ${
                    lang === l.code
                      ? "bg-brand-soft text-brand"
                      : solid
                        ? "bg-canvas text-ink"
                        : "bg-white/10 text-white/90"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <div
              className={`mt-3 px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider ${
                solid ? "text-muted" : "text-white/50"
              }`}
            >
              {t("locale.currency")}
            </div>
            <div className="flex gap-2 px-2">
              {SUPPORTED.map((s) => (
                <button
                  key={s.code}
                  onClick={() => setCurrency(s.code as CurrencyCode)}
                  className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-semibold transition-colors ${
                    currency === s.code
                      ? "bg-brand-soft text-brand"
                      : solid
                        ? "bg-canvas text-ink"
                        : "bg-white/10 text-white/90"
                  }`}
                >
                  {s.symbol} {s.code}
                </button>
              ))}
            </div>
          </Container>
        </div>
      )}
    </nav>
  );
}
