/**
 * The booking rules of the airport VIP service.
 *
 * This module is pure: it is imported by the client wizard, so it must not
 * reach for the database. The `Setting` reads live in `src/lib/airport-vip.ts`
 * alongside the other loaders of the page.
 *
 * The rules live in the generic `Setting` table under a single JSON key, so
 * an operator can change them without a deploy and without a migration. One
 * key rather than one row per rule is deliberate: `seedSettings()` deletes
 * every `Setting` key it does not know about, so a set of loose keys would
 * disappear on the next seed run.
 *
 * The surcharges are **display only**. `createBooking` is shared by the
 * product wizard, transport and tours, so applying them there would silently
 * reprice those flows too — that is a separate decision. The one rule that is
 * genuinely enforced is the lead time, which `createBooking` already
 * validates from the product's own `leadTimeHours` / `leadTimeDays`.
 */

export const BOOKING_RULES_KEY = "booking.rules";
export const SERVICE_INFO_KEY = "vip.serviceInfo";

export type BookingRules = {
  /** Minimum hours between booking and service start. */
  minLeadHours: number;
  /** Surcharge when the booking is made inside the lead time, in percent. */
  shortNoticePercent: number;
  overnightPercent: number;
  /** "HH:MM" — when the overnight window opens. */
  overnightFrom: string;
  /** "HH:MM" — when it closes. */
  overnightTo: string;
  weekendPercent: number;
  holidayPercent: number;
  /** Discount for infants up to 24 months, in percent. */
  infantDiscountPercent: number;
  /** Discount for children aged 3–12, in percent. */
  childDiscountPercent: number;
};

export const DEFAULT_BOOKING_RULES: BookingRules = {
  minLeadHours: 24,
  shortNoticePercent: 0,
  overnightPercent: 30,
  overnightFrom: "22:00",
  overnightTo: "06:00",
  weekendPercent: 0,
  holidayPercent: 0,
  infantDiscountPercent: 0,
  childDiscountPercent: 0,
};

/** Read one numeric field, falling back to the default when it is unusable. */
function num(source: Record<string, unknown>, key: keyof BookingRules): number {
  const value = source[key];
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : (DEFAULT_BOOKING_RULES[key] as number);
}

/** Read one "HH:MM" field, falling back to the default. */
function clock(source: Record<string, unknown>, key: keyof BookingRules): string {
  const value = source[key];
  return typeof value === "string" && /^\d{2}:\d{2}$/.test(value)
    ? value
    : (DEFAULT_BOOKING_RULES[key] as string);
}

/**
 * Turn a stored value into rules.
 *
 * Every field falls back to its default on its own, so a half-written or
 * hand-edited setting still produces a complete, renderable table.
 */
export function parseBookingRules(value: unknown): BookingRules {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return DEFAULT_BOOKING_RULES;
  }

  const source = value as Record<string, unknown>;

  return {
    minLeadHours: num(source, "minLeadHours"),
    shortNoticePercent: num(source, "shortNoticePercent"),
    overnightPercent: num(source, "overnightPercent"),
    overnightFrom: clock(source, "overnightFrom"),
    overnightTo: clock(source, "overnightTo"),
    weekendPercent: num(source, "weekendPercent"),
    holidayPercent: num(source, "holidayPercent"),
    infantDiscountPercent: num(source, "infantDiscountPercent"),
    childDiscountPercent: num(source, "childDiscountPercent"),
  };
}

/**
 * What the greeter does, per airport.
 *
 * `Product.included` is the proper home for these steps, but it is empty for
 * every VIP product in the live database and writes to `Product` are blocked
 * by the pending migration. So the copy lives in one `Setting` key, keyed by
 * IATA code with a `default` fallback, and `Product.included` still wins when
 * it is filled — the day the migration lands, the row takes over with no code
 * change.
 *
 * The value is a JSON object rather than a string on purpose: `listTaxSettings`
 * scans every `Setting` row and treats any string ending in "%" or starting
 * with "$" as a tax on every booking. An object can never be mistaken for one.
 */
export type ServiceInfo = {
  /** The numbered steps of the service. */
  steps: string[];
  /** A free-text note shown under the steps. */
  note?: string;
};

export type ServiceInfoMap = Record<string, ServiceInfo>;

/** Read one entry of the service-info setting. */
export function parseServiceInfo(value: unknown): ServiceInfo | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const source = value as Record<string, unknown>;
  const steps = Array.isArray(source.steps)
    ? source.steps.filter(
        (step): step is string => typeof step === "string" && step.trim() !== "",
      )
    : [];
  const note =
    typeof source.note === "string" && source.note.trim()
      ? source.note.trim()
      : undefined;

  if (steps.length === 0 && !note) return null;
  return { steps, note };
}

/**
 * The steps to show for one service.
 *
 * The product's own `included` list wins; otherwise the airport's entry, then
 * the shared default.
 */
export function resolveServiceSteps(
  info: ServiceInfoMap,
  included: string[],
  iataCode: string | null,
): string[] {
  if (included.length > 0) return included;
  if (iataCode && info[iataCode]?.steps.length) return info[iataCode].steps;
  return info.default?.steps ?? [];
}

/** A percentage, rendered the way the rules table shows it. */
function percent(value: number): string {
  return value > 0 ? `${value} %` : "tidak ada";
}

/** A discount, rendered the way the rules table shows it. */
function discount(value: number): string {
  return value > 0 ? `diskon ${value} %` : "tanpa diskon";
}

/**
 * The rules as label/value rows, ready to render.
 *
 * `leadTimeHours` / `leadTimeDays` come from the selected product. They win
 * over `minLeadHours` because they are what the server actually enforces, so
 * the row shows the rule the customer will really be held to.
 */
export function bookingRuleRows(
  rules: BookingRules,
  leadTime?: { hours: number; days: number },
): { label: string; value: string }[] {
  const effectiveHours =
    leadTime && leadTime.days > 0
      ? leadTime.days * 24
      : leadTime && leadTime.hours > 0
        ? leadTime.hours
        : rules.minLeadHours;

  const leadLabel =
    effectiveHours >= 24 && effectiveHours % 24 === 0
      ? `${effectiveHours / 24} hari`
      : `${effectiveHours} jam`;

  return [
    { label: "Minimal sebelum waktu layanan", value: leadLabel },
    { label: "Biaya pemesanan mendadak", value: percent(rules.shortNoticePercent) },
    { label: "Biaya tengah malam", value: percent(rules.overnightPercent) },
    {
      label: "Periode tengah malam",
      value: `${rules.overnightFrom}–${rules.overnightTo}`,
    },
    { label: "Biaya akhir pekan", value: percent(rules.weekendPercent) },
    { label: "Biaya hari libur nasional", value: percent(rules.holidayPercent) },
    { label: "Bayi (di bawah 24 bulan)", value: discount(rules.infantDiscountPercent) },
    { label: "Anak 3–12 tahun", value: discount(rules.childDiscountPercent) },
  ];
}
