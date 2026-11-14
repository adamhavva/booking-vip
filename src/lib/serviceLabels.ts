// Shared mapping from the canonical (English) service labels used in the
// data layer / query strings to dictionary keys, so every surface that
// shows a service name switches with the active language.

import type { DictKey } from "@/i18n";

/** Canonical service label → dictionary key. "eVOA" is a brand term and stays. */
export const SERVICE_LABEL_KEYS: Record<string, DictKey> = {
  "Airport VIP Service": "nav.vipService",
  Transport: "nav.transport",
  "Tour Package": "nav.tourPackage",
};

/** Line slug → dictionary key (the hero rail / nav labels). */
export const SERVICE_SLUG_KEYS: Record<string, DictKey> = {
  "vip-service": "nav.vipService",
  transport: "nav.transport",
  "tour-package": "nav.tourPackage",
  // "eVOA" is a brand term — the same in both languages.
  evoa: "hero.cat.evoa",
};

/**
 * Translate a tab label when it is a known service name or "All";
 * anything else (a product term such as "Meet & Greet") passes through.
 */
export function tabKey(label: string): DictKey | null {
  if (label === "All") return "common.all";
  return SERVICE_LABEL_KEYS[label] ?? null;
}