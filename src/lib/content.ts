// Client-side helpers for the DB-driven content layer.

import type { CopyDTO } from "@/types";

/** Read a piece of copy in the active language. */
export function copyText(copy: CopyDTO | null | undefined, lang: string): string {
  if (!copy) return "";
  if (lang === "id" && copy.id) return copy.id;
  return copy.en ?? "";
}

/**
 * Read a locale-aware setting. Settings are stored as `{ en, id }` objects
 * (or plain arrays/values) — this picks the right language.
 */
export function localeValue<T>(value: unknown, lang: string): T | null {
  if (value == null) return null;
  if (typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    if ("en" in record || "id" in record) {
      const picked = lang === "id" ? (record.id ?? record.en) : record.en;
      return (picked ?? null) as T | null;
    }
  }
  return value as T;
}
