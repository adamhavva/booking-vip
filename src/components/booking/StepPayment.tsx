"use client";

import { useEffect, useState } from "react";
import { getPaymentMethods } from "@/app/actions/catalog";
import { validatePromoCode } from "@/app/actions/booking";
import { useLocale } from "@/components/providers/LocaleProvider";

type PaymentMethodDTO = {
  code: string;
  label: string;
};

type Props = {
  onSubmit: (promoCode?: string) => void;
  onBack: () => void;
  isSubmitting: boolean;
  error: string | null;
  /** The subtotal in USD cents — the promo is checked against it. */
  subtotalUsdCents: number;
};

export default function StepPayment({
  onSubmit,
  onBack,
  isSubmitting,
  error,
  subtotalUsdCents,
}: Props) {
  const { t } = useLocale();

  const [methods, setMethods] = useState<PaymentMethodDTO[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{
    code: string;
    title: string;
    discountUsdCents: number;
  } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    getPaymentMethods().then((m) => {
      setMethods(m);
      setLoaded(true);
    });
  }, []);

  const hasMethods = methods.length > 0;

  /** Check the promo code — the discount is only applied once it is valid. */
  const handleCheckPromo = async () => {
    const code = promoInput.trim();
    if (!code) {
      setPromo(null);
      setPromoError("Kode promo wajib diisi.");
      return;
    }

    setChecking(true);
    setPromoError(null);

    const result = await validatePromoCode(code, subtotalUsdCents);
    setChecking(false);

    if (!result.ok) {
      setPromo(null);
      setPromoError(result.error);
      return;
    }

    setPromo({ code: result.code, title: result.title, discountUsdCents: result.discountUsdCents });
  };

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-ink">{t("wizard.payment.title")}</h2>

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
            {t("wizard.payment.setupTitle")}
          </p>
          <p className="text-sm text-muted">{t("wizard.payment.setupDesc")}</p>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-line bg-white p-5">
          <h3 className="mb-4 text-base font-bold text-ink">
            {t("wizard.payment.selectMethod")}
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

      {/* Promo code */}
      <div className="mb-6 rounded-2xl border border-line bg-white p-5">
        <h3 className="mb-3 text-base font-bold text-ink">Punya kode promo?</h3>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
            placeholder="Masukkan kode promo"
            className="h-11 flex-1 rounded-xl border border-line bg-white px-4 text-sm text-ink outline-none placeholder:text-muted focus:border-brand"
          />
          <button
            type="button"
            onClick={handleCheckPromo}
            disabled={checking || isSubmitting}
            className="h-11 rounded-xl border border-line bg-white px-5 text-sm font-semibold text-ink transition-colors hover:bg-canvas disabled:opacity-50"
          >
            {checking ? "Memeriksa…" : "Cek"}
          </button>
        </div>

        {promoError ? (
          <p className="mt-2 text-[13px] text-danger">{promoError}</p>
        ) : null}

        {promo ? (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-brand-soft px-4 py-3">
            <div>
              <p className="text-[13px] font-semibold text-brand-dark">
                {promo.code} diterapkan
              </p>
              <p className="text-[12px] text-brand-dark/70">{promo.title}</p>
            </div>
            <span className="text-[13px] font-bold text-brand-dark">
              -${(promo.discountUsdCents / 100).toFixed(2)}
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="rounded-xl border border-line bg-white px-6 py-3 text-base font-bold text-ink transition-colors hover:bg-canvas disabled:opacity-50"
        >
          {t("wizard.payment.back")}
        </button>
        <button
          onClick={() => onSubmit(promo?.code)}
          disabled={isSubmitting}
          className="rounded-xl bg-brand px-8 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? t("wizard.payment.processing") : t("wizard.payment.bookNow")}
        </button>
      </div>

      {!hasMethods && loaded && (
        <p className="mt-4 text-center text-xs text-muted">
          {t("wizard.payment.fullPayment")}
        </p>
      )}
    </div>
  );
}
