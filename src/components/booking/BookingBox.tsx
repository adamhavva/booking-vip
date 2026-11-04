"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/providers/LocaleProvider";
import PaxStepper from "./PaxStepper";
import type { ProductDetailDTO } from "@/types";

/** Generate time slots every 30 minutes from 06:00 to 22:00 */
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 6; h <= 22; h++) {
    slots.push(`${h.toString().padStart(2, "0")}:00`);
    if (h < 22) slots.push(`${h.toString().padStart(2, "0")}:30`);
  }
  return slots;
}

/** Get the earliest allowed date based on lead time */
function getMinDate(leadTimeHours: number, leadTimeDays: number): string {
  const now = new Date();
  if (leadTimeDays > 0) {
    now.setDate(now.getDate() + leadTimeDays);
  } else if (leadTimeHours > 0) {
    now.setHours(now.getHours() + leadTimeHours);
  }
  return now.toISOString().split("T")[0]!;
}

const TIME_SLOTS = generateTimeSlots();

/**
 * Booking box — date/time picker, package selection, pax counts, total, and CTA.
 */
export default function BookingBox({ product }: { product: ProductDetailDTO }) {
  const { formatMoney, t } = useLocale();
  const router = useRouter();

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [packageIdx, setPackageIdx] = useState(0);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const minDate = useMemo(
    () => getMinDate(product.leadTimeHours, product.leadTimeDays),
    [product.leadTimeHours, product.leadTimeDays]
  );

  const selectedPackage = product.packages[packageIdx];
  const isPerPax = selectedPackage?.unitKind === "per_pax";

  // Calculate total
  const total = useMemo(() => {
    if (!selectedPackage) return 0;
    if (isPerPax) {
      return (
        (selectedPackage.adultUsd ?? 0) * adults +
        (selectedPackage.childUsd ?? 0) * children +
        (selectedPackage.infantUsd ?? 0) * infants
      );
    }
    return (selectedPackage.unitUsd ?? 0) * quantity;
  }, [selectedPackage, isPerPax, adults, children, infants, quantity]);

  const canBook = date && time;
  const ctaLabel = canBook ? t("bookingBox.bookNow") : t("bookingBox.selectDateTime");

  const handleBook = () => {
    if (!canBook) return;

    const params = new URLSearchParams();
    params.set("date", date);
    params.set("time", time);
    if (isPerPax) {
      params.set("adult", adults.toString());
      params.set("child", children.toString());
      params.set("infant", infants.toString());
    } else {
      params.set("qty", quantity.toString());
    }
    if (selectedPackage) {
      params.set("pkg", selectedPackage.id);
    }

    router.push(`/booking/${product.slug}?${params.toString()}`);
  };

  return (
    <div className="sticky top-24 rounded-2xl border border-line bg-white p-5 shadow-lg">
      <div className="mb-4 border-b border-line pb-4">
        <span className="text-xs text-muted">{t("card.startingFrom")}</span>
        <p className="text-2xl font-extrabold text-ink">{formatMoney(product.fromUsd)}</p>
      </div>

      {/* Date picker */}
      <div className="mb-3">
        <label className="mb-1 block text-xs font-semibold text-muted">{t("bookingBox.date")}</label>
        <input
          type="date"
          value={date}
          min={minDate}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm font-semibold text-ink"
        />
        {product.leadTimeHours > 0 && !date && (
          <p className="mt-1 text-xs text-muted">
            {t("bookingBox.leadTimeHours", { n: product.leadTimeHours })}
          </p>
        )}
        {product.leadTimeDays > 0 && !date && (
          <p className="mt-1 text-xs text-muted">
            {t("bookingBox.leadTimeDays", {
              n: product.leadTimeDays,
              plural: product.leadTimeDays > 1 ? "s" : "",
            })}
          </p>
        )}
      </div>

      {/* Time picker */}
      <div className="mb-4">
        <label className="mb-1 block text-xs font-semibold text-muted">{t("bookingBox.time")}</label>
        <select
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-full rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm font-semibold text-ink"
        >
          <option value="">{t("bookingBox.selectTime")}</option>
          {TIME_SLOTS.map((slot) => (
            <option key={slot} value={slot}>
              {slot}
            </option>
          ))}
        </select>
      </div>

      {/* Package selection */}
      {product.packages.length > 1 && (
        <div className="mb-4">
          <label className="mb-2 block text-xs font-semibold text-muted">{t("bookingBox.choosePackage")}</label>
          <div className="space-y-2">
            {product.packages.map((pkg, i) => (
              <label
                key={pkg.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                  i === packageIdx ? "border-brand bg-brand-soft" : "border-line hover:bg-canvas"
                }`}
              >
                <input
                  type="radio"
                  name="package"
                  checked={i === packageIdx}
                  onChange={() => setPackageIdx(i)}
                  className="h-4 w-4 accent-brand"
                />
                <span className="flex-1 text-sm font-semibold text-ink">{pkg.label}</span>
                <span className="text-sm font-bold text-brand">
                  {formatMoney(
                    pkg.unitKind === "per_pax"
                      ? pkg.adultUsd ?? 0
                      : pkg.unitUsd ?? 0
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Pax counts or quantity */}
      {selectedPackage && (
        <div className="mb-4 space-y-2">
          {isPerPax ? (
            <>
              <PaxStepper
                label={t("bookingBox.adults")}
                value={adults}
                onChange={setAdults}
                min={1}
                price={formatMoney(selectedPackage.adultUsd ?? 0)}
              />
              {(selectedPackage.childUsd ?? 0) > 0 && (
                <PaxStepper
                  label={t("bookingBox.children")}
                  value={children}
                  onChange={setChildren}
                  price={formatMoney(selectedPackage.childUsd ?? 0)}
                />
              )}
              {(selectedPackage.infantUsd ?? 0) > 0 && (
                <PaxStepper
                  label={t("bookingBox.infants")}
                  value={infants}
                  onChange={setInfants}
                  price={formatMoney(selectedPackage.infantUsd ?? 0)}
                />
              )}
            </>
          ) : (
            <PaxStepper
              label={t("bookingBox.tickets")}
              value={quantity}
              onChange={setQuantity}
              min={1}
              price={formatMoney(selectedPackage.unitUsd ?? 0)}
            />
          )}
        </div>
      )}

      {/* Total */}
      <div className="mb-4 flex items-center justify-between border-t border-line pt-4">
        <span className="text-sm font-semibold text-muted">{t("bookingBox.total")}</span>
        <span className="text-xl font-extrabold text-ink">{formatMoney(total)}</span>
      </div>

      {/* CTA */}
      <button
        onClick={handleBook}
        disabled={!canBook}
        className="w-full rounded-xl bg-brand py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {ctaLabel}
      </button>
    </div>
  );
}
