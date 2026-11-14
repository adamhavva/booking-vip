"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { useLocale, type Lang } from "@/components/providers/LocaleProvider";
import { makeTranslator } from "@/i18n";
import { formatMoneyWith, type CurrencyCode } from "@/lib/currency";

// `useLayoutEffect` warns when it runs on the server — pick the isomorphic
// variant so the flip happens before paint in the browser and is a plain
// effect during SSR.
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Hydration-safe view of `useLocale()` for components that are server-
 * rendered inside a streamed Suspense boundary (the home page's `HomeBody`).
 *
 * The boundary's HTML is prerendered/streamed with the provider's SSR
 * defaults (EN / USD), but it hydrates late — after the provider's mount
 * effect has already restored the visitor's stored locale. A plain
 * `useLocale()` render therefore disagrees with the server HTML and React
 * reports a hydration mismatch (the "Special deals" vs "Penawaran spesial"
 * class of errors).
 *
 * This hook returns EN/USD-bound copy on the component's FIRST render —
 * matching the server HTML whether the component hydrates early or late —
 * and flips to the live locale in a layout effect right after commit,
 * before paint, so there is no visible flash. Components that only mount
 * on the client (fetched catalogs) get the same one-commit flip.
 *
 * Use it instead of `useLocale()` in any component rendered by `HomeBody`.
 * Components outside the streamed boundary (Header, HeroSearch, Footer, …)
 * hydrate immediately with matching EN defaults and keep `useLocale()`.
 */
export function useMountedLocale() {
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);
  useIsomorphicLayoutEffect(() => {
    setMounted(true);
  }, []);

  if (mounted) return locale;
  return {
    ...locale,
    lang: "en" as Lang,
    currency: "USD" as CurrencyCode,
    t: makeTranslator("en"),
    formatMoney: (usd: number) => formatMoneyWith(usd, "USD", locale.rates),
  };
}
