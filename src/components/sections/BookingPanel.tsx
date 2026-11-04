"use client";

import { useState } from "react";
import { CheckIcon } from "@/components/icons";
import type { ServicePage } from "@/types";
import { useLocale } from "@/components/providers/LocaleProvider";

/**
 * Sidebar booking panel for the service pages.
 * Pre-filled from the submitted search; submitting shows a confirmation state.
 */
export default function BookingPanel({
  service,
  initial = {},
}: {
  service: ServicePage;
  initial?: Record<string, string>;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <aside className="h-fit rounded-2xl border border-success/30 bg-success/5 p-5">
        <div className="flex items-center gap-2 text-success">
          <CheckIcon width={18} height={18} />
          <h3 className="text-sm font-bold">{t("bookingPanel.received")}</h3>
        </div>
        <p className="mt-2 text-xs text-muted">
          {t("bookingPanel.receivedDesc", { service: service.eyebrow })}
        </p>
        <button
          onClick={() => {
            setDone(false);
            setOpen(false);
          }}
          className="mt-4 w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-canvas"
        >
          {t("bookingPanel.startOver")}
        </button>
      </aside>
    );
  }

  if (!open) {
    return (
      <aside className="h-fit rounded-2xl border border-line bg-canvas p-5">
        <h3 className="text-sm font-bold text-ink">{t("bookingPanel.availableOptions")}</h3>
        <ul className="mt-3 flex flex-wrap gap-2">
          {service.highlights.map((h) => (
            <li
              key={h}
              className="rounded-full bg-white px-3 py-1 text-xs font-medium text-ink"
            >
              {h}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted">
          {t("bookingPanel.placeholder")}
        </p>
        <button
          onClick={() => setOpen(true)}
          className="mt-4 w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-dark"
        >
          {t("bookingPanel.startBooking")}
        </button>
      </aside>
    );
  }

  return (
    <aside className="h-fit rounded-2xl border border-line bg-canvas p-5">
      <h3 className="text-sm font-bold text-ink">{t("bookingPanel.title", { service: service.eyebrow })}</h3>

      <form
        className="mt-3 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          setDone(true);
        }}
      >
        <input
          required
          placeholder={t("bookingPanel.fullName")}
          className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none focus:border-brand"
        />
        <input
          required
          type="email"
          placeholder={t("bookingPanel.email")}
          className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none focus:border-brand"
        />
        <input
          required
          type="text"
          placeholder={t("bookingPanel.date")}
          defaultValue={
            initial.date ?? initial.startDate ?? initial.arrivalDate ?? initial.datetime ?? ""
          }
          className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none focus:border-brand"
        />
        <input
          type="text"
          placeholder={t("bookingPanel.guests")}
          defaultValue={
            initial.pax ?? initial.travelers ?? ""
          }
          className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none focus:border-brand"
        />
        <select
          className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none focus:border-brand"
          defaultValue={service.highlights[0]}
        >
          {service.highlights.map((h) => (
            <option key={h}>{h}</option>
          ))}
        </select>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex-1 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-canvas"
          >
            {t("bookingPanel.cancel")}
          </button>
          <button
            type="submit"
            className="flex-1 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-dark"
          >
            {t("bookingPanel.submit")}
          </button>
        </div>
      </form>
    </aside>
  );
}
