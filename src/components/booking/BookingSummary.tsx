"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import type { ProductDetailDTO } from "@/types";

type Props = {
  product: ProductDetailDTO;
  date: string;
  time: string;
  adults: number;
  children: number;
  infants: number;
  packageLabel: string;
  addOns: { slug: string; qty: number; label: string; unitUsd: number }[];
};

export default function BookingSummary({
  product,
  date,
  time,
  adults,
  children,
  infants,
  packageLabel,
  addOns,
}: Props) {
  const { formatMoney } = useLocale();

  const selectedPackage = product.packages.find((p) => p.label === packageLabel);
  const isPerPax = selectedPackage?.unitKind === "per_pax";

  // Calculate subtotal
  let subtotal = 0;
  if (selectedPackage) {
    if (isPerPax) {
      subtotal += (selectedPackage.adultUsd ?? 0) * adults;
      subtotal += (selectedPackage.childUsd ?? 0) * children;
      subtotal += (selectedPackage.infantUsd ?? 0) * infants;
    } else {
      subtotal += selectedPackage.unitUsd ?? 0;
    }
  }

  // Calculate add-ons
  const addOnsTotal = addOns.reduce((sum, a) => sum + a.unitUsd * a.qty, 0);
  const total = subtotal + addOnsTotal;

  const formattedDate = date
    ? new Date(date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-sm lg:sticky lg:top-24">
      <h3 className="mb-4 text-lg font-bold text-ink">{product.title}</h3>

      {product.placeLabel && (
        <p className="mb-3 text-sm text-muted">{product.placeLabel}</p>
      )}

      <div className="mb-4 space-y-2 border-b border-line pb-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Date</span>
          <span className="font-semibold text-ink">{formattedDate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Time</span>
          <span className="font-semibold text-ink">{time}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Package</span>
          <span className="font-semibold text-ink">{packageLabel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Travelers</span>
          <span className="font-semibold text-ink">
            {adults} adult{adults !== 1 ? "s" : ""}
            {children > 0 && `, ${children} child${children !== 1 ? "s" : ""}`}
            {infants > 0 && `, ${infants} infant${infants !== 1 ? "s" : ""}`}
          </span>
        </div>
      </div>

      <div className="mb-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Sub Total</span>
          <span className="font-semibold text-ink">{formatMoney(subtotal)}</span>
        </div>
        {addOns.map((a) => (
          <div key={a.slug} className="flex justify-between">
            <span className="text-muted">
              {a.label} × {a.qty}
            </span>
            <span className="font-semibold text-ink">
              {formatMoney(a.unitUsd * a.qty)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-line pt-4">
        <span className="text-base font-bold text-ink">Total</span>
        <span className="text-xl font-extrabold text-brand">
          {formatMoney(total)}
        </span>
      </div>
    </div>
  );
}
