"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown } from "@/components/icons";
import { useLocale, type Lang } from "@/components/providers/LocaleProvider";
import { SUPPORTED, type CurrencyCode } from "@/lib/currency";

const LANGUAGES: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "id", label: "Indonesia" },
];

/**
 * Locale + currency dropdown.
 *
 * Two sections: **Language** (English / Indonesia) and **Currency** (USD / IDR).
 * The trigger shows `{LANG.toUpperCase()} | {currency}` plus the existing
 * ChevronDown glyph, matching the inert button it replaces.
 *
 * `variant` matches the header variant so text colour tracks the background:
 * `overlay` renders white text over the hero (and switches to `ink` once the
 * header becomes solid), `solid` always renders `ink`.
 */
export default function LocaleMenu({
  variant = "solid",
}: {
  variant?: "overlay" | "solid";
}) {
  const { lang, setLang, currency, setCurrency } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close the dropdown whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const solid = variant === "solid";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex items-center gap-1 ${
          solid ? "hover:text-ink" : "hover:text-white"
        }`}
      >
        {lang.toUpperCase()} | {currency}{" "}
        <ChevronDown
          width={14}
          height={14}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-44 origin-top-right rounded-xl border border-line bg-white p-1 text-sm text-ink shadow-lg"
        >
          <div className="px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
            Language
          </div>
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              role="menuitemradio"
              aria-checked={lang === l.code}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left transition-colors ${
                lang === l.code
                  ? "bg-brand-soft font-semibold text-brand"
                  : "hover:bg-canvas"
              }`}
            >
              {l.label}
              {lang === l.code && (
                <span className="text-[10px] text-brand">✓</span>
              )}
            </button>
          ))}

          <div className="my-1 h-px bg-line" />

          <div className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
            Currency
          </div>
          {SUPPORTED.map((s) => (
            <button
              key={s.code}
              role="menuitemradio"
              aria-checked={currency === s.code}
              onClick={() => {
                setCurrency(s.code as CurrencyCode);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left transition-colors ${
                currency === s.code
                  ? "bg-brand-soft font-semibold text-brand"
                  : "hover:bg-canvas"
              }`}
            >
              <span>
                <span className="mr-1.5 inline-block w-4 text-center">
                  {s.symbol}
                </span>
                {s.code}
              </span>
              {currency === s.code && (
                <span className="text-[10px] text-brand">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
