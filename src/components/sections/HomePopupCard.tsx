"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PopupSettingsDTO } from "@/lib/popup";
import { useLocale } from "@/components/providers/LocaleProvider";

/**
 * The homepage popup card.
 *
 * The popup shows up after the configured delay, once per browser session —
 * closing it stores a marker in `sessionStorage`, so a reload inside the same
 * session does not bring it back.
 */
export default function HomePopupCard({ settings }: { settings: PopupSettingsDTO }) {
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const show = () => {
      if (cancelled) return;
      try {
        if (window.sessionStorage.getItem(STORAGE_KEY)) return;
      } catch {
        // Private mode — the popup is simply shown again on the next reload.
      }
      setVisible(true);
    };

    const delay = Math.max(0, settings.delaySeconds) * 1000;
    const timer = window.setTimeout(show, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [settings.delaySeconds]);

  const close = () => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Nothing to do — the popup will show again on the next reload.
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-label={settings.title || "Promo"}
    >
      <div className="relative w-full max-w-[420px] overflow-hidden rounded-2xl border border-line bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
        {settings.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={settings.imageUrl}
            alt=""
            className="h-44 w-full object-cover"
          />
        ) : null}

        <button
          type="button"
          onClick={close}
          aria-label={t("popup.close")}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm transition-opacity hover:opacity-70"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.3 19.71 2.89 18.3 9.17 12 2.89 5.71 4.3 4.29l6.29 6.3 6.3-6.3 1.41 1.42Z"
            />
          </svg>
        </button>

        <div className="p-6">
          {settings.title ? (
            <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">
              {settings.title}
            </h2>
          ) : null}

          {settings.body ? (
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              {settings.body}
            </p>
          ) : null}

          <div className="mt-5 flex items-center gap-3">
            {settings.ctaLabel ? (
              <Link
                href={settings.ctaHref || "/"}
                onClick={close}
                className="inline-flex h-10 items-center rounded-xl bg-brand px-5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
              >
                {settings.ctaLabel}
              </Link>
            ) : null}

            <button
              type="button"
              onClick={close}
              className="inline-flex h-10 items-center rounded-xl border border-line bg-white px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-canvas"
            >
              {t("popup.later")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The session marker — the popup shows once per browser session. */
const STORAGE_KEY = "bookingvip:home-popup-dismissed";
