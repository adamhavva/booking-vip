"use client";

import { useLocale } from "@/components/providers/LocaleProvider";

/**
 * Translated page header for My Booking. Kept as a separate client component
 * so the page file stays a server shell (static prerender).
 */
export function MyBookingHeader() {
  const { t } = useLocale();
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-ink">{t("myBooking.title")}</h1>
      <p className="text-sm text-muted">{t("myBooking.subtitle")}</p>
    </div>
  );
}
