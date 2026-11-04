"use client";

import Link from "next/link";
import { CheckIcon } from "@/components/icons";
import { useLocale } from "@/components/providers/LocaleProvider";

type Props = {
  code: string;
  email: string;
  total: number;
  productSlug: string;
};

export default function StepResult({ code, email, total, productSlug }: Props) {
  const { formatMoney } = useLocale();

  return (
    <div className="text-center">
      <div className="mb-6 flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckIcon width={40} height={40} />
        </div>
      </div>

      <h2 className="mb-2 text-2xl font-bold text-ink">Booking Confirmed!</h2>
      <p className="mb-6 text-sm text-muted">
        Your booking has been successfully created. A confirmation email will be
        sent to <strong className="text-ink">{email}</strong>.
      </p>

      <div className="mx-auto mb-6 max-w-md rounded-2xl border border-line bg-white p-6 text-left shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b border-line pb-4">
          <span className="text-sm text-muted">Booking Code</span>
          <span className="rounded-lg bg-brand-soft px-3 py-1.5 font-mono text-sm font-bold text-brand">
            {code}
          </span>
        </div>
        <div className="mb-4 flex items-center justify-between border-b border-line pb-4">
          <span className="text-sm text-muted">Status</span>
          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
            Awaiting Payment
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Total Amount</span>
          <span className="text-lg font-bold text-ink">
            {formatMoney(total)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href={`/my-booking?code=${encodeURIComponent(code)}`}
          className="rounded-xl bg-brand px-6 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-brand-dark"
        >
          View My Booking
        </Link>
        <Link
          href={`/${productSlug.split("-")[0]}`}
          className="rounded-xl border border-line bg-white px-6 py-3 text-base font-bold text-ink transition-colors hover:bg-canvas"
        >
          Book Another
        </Link>
      </div>
    </div>
  );
}
