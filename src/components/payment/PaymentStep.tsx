"use client";

import { useEffect, useMemo, useState } from "react";
import { getPaymentMethods } from "@/app/actions/catalog";
import { startBookingPayment } from "@/app/actions/payments";
import { useLocale } from "@/components/providers/LocaleProvider";

type MethodDTO = {
  code: string;
  label: string;
};

/** The groups of the payment page — the same grouping the marketplace uses. */
const GROUPS: { key: string; title: string; hint?: string }[] = [
  {
    key: "BANK_TRANSFER",
    title: "Transfer Bank (Virtual Account)",
    hint: "Bayar lewat ATM, Internet Banking & Mobile Banking.",
  },
  {
    key: "CREDIT_CARD",
    title: "Kartu Kredit / Debit",
    hint: "Masukkan informasi kartu untuk menyelesaikan pembayaran.",
  },
  {
    key: "EWALLET",
    title: "E-Wallet",
    hint: "Bayar instan lewat dompet digital di smartphone kamu.",
  },
  {
    key: "QRIS",
    title: "QRIS",
    hint: "Scan dengan aplikasi apa pun yang mendukung QRIS.",
  },
  {
    key: "DIRECT_DEBIT",
    title: "Pembayaran Instan",
    hint: "Bayar praktis tanpa banyak klik lewat layanan bank partner.",
  },
  {
    key: "RETAIL_OUTLET",
    title: "Gerai Retail",
    hint: "Tunjukkan kode booking atau Order ID ke kasir.",
  },
  {
    key: "PAYLATER",
    title: "Paylater / Cicilan Tanpa Kartu",
    hint: "Nikmati pembayaran yang lebih fleksibel.",
  },
];

/** The group a method belongs to — the code starts with the group name. */
function groupOf(code: string): string {
  const upper = code.toUpperCase();
  const found = GROUPS.find((g) => upper.startsWith(g.key));
  return found?.key ?? "OTHER";
}

/**
 * The payment step.
 *
 * The customer picks a payment method; the server creates the gateway invoice
 * and returns the checkout URL, which the browser follows. The API key and the
 * secret never reach the browser.
 */
export default function PaymentStep({
  bookingCode,
  email,
  amountUsdCents,
  onBack,
}: {
  bookingCode: string;
  email: string;
  /** The total in USD cents — shown next to the methods. */
  amountUsdCents: number;
  onBack?: () => void;
}) {
  const { formatMoney } = useLocale();

  const [methods, setMethods] = useState<MethodDTO[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPaymentMethods().then((list) => {
      setMethods(list);
      if (list.length > 0) setSelected(list[0].code);
    });
  }, []);

  /** The methods, grouped like the marketplace does. */
  const groups = useMemo(() => {
    const byGroup = new Map<string, MethodDTO[]>();
    for (const method of methods) {
      const key = groupOf(method.code);
      const list = byGroup.get(key) ?? [];
      list.push(method);
      byGroup.set(key, list);
    }

    return GROUPS.filter((group) => byGroup.has(group.key)).map((group) => ({
      ...group,
      methods: byGroup.get(group.key) ?? [],
    }));
  }, [methods]);

  const pay = async () => {
    if (!selected || loading) return;

    setLoading(true);
    setError(null);

    const result = await startBookingPayment({
      bookingCode,
      email,
      methodCode: selected,
    });

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Remember the booking so the return page can find the email again.
    try {
      localStorage.setItem(
        "booking-vip:last-booking",
        JSON.stringify({ code: bookingCode, email }),
      );
    } catch {
      // Storage unavailable — the return page asks for the email.
    }

    window.location.href = result.checkoutUrl;
  };

  if (methods.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-white p-6">
        <h2 className="text-[16px] font-bold text-ink">Pilih pembayaran</h2>
        <p className="mt-2 text-[13px] text-muted">
          Belum ada metode pembayaran yang tersedia. Silakan hubungi customer
          service kami.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[16px] font-bold tracking-[-0.01em] text-ink">
          Pilih pembayaran
        </h2>
        <p className="text-[13px] text-muted">
          Total <span className="font-bold text-ink">{formatMoney(amountUsdCents)}</span>
        </p>
      </div>

      <div className="mt-4 space-y-4">
        {groups.map((group) => (
          <section key={group.key}>
            <h3 className="text-[12px] font-bold uppercase tracking-[0.06em] text-muted">
              {group.title}
            </h3>
            {group.hint ? (
              <p className="mt-0.5 text-[12px] text-muted">{group.hint}</p>
            ) : null}

            <div className="mt-2 space-y-2">
              {group.methods.map((method) => (
                <button
                  key={method.code}
                  type="button"
                  onClick={() => setSelected(method.code)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-[13px] transition-colors ${
                    selected === method.code
                      ? "border-brand bg-brand-soft font-semibold text-brand"
                      : "border-line bg-white text-ink hover:bg-canvas"
                  }`}
                >
                  <span className="min-w-0 truncate">{method.label}</span>
                  {selected === method.code ? (
                    <span className="text-xs font-bold text-brand">✓</span>
                  ) : null}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-[13px] text-danger">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-2 border-t border-line pt-5 sm:flex-row sm:justify-end">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-line bg-white px-5 text-[13px] font-semibold text-ink transition-colors hover:bg-canvas"
          >
            Kembali
          </button>
        ) : null}
        <button
          type="button"
          onClick={pay}
          disabled={!selected || loading}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-brand px-8 text-[13px] font-semibold text-white transition-opacity hover:bg-brand-dark disabled:opacity-40"
        >
          {loading ? "Membuka pembayaran…" : "Lanjutkan pembayaran"}
        </button>
      </div>
    </div>
  );
}
