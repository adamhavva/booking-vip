import { en, type DictKey } from "./en";
import { id } from "./id";
import type { Lang } from "@/components/providers/LocaleProvider";

export type { DictKey } from "./en";

const dictionaries: Record<Lang, Record<DictKey, string>> = {
  en,
  id,
};

/**
 * Look up a translation by key, with optional `{var}` interpolation.
 * Falls back to English when the current language is missing a key.
 */
export function t(
  key: DictKey,
  lang: Lang,
  vars?: Record<string, string | number>
): string {
  const raw = dictionaries[lang]?.[key] ?? dictionaries.en[key] ?? key;
  if (!vars) return raw;

  return raw.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = vars[name];
    return value !== undefined ? String(value) : `{${name}}`;
  });
}

/**
 * Build a bound t() for a given lang — convenient to spread into components.
 */
export function makeTranslator(lang: Lang) {
  return (key: DictKey, vars?: Record<string, string | number>) =>
    t(key, lang, vars);
}
