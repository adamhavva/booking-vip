"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getBookingByCode } from "@/app/actions/booking";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { BookingLookupDTO } from "@/types";

const LAST_BOOKING_KEY = "booking-vip:last-booking";

export default function MyBookingLookup() {
  const searchParams = useSearchParams();
  const { formatMoney, t } = useLocale();

  const plural = (n: number) => (n !== 1 ? "s" : "");

  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingLookupDTO | null>(null);
  const [searched, setSearched] = useState(false);

  // Prefill from query params or localStorage
  useEffect(() => {
    const queryCode = searchParams.get("code");
    if (queryCode) {
      setCode(queryCode);
      return;
    }

    // Try localStorage
    try {
      const raw = localStorage.getItem(LAST_BOOKING_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.code) setCode(data.code);
        if (data.email) setEmail(data.email);
      }
    } catch {
      // Storage unavailable
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !email) return;

    setLoading(true);
    setError(null);
    setBooking(null);
    setSearched(true);

    const result = await getBookingByCode(code, email);

    setLoading(false);

    if (result.found) {
      setBooking(result.booking);
    } else if (result.reason === "not_found") {
      setError("not_found");
    } else {
      setError("unavailable");
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "awaiting_payment":
        return { text: t("myBooking.status.awaitingPayment"), className: "bg-yellow-100 text-yellow-800" };
      case "confirmed":
        return { text: t("myBooking.status.confirmed"), className: "bg-green-100 text-green-800" };
      case "cancelled":
        return { text: t("myBooking.status.cancelled"), className: "bg-red-100 text-red-800" };
      case "completed":
        return { text: t("myBooking.status.completed"), className: "bg-blue-100 text-blue-800" };
      default:
        return { text: status, className: "bg-gray-100 text-gray-800" };
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mx-auto max-w-md rounded-2xl border border-line bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-center text-xl font-bold text-ink">
            {t("myBooking.findTitle")}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">
                {t("myBooking.code")}
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder={t("myBooking.codePlaceholder")}
                className="w-full rounded-xl border border-line bg-white px-4 py-2.5 font-mono text-sm text-ink"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">
                {t("myBooking.email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("myBooking.emailPlaceholder")}
                className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink"
              />
            </div>
            <button
              type="submit"
              disabled={!code || !email || loading}
              className="w-full rounded-xl bg-brand py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? t("myBooking.searching") : t("myBooking.findBooking")}
            </button>
          </div>
        </div>
      </form>

      {error && searched && (
        <div className="mx-auto max-w-md rounded-xl border border-danger/20 bg-danger/5 p-6 text-center">
          <p className="text-sm text-danger">
            {error === "not_found"
              ? t("myBooking.notFound")
              : t("myBooking.unavailable")}
          </p>
        </div>
      )}

      {booking && (
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 rounded-2xl border border-line bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b border-line pb-4">
              <div>
                <p className="text-xs text-muted">{t("myBooking.code")}</p>
                <p className="font-mono text-lg font-bold text-ink">
                  {booking.code}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  statusLabel(booking.status).className
                }`}
              >
                {statusLabel(booking.status).text}
              </span>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-4 border-b border-line pb-4 text-sm">
              <div>
                <p className="text-muted">{t("myBooking.serviceDate")}</p>
                <p className="font-semibold text-ink">
                  {new Date(booking.serviceAt).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-muted">{t("myBooking.travelers")}</p>
                <p className="font-semibold text-ink">
                  {t("wizard.summary.adult", {
                    n: booking.adultCount,
                    plural: plural(booking.adultCount),
                  })}
                  {booking.childCount > 0 &&
                    `, ${t("wizard.summary.child", {
                      n: booking.childCount,
                      plural: plural(booking.childCount),
                    })}`}
                  {booking.infantCount > 0 &&
                    `, ${t("wizard.summary.infant", {
                      n: booking.infantCount,
                      plural: plural(booking.infantCount),
                    })}`}
                </p>
              </div>
            </div>

            <div className="mb-4 border-b border-line pb-4">
              <p className="mb-2 text-xs font-semibold text-muted">{t("myBooking.items")}</p>
              {booking.items.map((item, i) => (
                <div key={i} className="mb-2 flex justify-between text-sm">
                  <span className="text-ink">
                    {item.label}
                    {item.packageLabel && ` — ${item.packageLabel}`}
                  </span>
                  <span className="font-semibold text-ink">
                    {formatMoney(item.totalUsd)}
                  </span>
                </div>
              ))}
              {booking.addOns.map((addOn, i) => (
                <div key={`addon-${i}`} className="mb-2 flex justify-between text-sm">
                  <span className="text-ink">
                    {addOn.label} × {addOn.quantity}
                  </span>
                  <span className="font-semibold text-ink">
                    {formatMoney(addOn.totalUsd)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mb-4 border-b border-line pb-4">
              <p className="mb-2 text-xs font-semibold text-muted">{t("myBooking.travelers")}</p>
              {booking.travelers.map((traveler, i) => (
                <div key={i} className="text-sm text-ink">
                  {traveler.fullName} ({traveler.kind})
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-muted">{t("myBooking.total")}</span>
              <span className="text-xl font-bold text-brand">
                {formatMoney(booking.totalUsd)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
