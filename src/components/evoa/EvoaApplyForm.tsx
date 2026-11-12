"use client";

import { useState } from "react";
import Link from "next/link";
import { submitVisaApplication } from "@/app/actions/account";
import { showToast } from "@/components/ui/toast";
import { useLocale } from "@/components/providers/LocaleProvider";

export type EvoaStepDTO = {
  title: string;
  body: string;
};

type Props = {
  /** The three "how it works" steps — both languages. */
  steps: { en: EvoaStepDTO[]; id: EvoaStepDTO[] };
};

const FIELD_CLASS =
  "h-11 w-full rounded-xl border border-line bg-white px-3 text-[13px] text-ink outline-none transition-colors focus:border-brand";

/**
 * The e-VOA application form.
 *
 * e-VOA is a visa *service*: the customer hands us the passport data of the
 * person the visa is for and we handle the application. The submit button
 * posts to the server action, which validates the data and stores it.
 */
export default function EvoaApplyForm({ steps }: Props) {
  const { lang } = useLocale();

  const [fullName, setFullName] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [nationality, setNationality] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [field, setField] = useState<string | undefined>(undefined);
  const [code, setCode] = useState<string | null>(null);

  const list = (lang === "id" ? steps.id : steps.en) ?? steps.en ?? [];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    setField(undefined);

    const result = await submitVisaApplication({
      fullName,
      passportNumber,
      nationality,
      dateOfBirth,
      arrivalDate,
      email,
      phone,
      notes: notes || undefined,
    });

    setSubmitting(false);

    if (result.ok) {
      setCode(result.data.code);
      showToast("Pengajuan visa berhasil dikirim.", "success");
    } else {
      setError(result.error);
      setField(result.field);
      showToast(result.error, "error");
    }
  };

  /* ----------------------------------------------------------------- */
  /* Success                                                           */
  /* ----------------------------------------------------------------- */
  if (code) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-line bg-white p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand-dark">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="m5 13 4 4L19 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <h1 className="mt-4 text-[20px] font-bold tracking-[-0.01em] text-ink">
          Pengajuan visa kamu diterima
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          Simpan nomor pengajuan ini. Tim kami akan menghubungi kamu untuk
          proses berikutnya.
        </p>

        <p className="mt-5 rounded-xl border border-line bg-canvas px-4 py-3 font-mono text-[16px] font-bold tracking-[0.06em] text-ink">
          {code}
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/account/orders"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-brand px-5 text-[13px] font-semibold text-white transition-opacity hover:bg-brand-dark"
          >
            Lihat pengajuan saya
          </Link>
          <Link
            href="/evoa"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-line bg-white px-5 text-[13px] font-semibold text-ink transition-colors hover:bg-canvas"
          >
            Kembali ke e-VOA
          </Link>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------------------- */
  /* Form                                                              */
  /* ----------------------------------------------------------------- */
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-line bg-white p-6"
      >
        <h2 className="text-[17px] font-bold tracking-[-0.01em] text-ink">
          Data pemohon visa
        </h2>
        <p className="mt-1.5 text-[13px] text-muted">
          Isi data sesuai paspor orang yang akan memakai visa.
        </p>

        <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[12px] font-medium text-ink">
              Nama lengkap (sesuai paspor)
            </span>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={FIELD_CLASS}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-ink">
              Nomor paspor
            </span>
            <input
              type="text"
              required
              value={passportNumber}
              onChange={(e) => setPassportNumber(e.target.value.toUpperCase())}
              placeholder="A1234567"
              className={`${FIELD_CLASS} font-mono tracking-[0.04em]`}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-ink">
              Kewarganegaraan
            </span>
            <input
              type="text"
              required
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              placeholder="Singapore"
              className={FIELD_CLASS}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-ink">
              Tanggal lahir
            </span>
            <input
              type="date"
              required
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className={FIELD_CLASS}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-ink">
              Tanggal kedatangan
            </span>
            <input
              type="date"
              required
              value={arrivalDate}
              onChange={(e) => setArrivalDate(e.target.value)}
              className={FIELD_CLASS}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-ink">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={FIELD_CLASS}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-ink">
              Telepon
            </span>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xx xxxx xxxx"
              className={FIELD_CLASS}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[12px] font-medium text-ink">
              Catatan (opsional)
            </span>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-[13px] text-ink outline-none transition-colors focus:border-brand"
            />
          </label>
        </div>

        {error ? (
          <p
            className={`mt-4 rounded-xl border px-4 py-3 text-[13px] ${
              field
                ? "border-danger/20 bg-danger/5 text-danger"
                : "border-line bg-canvas text-ink"
            }`}
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 h-11 w-full rounded-xl bg-brand text-[14px] font-semibold text-white transition-opacity hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
        >
          {submitting ? "Mengirim…" : "Kirim pengajuan"}
        </button>
      </form>

      {/* How it works */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-[15px] font-bold tracking-[-0.01em] text-ink">
            Bagaimana cara kerjanya?
          </h2>

          <ol className="mt-4 space-y-4">
            {list.map((item, index) => (
              <li key={index} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand-dark">
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold text-ink">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-relaxed text-muted">
                    {item.body}
                  </span>
                </span>
              </li>
            ))}
          </ol>

          <p className="mt-5 border-t border-line pt-4 text-[11px] leading-relaxed text-muted">
            Pengajuan diproses pada jam kerja. Nomor pengajuan otomatis dibuat
            dan bisa dilacak di halaman Pesanan.
          </p>
        </div>
      </aside>
    </div>
  );
}
