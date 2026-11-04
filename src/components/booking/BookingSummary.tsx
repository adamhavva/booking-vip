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
  units?: number; // for per_unit packages
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
  units,
  packageLabel,
  addOns,
}: Props) {
  const { formatMoney, t } = useLocale();

  const plural = (n: number) => (n !== 1 ? "s" : "");

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
      // per_unit: multiply by units (quantity)
      subtotal += (selectedPackage.unitUsd ?? 0) * (units ?? 1);
    }
  }

  // Calculate add-ons
  const addOnsTotal = addOns.reduce((sum, a) => sum + a.unitUsd * a.qty, 0);
  const total = subtotal + addOnsTotal;

  const dateValue = date ? new Date(date + "T00:00:00") : null;
  const formattedDate =
    dateValue && Number.isFinite(dateValue.getTime())
      ? dateValue.toLocaleDateString("en-US", {
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
          <span className="text-muted">{t("wizard.summary.date")}</span>
          <span className="font-semibold text-ink">{formattedDate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">{t("wizard.summary.time")}</span>
          <span className="font-semibold text-ink">{time}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">{t("wizard.summary.package")}</span>
          <span className="font-semibold text-ink">{packageLabel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">{t("wizard.summary.travelers")}</span>
          <span className="font-semibold text-ink">
            {t("wizard.summary.adult", { n: adults, plural: plural(adults) })}
            {children > 0 &&
              `, ${t("wizard.summary.child", { n: children, plural: plural(children) })}`}
            {infants > 0 &&
              `, ${t("wizard.summary.infant", { n: infants, plural: plural(infants) })}`}
          </span>
        </div>
      </div>

      <div className="mb-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">{t("wizard.summary.subTotal")}</span>
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
        <span className="text-base font-bold text-ink">{t("wizard.summary.total")}</span>
        <span className="text-xl font-extrabold text-brand">
          {formatMoney(total)}
        </span>
      </div>
    </div>
  );
}
