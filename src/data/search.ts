// Client-side search index built from the placeholder data in home.ts.
// Used by the navbar search box and the /search results page.

import { evoaPlans, promos, tours, transports, vipServices } from "@/data/home";
import type { SearchResult } from "@/types";

export const searchIndex: SearchResult[] = [
  ...vipServices.map((s) => ({
    kind: "Airport VIP Service",
    title: s.title,
    subtitle: s.airport,
    href: "/vip-service",
    tone: s.tone,
    priceUsd: s.priceNet,
  })),
  ...transports.map((t) => ({
    kind: "Transport",
    title: t.model,
    subtitle: t.category,
    href: "/transport",
    tone: t.tone,
    priceUsd: t.priceNet,
  })),
  ...tours.map((t) => ({
    kind: "Tour Package",
    title: t.title,
    subtitle: `${t.location} · ${t.duration}`,
    href: "/tour-package",
    tone: t.tone,
    priceUsd: t.priceNet,
  })),
  ...evoaPlans.map((p) => ({
    kind: "eVOA",
    title: p.name,
    subtitle: `${p.stay} · processing ${p.processing}`,
    href: "/evoa",
    tone: p.tone,
    priceUsd: p.priceNet,
  })),
  ...promos.map((p) => ({
    kind: "Promo",
    title: p.title,
    subtitle: p.subtitle,
    href: "/",
    tone: p.tone,
  })),
];

/** Case-insensitive match across title, subtitle and kind. */
export function searchAll(query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return searchIndex.filter(
    (r) =>
      r.title.toLowerCase().includes(q) ||
      r.subtitle.toLowerCase().includes(q) ||
      r.kind.toLowerCase().includes(q)
  );
}
