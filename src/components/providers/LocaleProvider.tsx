"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ensureRates,
  formatMoneyWith,
  type CurrencyCode,
} from "@/lib/currency";
import { makeTranslator, type DictKey } from "@/i18n";

// ---------------------------------------------------------------------------
// Locale + currency context.
//
// `useLocale()` is the single hook components use to read the user's language
// and currency preferences and to format prices. The shape is a hard contract
// for Tasks 3-5 — do not rename fields.
// ---------------------------------------------------------------------------

export type Lang = "en" | "id";

type LocaleState = {
  lang: Lang;
  setLang: (l: Lang) => void;
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  formatMoney: (usd: number) => string;
  /** Translate a dictionary key using the current language. */
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleState | null>(null);

const LANG_KEY = "booking-vip:locale";
const CURRENCY_KEY = "booking-vip:currency";

function readPref<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writePref(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable — ignore.
  }
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD");
  const [rates, setRates] = useState<Record<string, number>>({ IDR: 16500 });

  // Hydrate preferences from localStorage on mount.
  useEffect(() => {
    const l = readPref<Lang>(LANG_KEY, "en");
    const c = readPref<CurrencyCode>(CURRENCY_KEY, "USD");
    setLangState(l === "id" ? "id" : "en");
    setCurrencyState(c === "IDR" ? "IDR" : "USD");

    ensureRates().then((r) => setRates(r));
  }, []);

  // Keep <html lang="…"> in sync with the user's choice.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    writePref(LANG_KEY, l);
  }, []);

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c);
    writePref(CURRENCY_KEY, c);
  }, []);

  const formatMoney = useCallback(
    (usd: number) => formatMoneyWith(usd, currency, rates),
    [currency, rates]
  );

  // Bound translator for the current language.
  const translate = useCallback(
    (key: DictKey, vars?: Record<string, string | number>) =>
      makeTranslator(lang)(key, vars),
    [lang]
  );

  const value = useMemo<LocaleState>(
    () => ({ lang, setLang, currency, setCurrency, formatMoney, t: translate }),
    [lang, setLang, currency, setCurrency, formatMoney, translate]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

/**
 * Read the current locale/currency + helpers.
 *
 * Contract shape for Tasks 3-5: `{ lang, setLang, currency, setCurrency,
 * formatMoney }` — do not rename fields.
 */
export function useLocale(): LocaleState {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return ctx;
}
