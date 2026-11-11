"use client";

import { useCallback, useEffect, useState } from "react";
import AccountPageHeader from "@/components/account/AccountPageHeader";
import { showToast } from "@/components/ui/toast";
import {
  deleteSavedCard,
  listSavedCards,
  saveSavedCard,
  setDefaultSavedCard,
  type SavedCardDTO,
} from "@/app/actions/account";

/**
 * The payment methods page.
 *
 * A saved card is stored **encrypted** — only the last four digits are shown.
 * The CVV is never asked for: the form has no field for it.
 *
 * The other methods (Xendit, PayPal) are listed next to the cards; the
 * Xendit gateway is prepared but the keys are not set yet, so it is marked
 * as "coming soon".
 */
export default function PaymentsPanel() {
  const [cards, setCards] = useState<SavedCardDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const [number, setNumber] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [holderName, setHolderName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [field, setField] = useState<string | undefined>(undefined);

  const paypalUrl = process.env.NEXT_PUBLIC_PAYPAL_URL ?? "";

  const load = useCallback(async () => {
    try {
      setCards(await listSavedCards());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");
    setField(undefined);

    const result = await saveSavedCard({
      number,
      expMonth: Number(expMonth),
      expYear: Number(expYear),
      holderName,
    });

    if (!result.ok) {
      setError(result.error);
      setField(result.field);
    } else {
      showToast("Kartu berhasil disimpan.");
      setNumber("");
      setExpMonth("");
      setExpYear("");
      setHolderName("");
      void load();
    }
    setSaving(false);
  };

  const remove = async (id: string) => {
    const result = await deleteSavedCard(id);
    if (!result.ok) {
      showToast(result.error, "error");
      return;
    }
    showToast("Kartu berhasil dihapus.");
    void load();
  };

  const makeDefault = async (id: string) => {
    const result = await setDefaultSavedCard(id);
    if (!result.ok) {
      showToast(result.error, "error");
      return;
    }
    showToast("Kartu utama berhasil diubah.");
    void load();
  };

  const currentYear = new Date().getFullYear();

  return (
    <div>
      <AccountPageHeader
        title="Metode Pembayaran"
        description="Kartu disimpan terenkripsi (AES-256-GCM). Nomor kartu tidak pernah disimpan dalam bentuk terbuka dan CVV tidak pernah diminta."
      />

      {/* Saved cards */}
      <section className="rounded-2xl border border-line bg-white p-5 md:p-6">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
          Kartu tersimpan
        </h2>

        {loading ? (
          <p className="mt-3 text-[13px] text-muted">Memuat…</p>
        ) : cards.length === 0 ? (
          <p className="mt-3 text-[13px] text-muted">
            Belum ada kartu tersimpan. Tambahkan kartu di bawah.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {cards.map((card) => (
              <li
                key={card.id}
                className="rounded-xl border border-line bg-canvas/50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-semibold text-ink">{card.brandLabel}</p>
                    <p className="mt-0.5 font-mono text-[15px] tracking-[0.12em] text-ink">
                      •••• •••• •••• {card.last4}
                    </p>
                    <p className="mt-1 text-[12px] text-muted">
                      Berlaku {String(card.expMonth).padStart(2, "0")}/{card.expYear}
                      {card.holderName ? ` · ${card.holderName}` : ""}
                    </p>
                  </div>
                  {card.isDefault ? (
                    <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-brand-dark">
                      Utama
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 flex items-center gap-3">
                  {!card.isDefault ? (
                    <button
                      type="button"
                      onClick={() => void makeDefault(card.id)}
                      className="text-[12px] font-medium text-brand transition-opacity hover:opacity-80"
                    >
                      Jadikan utama
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void remove(card.id)}
                    className="text-[12px] font-medium text-danger transition-opacity hover:opacity-80"
                  >
                    Hapus
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Add card */}
      <section className="mt-6 rounded-2xl border border-line bg-white p-5 md:p-6">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
          Tambah kartu
        </h2>

        <form onSubmit={submit} className="mt-4 grid gap-3.5 sm:grid-cols-2">
          {error ? (
            <p className="rounded-lg border border-line bg-canvas px-3 py-2 text-[12px] text-danger sm:col-span-2">
              {error}
            </p>
          ) : null}

          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[12px] font-medium text-ink">
              Nomor kartu
            </span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="4242 4242 4242 4242"
              className="h-10 w-full rounded-lg border border-line bg-white px-3 font-mono text-[13px] tracking-[0.08em] text-ink outline-none transition-colors focus:border-brand"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-ink">Bulan</span>
            <select
              value={expMonth}
              onChange={(e) => setExpMonth(e.target.value)}
              className="h-10 w-full rounded-lg border border-line bg-white px-3 text-[13px] text-ink outline-none transition-colors focus:border-brand"
            >
              <option value="">—</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {String(m).padStart(2, "0")}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-ink">Tahun</span>
            <select
              value={expYear}
              onChange={(e) => setExpYear(e.target.value)}
              className="h-10 w-full rounded-lg border border-line bg-white px-3 text-[13px] text-ink outline-none transition-colors focus:border-brand"
            >
              <option value="">—</option>
              {Array.from({ length: 15 }, (_, i) => currentYear + i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[12px] font-medium text-ink">
              Nama di kartu (opsional)
            </span>
            <input
              type="text"
              autoComplete="cc-name"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              className="h-10 w-full rounded-lg border border-line bg-white px-3 text-[13px] text-ink outline-none transition-colors focus:border-brand"
            />
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="h-10 rounded-lg bg-brand px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Menyimpan…" : "Simpan kartu"}
            </button>
          </div>
        </form>
      </section>

      {/* Other methods */}
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
          Metode pembayaran lain
        </h2>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[14px] font-semibold text-ink">Xendit</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">
                  Virtual account, QRIS dan e-wallet. Diproses otomatis lewat Xendit
                  Payment Gateway.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-canvas px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-muted">
                Segera
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[14px] font-semibold text-ink">PayPal</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">
                  Bayar lewat akun PayPal resmi Booking VIP.
                </p>
              </div>
              {paypalUrl ? (
                <a
                  href={paypalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-full bg-brand-soft px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-brand-dark"
                >
                  Hubungi
                </a>
              ) : (
                <span className="shrink-0 rounded-full bg-canvas px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-muted">
                  Segera
                </span>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
