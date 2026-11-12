"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createBooking } from "@/app/actions/booking";
import PaymentStep from "@/components/payment/PaymentStep";
import type { TourPackageDTO } from "@/app/actions/catalog";
import type { PickedPoint } from "@/lib/picked-point";

type Props = {
  pickup: PickedPoint;
  dropoff: PickedPoint;
  tours: TourPackageDTO[];
  /** The values that came from the search (the entry page). */
  initial?: {
    /** The package that was picked on the list ("slug::packageId"). */
    package?: string;
    date?: string;
    adults?: number;
    children?: number;
    infants?: number;
  };
};

/** The next 90 days as `YYYY-MM-DD`, starting at `from`. */
function upcomingDates(from: Date): string[] {
  const dates: string[] = [];
  for (let i = 0; i <= 90; i++) {
    const date = new Date(from.getTime() + i * 24 * 60 * 60 * 1000);
    dates.push(date.toISOString().slice(0, 10));
  }
  return dates;
}

/** Today + `days` days (the lead time of a tour can be a few days). */
function addDays(days: number): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

const TIME_SLOTS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00",
];

/**
 * Step 2 of the tour flow — the booking form.
 *
 * The route is already confirmed (it came from the map step), so this form
 * only asks for what is left: the package, the date, how many travellers and
 * how to reach the customer. Traveller names are not stored.
 */
