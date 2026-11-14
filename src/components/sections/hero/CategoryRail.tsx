"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowRightIcon,
  CarIcon,
  CompassIcon,
  PassportIcon,
  PlaneIcon,
} from "@/components/icons";
import { useLocale } from "@/components/providers/LocaleProvider";
import { getCampaignDiscounts } from "@/app/actions/promo";
import { serviceNav, serviceRailMeta, type ServiceRailIcon } from "@/data/services";
import type { DictKey } from "@/i18n";

/** Rail glyph per icon key — the single icon module owns the shapes. */
const RAIL_ICONS: Record<ServiceRailIcon, ReactNode> = {
  plane: <PlaneIcon width={18} height={18} />,
  car: <CarIcon width={18} height={18} />,
  compass: <CompassIcon width={18} height={18} />,
  passport: <PassportIcon width={18} height={18} />,
};

/** Translated rail label per line slug; unknown slugs fall back to the DB label. */
const CAT_KEYS: Record<string, DictKey> = {
  "vip-service": "hero.cat.vip",
  transport: "hero.cat.transport",
  "tour-package": "hero.cat.tour",
  evoa: "hero.cat.evoa",
};

/**
 * The fixed four service categories of the home hero rail — static config,
 * not operator-editable data. Only the glyph and the discount badge are
 * presentational constants (data/services.ts); labels are dictionary keys.
 */
const RAIL_ENTRIES = serviceNav.map((nav) => ({
  slug: nav.href.replace(/^\//, ""),
  tone: nav.tone,
  fallbackLabel: nav.label,
  ...serviceRailMeta[nav.href.replace(/^\//, "")],
}));

/**
 * The floating category pill of the home hero — the tab group sits centered
 * while it fits, and falls back to horizontal scroll with circular scroll
 * buttons at the ends once it overflows (mobile). Selecting a tab switches
 * the field set of the search card below it.
 */
export default function CategoryRail({
  activeSlug,
  onSelect,
}: {
  activeSlug: string;
  onSelect: (slug: string) => void;
}) {
  const { t } = useLocale();
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  // Averaged campaign discount per line — fetched on the client (the page
  // stays static). Falls back to the serviceRailMeta constant per line.
  const [campaignDiscounts, setCampaignDiscounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let active = true;
    getCampaignDiscounts().then((discounts) => {
      if (active) setCampaignDiscounts(discounts);
    });
    return () => {
      active = false;
    };
  }, []);

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({
      left: el.scrollLeft > 4,
      right: max > 4 && el.scrollLeft < max - 4,
    });
  }, []);

  useEffect(() => {
    measure();
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const scroll = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.6, 160), behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div className="relative rounded-full border border-line/70 bg-white shadow-lg shadow-slate-900/15">
      {/* Fade masks over the scrollable ends */}
      {edges.left && (
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 rounded-l-full bg-gradient-to-r from-white via-white/80 to-transparent" />
      )}
      {edges.right && (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 rounded-r-full bg-gradient-to-l from-white via-white/80 to-transparent" />
      )}

      <div
        ref={scroller}
        role="tablist"
        aria-label={t("hero.railAria")}
        onScroll={measure}
        className="flex overflow-x-auto px-2 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* mx-auto centers the group while it fits; auto margins collapse to
            zero on overflow, so the scroll fallback stays left-anchored. */}
        <div className="mx-auto flex items-center gap-1">
        {RAIL_ENTRIES.map((l, i) => {
          const active = l.slug === activeSlug;
          const catKey = CAT_KEYS[l.slug];
          const percent = campaignDiscounts[l.slug] ?? l.discountPercent;
          return (
            <button
              key={l.slug}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(l.slug)}
              style={{ animationDelay: `${120 + i * 70}ms` }}
              className={`hero-tab flex shrink-0 items-center gap-2.5 rounded-full px-3.5 py-2 transition-colors ${
                active ? "bg-brand-soft" : "hover:bg-canvas"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-sm ${l.tone}`}
              >
                {RAIL_ICONS[l.icon ?? "plane"]}
              </span>
              <span
                className={`whitespace-nowrap text-sm font-bold ${
                  active ? "text-brand" : "text-ink"
                }`}
              >
                {catKey ? t(catKey) : l.fallbackLabel}
              </span>
              {percent != null && percent > 0 && (
                <span className="rounded-full bg-danger px-2 py-0.5 text-[11px] font-extrabold tabular-nums text-white">
                  -{percent}%
                </span>
              )}
            </button>
          );
        })}
        </div>
      </div>

      {/* Circular scroll buttons — hidden unless that end has more rail */}
      {edges.left && (
        <button
          type="button"
          aria-label={t("hero.railScroll")}
          onClick={() => scroll(-1)}
          className="absolute left-1 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-ink shadow-md transition hover:text-brand active:scale-95"
        >
          <ArrowRightIcon width={18} height={18} className="rotate-180" />
        </button>
      )}
      {edges.right && (
        <button
          type="button"
          aria-label={t("hero.railScroll")}
          onClick={() => scroll(1)}
          className="absolute right-1 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-ink shadow-md transition hover:text-brand active:scale-95"
        >
          <ArrowRightIcon width={18} height={18} />
        </button>
      )}
    </div>
  );
}