// Currency formatting + FX rate helpers.
//
// All prices in the data layer are stored as USD integers. At render time we
// convert them to the user's chosen currency via `formatMoneyWith`, which uses
// `Intl.NumberFormat` so the grouping/separators match the locale.
//
// FX rates are fetched lazily from the public Frankfurter API and cached in
// localStorage keyed by date. When the network is unavailable we fall back to
// the cached rate — or a hard-coded fallback rate — so prices always render.

export type CurrencyCode = "USD" | "IDR";

export type CurrencySpec = {
  code: CurrencyCode;
  symbol: string;
  decimals: number;
  locale: string;
  fallbackRate: number;
};

export const SUPPORTED: CurrencySpec[] = [
  { code: "USD", symbol: "$", decimals: 2, locale: "en-US", fallbackRate: 1 },
  { code: "IDR", symbol: "Rp", decimals: 0, locale: "id-ID", fallbackRate: 16500 },
];

export const CURRENCY_BY_CODE: Record<CurrencyCode, CurrencySpec> = Object.fromEntries(
  SUPPORTED.map((s) => [s.code, s])
) as Record<CurrencyCode, CurrencySpec>;

const FX_KEY = "booking-vip:fx";

type FxCache = {
  date: string; // YYYY-MM-DD
  rates: Record<string, number>;
};

function today(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function readCache(): FxCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FX_KEY);
    return raw ? (JSON.parse(raw) as FxCache) : null;
  } catch {
    return null;
  }
}

function writeCache(cache: FxCache) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FX_KEY, JSON.stringify(cache));
  } catch {
    // Storage unavailable (private mode / quota) — ignore.
  }
}

/** USD base fallback rates for the currencies we support. */
const FALLBACK_RATES: Record<string, number> = {
  IDR: 16500,
};

/**
 * Ensure FX rates are available. Returns `{IDR: n}` (USD is always 1).
 *
 * - If the cache is dated today, reuse it (no network).
 * - Otherwise fetch `frankfurter.dev` with a 5s timeout.
 * - On any failure (network / CORS / timeout / bad JSON) return cache-or-
 *   fallback — never throws.
 */
export async function ensureRates(): Promise<Record<string, number>> {
  const cached = readCache();
  if (cached && cached.date === today()) {
    return { ...FALLBACK_RATES, ...cached.rates };
  }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(
      "https://api.frankfurter.dev/v1/latest?base=USD&symbols=IDR",
      { signal: ctrl.signal }
    );
    clearTimeout(timer);
    if (!res.ok) throw new Error(`fx ${res.status}`);
    const json = (await res.json()) as {
      date?: string;
      rates?: Record<string, number>;
    };
    if (!json.rates) throw new Error("fx no rates");
    const cache: FxCache = { date: json.date ?? today(), rates: json.rates };
    writeCache(cache);
    return { ...FALLBACK_RATES, ...json.rates };
  } catch {
    // Network failure — use cached (even stale) or fallback.
    return { ...FALLBACK_RATES, ...(cached?.rates ?? {}) };
  }
}

/**
 * Format a USD amount in the given currency. `rates` maps currency code →
 * USD multiplier (e.g. `{IDR: 16500}`). Unknown codes fall back to USD.
 */
export function formatMoneyWith(
  usd: number,
  code: string,
  rates: Record<string, number>
): string {
  const spec = CURRENCY_BY_CODE[code as CurrencyCode] ?? SUPPORTED[0];
  const rate = rates[spec.code] ?? spec.fallbackRate;
  const converted = usd * rate;
  return new Intl.NumberFormat(spec.locale, {
    style: "currency",
    currency: spec.code,
    minimumFractionDigits: spec.decimals,
    maximumFractionDigits: spec.decimals,
  }).format(converted);
}
