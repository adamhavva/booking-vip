"use client";

import { useLocale } from "@/components/providers/LocaleProvider";

/**
 * Translated loading fallback for the my-booking lookup. Kept as a separate
 * client component so the page file stays a server shell (static prerender).
 */
export function MyBookingFallback() {
  const { t } = useLocale();
  return (
    <div className="py-12 text-center">
      <p className="text-muted">{t("common.loading")}</p>
    </div>
  );
}