export default function TourPackageBookingClient({
  pickup,
  dropoff,
  tours,
  initial,
}: Props) {
  const [tourSlug, setTourSlug] = useState(
    initial?.package ??
      (tours[0] ? `${tours[0].productSlug}::${tours[0].packageId}` : ""),
  );
  const [date, setDate] = useState(initial?.date ?? "");
  const [time, setTime] = useState("09:00");
  const [adult, setAdult] = useState(Math.max(1, initial?.adults ?? 2));
  const [child, setChild] = useState(initial?.children ?? 0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);

  const selected = useMemo(
    () => tours.find((t) => `${t.productSlug}::${t.packageId}` === tourSlug) ?? null,
    [tours, tourSlug],
  );

  // The packages are grouped by their parent type (the destination), the
  // same parent → child shape the airport line uses.
  const tourGroups = useMemo(() => {
    const groups: { name: string; items: TourPackageDTO[] }[] = [];
    const bySlug = new Map<string, (typeof groups)[number]>();

    for (const tour of tours) {
      const slug = tour.parentSlug ?? "other";
      const name = tour.parentName ?? "Lainnya";

      let group = bySlug.get(slug);
      if (!group) {
        group = { name, items: [] };
        bySlug.set(slug, group);
        groups.push(group);
      }
      group.items.push(tour);
    }

    return groups;
  }, [tours]);

  // The tour needs a lead time — the first bookable day depends on the
  // package that is selected.
  const leadTimeDays = selected?.leadTimeDays ?? 0;
  const leadTimeHours = selected?.leadTimeHours ?? 0;
  const minDate = useMemo(
    () => addDays(leadTimeDays + (leadTimeHours > 0 ? 1 : 0) + 1),
    [leadTimeDays, leadTimeHours],
  );
  const dates = useMemo(() => upcomingDates(minDate), [minDate]);

  // Keep the selected date inside the allowed range.
  useEffect(() => {
    if (dates.length === 0) return;
    if (!date || date < dates[0]) setDate(dates[0]);
  }, [dates, date]);

  const totalUsdCents = useMemo(() => {
    if (!selected) return 0;
    if (selected.unitKind === "per_unit") return selected.adultUsdCents;
    return (
      selected.adultUsdCents * adult +
      selected.childUsdCents * child +
      selected.infantUsdCents * 0
    );
  }, [selected, adult, child]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    if (!selected) {
      setError("Pilih paket tour terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const serviceAt = new Date(`${date}T${time}:00`);
    if (!Number.isFinite(serviceAt.getTime())) {
      setError("Tanggal atau jam tidak valid.");
      setSubmitting(false);
      return;
    }

    const result = await createBooking({
      productSlug: selected.productSlug,
      packageId: selected.packageId,
      serviceAt: serviceAt.toISOString(),
      adult,
      child,
      infant: 0,
      units: selected.unitKind === "per_unit" ? 1 : undefined,
      addOns: [],
      contact: {
        firstName,
        lastName,
        email,
        phoneCountryCode: "ID",
        phone,
        isGuestSelf: false,
        notes: notes || undefined,
      },
      flight: {},
      travelers: [],
      pickup: { label: pickup.label, lat: pickup.lat, lng: pickup.lng },
      dropoff: { label: dropoff.label, lat: dropoff.lat, lng: dropoff.lng },
      currencyCode: "USD",
      fxRate: 1,
    });

    setSubmitting(false);

    if (result.ok) {
      setCode(result.code);
    } else {
      setError(result.error);
    }
  };

  /* ----------------------------------------------------------------- */
  /* Success                                                           */
  /* ----------------------------------------------------------------- */
  if (code) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
      <div className="rounded-2xl border border-line bg-white p-8 text-center">
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
          Pesanan tour kamu dibuat
        </h1>
        <p className="mt-1.5 text-[13px] text-muted">
          Simpan kode pesanan ini untuk mengecek status perjalanan.
        </p>

        <p className="mt-5 rounded-xl border border-line bg-canvas px-4 py-3 font-mono text-[16px] font-bold tracking-[0.06em] text-ink">
          {code}
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/account/orders"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-brand px-5 text-[13px] font-semibold text-white transition-opacity hover:bg-brand-dark"
          >
            Lihat pesanan saya
          </Link>
          <Link
            href="/tour-package"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-line bg-white px-5 text-[13px] font-semibold text-ink transition-colors hover:bg-canvas"
          >
            Kembali ke tour
          </Link>
        </div>
      </div>

        {/* The payment step — the gateway invoice is created on the server. */}
        <PaymentStep
          bookingCode={code}
          email={email}
          amountUsdCents={totalUsdCents}
        />
      </div>
    );
  }

  /* ----------------------------------------------------------------- */
  /* Form                                                              */
  /* ----------------------------------------------------------------- */
  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        {/* Route summary */}
        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-[15px] font-bold tracking-[-0.01em] text-ink">
            Rute perjalanan
          </h2>

          <div className="mt-4 space-y-2">
            <div className="flex items-start gap-3 rounded-xl border border-line bg-canvas/50 p-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">
                A
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                  Titik berangkat
                </p>
                <p className="mt-0.5 break-words text-[13px] text-ink">{pickup.label}</p>
                <p className="mt-0.5 font-mono text-[11px] text-muted">
                  {pickup.lat.toFixed(5)}, {pickup.lng.toFixed(5)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-line bg-canvas/50 p-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-danger text-[11px] font-bold text-white">
                B
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                  Tujuan
                </p>
                <p className="mt-0.5 break-words text-[13px] text-ink">{dropoff.label}</p>
                <p className="mt-0.5 font-mono text-[11px] text-muted">
                  {dropoff.lat.toFixed(5)}, {dropoff.lng.toFixed(5)}
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/tour-package/search"
            className="mt-3 inline-block text-[12px] font-medium text-brand transition-opacity hover:opacity-80"
          >
            Ubah lokasi
          </Link>
        </section>

        {/* Package */}
        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-[15px] font-bold tracking-[-0.01em] text-ink">
            Paket tour
          </h2>

          {tours.length === 0 ? (
            <p className="mt-3 text-[13px] text-muted">
              Belum ada paket tour yang tersedia saat ini.
            </p>
          ) : (
            <div className="mt-4 space-y-5">
              {tourGroups.map((group) => (
                <div key={group.name}>
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                    {group.name}
                  </h3>
                  <div className="space-y-2.5">
                    {group.items.map((tour) => {
                      const value = `${tour.productSlug}::${tour.packageId}`;
                      const active = value === tourSlug;

                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setTourSlug(value)}
                          className={`flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition-colors ${
                            active
                              ? "border-brand bg-brand-soft"
                              : "border-line bg-white hover:bg-canvas"
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block text-[14px] font-semibold text-ink">
                              {tour.title}
                            </span>
                            <span className="mt-0.5 block text-[12px] text-muted">
                              {tour.durationLabel ?? tour.packageLabel}
                            </span>
                          </span>
                          <span className="shrink-0 text-[14px] font-bold text-ink">
                            ${(tour.adultUsdCents / 100).toFixed(2)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* When */}
        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-[15px] font-bold tracking-[-0.01em] text-ink">
            Tanggal &amp; jam keberangkatan
          </h2>

          <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-ink">Tanggal</span>
              <select
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 w-full rounded-xl border border-line bg-white px-3 text-[13px] text-ink outline-none transition-colors focus:border-brand"
              >
                {dates.map((d) => (
                  <option key={d} value={d}>
                    {new Date(`${d}T00:00:00`).toLocaleDateString("id-ID", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-ink">Jam</span>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-11 w-full rounded-xl border border-line bg-white px-3 text-[13px] text-ink outline-none transition-colors focus:border-brand"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* Travellers */}
        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-[15px] font-bold tracking-[-0.01em] text-ink">
            Penumpang
          </h2>

          <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-ink">Dewasa</span>
              <input
                type="number"
                min={1}
                max={20}
                value={adult}
                onChange={(e) => setAdult(Math.max(1, Number(e.target.value) || 1))}
                className="h-11 w-full rounded-xl border border-line bg-white px-3 text-[13px] text-ink outline-none transition-colors focus:border-brand"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-ink">Anak</span>
              <input
                type="number"
                min={0}
                max={10}
                value={child}
                onChange={(e) => setChild(Math.max(0, Number(e.target.value) || 0))}
                className="h-11 w-full rounded-xl border border-line bg-white px-3 text-[13px] text-ink outline-none transition-colors focus:border-brand"
              />
            </label>
          </div>

          <p className="mt-3 text-[12px] text-muted">
            Data penumpang tidak disimpan — cukup jumlah penumpang yang dibutuhkan.
          </p>
        </section>

        {/* Contact */}
        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-[15px] font-bold tracking-[-0.01em] text-ink">
            Kontak
          </h2>

          <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-ink">Nama depan</span>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-11 w-full rounded-xl border border-line bg-white px-3 text-[13px] text-ink outline-none transition-colors focus:border-brand"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-ink">Nama belakang</span>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-11 w-full rounded-xl border border-line bg-white px-3 text-[13px] text-ink outline-none transition-colors focus:border-brand"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-ink">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 w-full rounded-xl border border-line bg-white px-3 text-[13px] text-ink outline-none transition-colors focus:border-brand"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-ink">Telepon</span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08xx xxxx xxxx"
                className="h-11 w-full rounded-xl border border-line bg-white px-3 text-[13px] text-ink outline-none transition-colors focus:border-brand"
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
                placeholder="Contoh: permintaan khusus, kebutuhan diet, titik temu alternatif…"
                className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-[13px] text-ink outline-none transition-colors focus:border-brand"
              />
            </label>
          </div>
        </section>

        {error ? (
          <p className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-[13px] text-danger">
            {error}
          </p>
        ) : null}
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-[15px] font-bold tracking-[-0.01em] text-ink">
            Ringkasan
          </h2>

          <dl className="mt-4 space-y-2.5 text-[13px]">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted">Paket</dt>
              <dd className="text-right font-medium text-ink">
                {selected?.title ?? "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">Tanggal</dt>
              <dd className="text-right font-medium text-ink">
                {date
                  ? new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">Jam</dt>
              <dd className="text-right font-medium text-ink">{time}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">Penumpang</dt>
              <dd className="text-right font-medium text-ink">
                {adult} dewasa{child > 0 ? `, ${child} anak` : ""}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
            <span className="text-[13px] font-semibold text-ink">Total</span>
            <span className="text-[18px] font-bold text-ink">
              ${(totalUsdCents / 100).toFixed(2)}
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting || tours.length === 0}
            className="mt-5 h-11 w-full rounded-xl bg-brand text-[14px] font-semibold text-white transition-opacity hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Memproses…" : "Konfirmasi pesanan"}
          </button>

          <p className="mt-3 text-center text-[11px] leading-relaxed text-muted">
            Harga akhir dihitung di server dan sudah termasuk pajak yang
            berlaku.
          </p>
        </div>
      </aside>
    </form>
  );
}
