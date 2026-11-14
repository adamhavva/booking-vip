"use client";

import { useEffect, useState } from "react";
import { getPaymentMethods } from "@/app/actions/catalog";
import { validatePromoCode } from "@/app/actions/booking";
import { listMyVouchers, type VoucherDTO } from "@/app/actions/loyalty";
import { useAccountOverview } from "@/components/providers/AccountProvider";
import { useLocale } from "@/components/providers/LocaleProvider";

type PaymentMethodDTO = {
  code: string;
  label: string;
};

/** The promo/voucher currently applied to the booking (validated server-side). */
export type AppliedPromo = {
  code: string;
  title: string;
  discountUsdCents: number;
};

type Props = {
  onSubmit: (promoCode?: string) => void;
  onBack: () => void;
  isSubmitting: boolean;
  error: string | null;
  /** The subtotal in USD cents — the promo is checked against it. */
  subtotalUsdCents: number;
  /** The applied promo lives in the wizard so the summary can show it too. */
  appliedPromo: AppliedPromo | null;
  onPromoChange: (promo: AppliedPromo | null) => void;
};

export default function StepPayment({
  onSubmit,
  onBack,
  isSubmitting,
  error,
  subtotalUsdCents,
  appliedPromo,
  onPromoChange,
}: Props) {
  const { t, formatMoney } = useLocale();
  const { overview } = useAccountOverview();

  const [methods, setMethods] = useState<PaymentMethodDTO[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  // The signed-in customer's unused reward vouchers — one click applies one.
  const [vouchers, setVouchers] = useState<VoucherDTO[]>([]);

  useEffect(() => {
    getPaymentMethods().then((m) => {
      setMethods(m);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!overview) {
      setVouchers([]);
      return;
    }
    listMyVouchers().then((rows) =>
      setVouchers(
        rows.filter(
          (v) =>
            !v.used &&
            (v.endsAt == null || new Date(v.endsAt).getTime() > Date.now()),
        ),
      ),
    );
  }, [overview]);

  const hasMethods = methods.length > 0;

  /** Check a code server-side — the discount only applies once it is valid. */
  const checkCode = async (code: string) => {
    if (!code) {
      onPromoChange(null);
      setPromoError(t("loyalty.promoEmpty"));
      return;
    }

    setChecking(true);
    setPromoError(null);

    const result = await validatePromoCode(code, subtotalUsdCents);
    setChecking(false);

    if (!result.ok) {
      onPromoChange(null);
      setPromoError(result.error);
      return;
    }

    onPromoChange({
      code: result.code,
      title: result.title,
      discountUsdCents: result.discountUsdCents,
    });
  };

  const handleCheckPromo = () => void checkCode(promoInput.trim());

  const handleApplyVoucher = (code: string) => {
    setPromoInput(code);
    void checkCode(code);
  };

  // Points this booking will earn once paid (1 point per whole dollar of
  // the discounted total — the same rule the server applies).
  const earnPreview = Math.max(
    0,
    Math.floor((subtotalUsdCents - (appliedPromo?.discountUsdCents ?? 0)) / 100),
  );

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

      {/* Reward vouchers of the signed-in customer */}
      {vouchers.length > 0 ? (
        <div className="mb-6 rounded-2xl border border-line bg-white p-5">
          <h3 className="mb-3 text-base font-bold text-ink">
            {t("loyalty.vouchersTitle")}
          </h3>
          <div className="space-y-2">
            {vouchers.map((voucher) => {
              const active = appliedPromo?.code === voucher.code;
              return (
                <div
                  key={voucher.code}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 ${
                    active ? "border-brand bg-brand-soft/40" : "border-line"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-mono text-[13px] font-bold text-ink">
                      {voucher.code}
                    </p>
                    <p className="truncate text-[12px] text-muted">
                      {voucher.title}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyVoucher(voucher.code)}
                    disabled={checking || isSubmitting || active}
                    className="h-9 shrink-0 rounded-xl border border-line bg-white px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {active ? t("loyalty.voucherApplied") : t("loyalty.voucherApply")}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Promo code */}
      <div className="mb-6 rounded-2xl border border-line bg-white p-5">
        <h3 className="mb-3 text-base font-bold text-ink">{t("loyalty.promoTitle")}</h3>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
            placeholder={t("loyalty.promoPlaceholder")}
            className="h-11 flex-1 rounded-xl border border-line bg-white px-4 text-sm text-ink outline-none placeholder:text-muted focus:border-brand"
          />
          <button
            type="button"
            onClick={handleCheckPromo}
            disabled={checking || isSubmitting}
            className="h-11 rounded-xl border border-line bg-white px-5 text-sm font-semibold text-ink transition-colors hover:bg-canvas disabled:opacity-50"
          >
            {checking ? t("loyalty.promoChecking") : t("loyalty.promoCheck")}
          </button>
        </div>

        {promoError ? (
          <p className="mt-2 text-[13px] text-danger">{promoError}</p>
        ) : null}

        {appliedPromo ? (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-brand-soft px-4 py-3">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-brand-dark">
                {t("loyalty.promoApplied", { code: appliedPromo.code })}
              </p>
              <p className="truncate text-[12px] text-brand-dark/70">
                {appliedPromo.title}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-[13px] font-bold text-brand-dark">
                −{formatMoney(appliedPromo.discountUsdCents / 100)}
              </span>
              <button
                type="button"
                onClick={() => {
                  onPromoChange(null);
                  setPromoInput("");
                  setPromoError(null);
                }}
                aria-label={t("loyalty.promoRemove")}
                className="flex h-6 w-6 items-center justify-center rounded-full text-brand-dark/70 transition-colors hover:bg-white/60 hover:text-brand-dark"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ) : null}

        {overview ? (
          <p className="mt-3 text-[12px] font-medium text-brand-dark">
            {t("loyalty.earnPreview", { n: earnPreview.toLocaleString("id-ID") })}
          </p>
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
          onClick={() => onSubmit(appliedPromo?.code)}
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