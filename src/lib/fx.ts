import "server-only";

import { db } from "@/prisma/db";

/**
 * The server-side FX rates.
 *
 * The browser gets its rates from the Frankfurter API (cached in
 * `localStorage`), but the payment gateway needs the rate on the server: the
 * amount that is charged is computed from the booking total (USD cents) and
 * the rate at the moment the invoice is created.
 *
 * The order of preference:
 *
 *   1. the `ExchangeRate` table — the admin override / the last snapshot;
 *   2. the Frankfurter API;
 *   3. the hard-coded fallback, so a booking never fails because of a rate.
 */

/** The fallback rates — USD is always 1. */
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  IDR: 16500,
};

/**
 * How many units of `currency` one US dollar is worth.
 *
 * The result is always a positive number.
 */
export async function getUsdRate(currency: string): Promise<number> {
  const code = currency.trim().toUpperCase();
  if (!code || code === "USD") return 1;

  // 1. The database — the admin can override the rate there.
  try {
    const rows = await db.orm.public.ExchangeRate
      .select("ratePerUsd", "rateDate")
      .where((f) => f.code.eq(code))
      .orderBy((f) => f.rateDate.desc())
      .limit(1)
      .all();

    const rate = rows[0]?.ratePerUsd;
    if (typeof rate === "number" && Number.isFinite(rate) && rate > 0) {
      return rate;
    }
  } catch {
    // The table is not reachable — fall through to the API.
  }

  // 2. The public API.
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(
      `https://api.frankfurter.dev/v1/latest?base=USD&symbols=${code}`,
      { signal: ctrl.signal, cache: "no-store" },
    );
    clearTimeout(timer);
    if (!res.ok) throw new Error(`fx ${res.status}`);

    const json = (await res.json()) as { rates?: Record<string, number> };
    const rate = json.rates?.[code];
    if (typeof rate === "number" && Number.isFinite(rate) && rate > 0) {
      return rate;
    }
  } catch {
    // Network failure — the fallback below keeps the flow alive.
  }

  // 3. The fallback.
  return FALLBACK_RATES[code] ?? 1;
}

/**
 * Convert an amount in USD cents into the cents of another currency.
 *
 * The conversion is rounded to the nearest cent, so the gateway receives an
 * exact amount.
 */
export function convertUsdCents(
  usdCents: number,
  rate: number,
): number {
  if (!Number.isFinite(rate) || rate <= 0) return usdCents;
  return Math.round(usdCents * rate);
}
