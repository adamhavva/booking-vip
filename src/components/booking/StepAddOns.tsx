"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import type { ProductDetailDTO } from "@/types";
import PaxStepper from "./PaxStepper";

type Props = {
  product: ProductDetailDTO;
  selectedAddOns: { slug: string; qty: number }[];
  onAddOnsChange: (addOns: { slug: string; qty: number }[]) => void;
  onContinue: () => void;
};

export default function StepAddOns({
  product,
  selectedAddOns,
  onAddOnsChange,
  onContinue,
}: Props) {
  const { formatMoney } = useLocale();

  const handleQtyChange = (slug: string, qty: number) => {
    const existing = selectedAddOns.find((a) => a.slug === slug);
    if (qty === 0) {
      onAddOnsChange(selectedAddOns.filter((a) => a.slug !== slug));
    } else if (existing) {
      onAddOnsChange(
        selectedAddOns.map((a) => (a.slug === slug ? { ...a, qty } : a))
      );
    } else {
      onAddOnsChange([...selectedAddOns, { slug, qty }]);
    }
  };

  const getQty = (slug: string) =>
    selectedAddOns.find((a) => a.slug === slug)?.qty ?? 0;

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-ink">Additional Services</h2>
      <p className="mb-6 text-sm text-muted">
        Enhance your booking with optional add-ons. You can skip this step.
      </p>

      {product.addOns.length === 0 ? (
        <div className="rounded-2xl border border-line bg-canvas p-8 text-center">
          <p className="text-sm text-muted">
            No add-ons available for this product.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {product.addOns.map((addOn) => (
            <div
              key={addOn.slug}
              className="flex items-center justify-between rounded-2xl border border-line bg-white p-4"
            >
              <div className="flex-1">
                <p className="font-semibold text-ink">{addOn.label}</p>
                <p className="text-sm text-muted">
                  {formatMoney(addOn.unitUsd)} per unit
                </p>
              </div>
              <div className="w-32">
                <PaxStepper
                  label=""
                  value={getQty(addOn.slug)}
                  onChange={(qty) => handleQtyChange(addOn.slug, qty)}
                  min={0}
                  max={10}
                  price=""
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex justify-end">
        <button
          onClick={onContinue}
          className="rounded-xl bg-brand px-8 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-brand-dark"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
