"use client";

import { useEffect, useState } from "react";
import { getPaymentMethods } from "@/app/actions/catalog";

type PaymentMethodDTO = {
  code: string;
  label: string;
};

type Props = {
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  error: string | null;
};

export default function StepPayment({
  onSubmit,
  onBack,
  isSubmitting,
  error,
}: Props) {
  const [methods, setMethods] = useState<PaymentMethodDTO[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getPaymentMethods().then((m) => {
      setMethods(m);
      setLoaded(true);
    });
  }, []);

  const hasMethods = methods.length > 0;

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-ink">Payment</h2>

      {loaded && !hasMethods ? (
        <div className="mb-6 rounded-2xl border border-line bg-canvas p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-brand">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" />
              </svg>
            </div>
          </div>
          <p className="mb-2 text-base font-semibold text-ink">
            Payment options are being set up
          </p>
          <p className="text-sm text-muted">
            You can still confirm your booking — our team will send the payment
            link to your email.
          </p>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-line bg-white p-5">
          <h3 className="mb-4 text-base font-bold text-ink">
            Select Payment Method
          </h3>
          <div className="space-y-2">
            {methods.map((m) => (
              <label
                key={m.code}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-4 transition-colors hover:bg-canvas"
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  className="h-4 w-4 accent-brand"
                />
                <span className="text-sm font-semibold text-ink">
                  {m.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="rounded-xl border border-line bg-white px-6 py-3 text-base font-bold text-ink transition-colors hover:bg-canvas disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="rounded-xl bg-brand px-8 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Processing..." : "Book Now"}
        </button>
      </div>

      {!hasMethods && loaded && (
        <p className="mt-4 text-center text-xs text-muted">
          Full payment — no deposit
        </p>
      )}
    </div>
  );
}
