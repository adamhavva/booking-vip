export function usd(value: number): string {
  return "$" + value.toLocaleString("en-US");
}

/**
 * Format an ISO date (`YYYY-MM-DD`) as a readable label — "3 Nov 2026".
 * Returns the raw value when it cannot be parsed.
 */
export function formatDateLabel(iso?: string, locale = "en-GB"): string {
  if (!iso) return "";
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Today as `YYYY-MM-DD` in local time — the earliest bookable day. */
export function todayISO(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** The locale used to render dates — "24 Dec 2026" / "24 Des 2026". */
export function localeFor(lang?: string): string {
  return lang === "id" ? "id-ID" : "en-GB";
}
