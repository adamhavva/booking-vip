"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createBooking } from "@/app/actions/booking";
import PaxStepper from "@/components/booking/PaxStepper";
import { useLocale } from "@/components/providers/LocaleProvider";
import {
  bookingRuleRows,
  resolveServiceSteps,
  type BookingRules,
  type ServiceInfoMap,
} from "@/lib/bookingRules";
import type {
  AirportOption,
  AirportServiceOption,
  AirlineOption,
  CountryOption,
} from "@/lib/airport-vip";

type Props = {
  countries: CountryOption[];
  airports: AirportOption[];
  airlines: AirlineOption[];
  services: AirportServiceOption[];
  rules: BookingRules;
  /** The service steps and notes, keyed by IATA code plus "default". */
  serviceInfo: ServiceInfoMap;
};

type Step =
  | "country"
  | "airport"
  | "datetime"
  | "flight"
  | "service"
  | "passenger"
  | "confirm";

const STEPS: { key: Step; label: string }[] = [
  { key: "country", label: "Negara" },
  { key: "airport", label: "Bandara" },
  { key: "datetime", label: "Jadwal" },
  { key: "flight", label: "Penerbangan" },
  { key: "service", label: "Layanan" },
  { key: "passenger", label: "Penumpang" },
  { key: "confirm", label: "Konfirmasi" },
];

const TIME_SLOTS = [
  "00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00",
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00",
  "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00",
];

/** The next 90 days as `YYYY-MM-DD`. */
function upcomingDates(count: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 1; i <= count; i++) {
    dates.push(
      new Date(today.getTime() + i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    );
  }
  return dates;
}

/** A label/value row of the confirmation summary. */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-6 py-2.5">
      <dt className="shrink-0 text-[13px] text-muted">{label}</dt>
      <dd className="text-right text-[13px] font-medium text-ink">{value}</dd>
    </div>
  );
}

/**
 * The airport VIP booking wizard.
 *
 * Six steps — airport, date & time, flight, service, passengers, confirm —
 * modelled on the Asia Fast Track flow but rendered with our own minimal
 * style. The prices come from the database (the lists are passed in by the
 * server component).
 */
export default function AirportVipWizard({
  countries,
  airports,
  airlines,
  services,
  rules,
  serviceInfo,
}: Props) {
  const dates = useMemo(() => upcomingDates(90), []);
  const { formatMoney } = useLocale();

  // With a single country there is nothing to choose, so the wizard opens on
  // the airport instead of a dead step. The pill stays in the rail and stays
  // clickable, and the step works in full as soon as a second country exists.
  const [country, setCountry] = useState(
    countries.length === 1 ? countries[0].name : "",
  );
  const [step, setStep] = useState<Step>(
    countries.length === 1 ? "airport" : "country",
  );
  const [airportId, setAirportId] = useState("");
  const [direction, setDirection] = useState<"arrival" | "departure">("arrival");
  const [date, setDate] = useState(dates[0] ?? "");
  const [time, setTime] = useState("09:00");
  const [airlineCode, setAirlineCode] = useState("");
  const [flightCode, setFlightCode] = useState("");
  const [serviceKey, setServiceKey] = useState("");
  const [adult, setAdult] = useState(1);
  const [child, setChild] = useState(0);
  const [leadName, setLeadName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  /** Add-on slug → quantity. Only entries with a quantity above 0 are kept. */
  const [addOnQty, setAddOnQty] = useState<Record<string, number>>({});

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);

  const visibleAirports = useMemo(
    () => airports.filter((a) => a.country === country),
    [airports, country],
  );

  /** Picking another airport invalidates the service and its add-ons. */
  const chooseAirport = (id: string) => {
    setAirportId(id);
    setServiceKey("");
    setAddOnQty({});
  };

  const airport = airports.find((a) => a.id === airportId) ?? null;
  const airline = airlines.find((a) => a.code === airlineCode) ?? null;
  const service =
    services.find((s) => `${s.slug}::${s.packageId}` === serviceKey) ?? null;

  const visibleServices = useMemo(
    () => (airportId ? services.filter((s) => s.airportId === airportId) : []),
    [services, airportId],
  );

  /** The services of this airport, grouped under their service type. */
  const serviceGroups = useMemo(() => {
    const groups = new Map<string, AirportServiceOption[]>();
    for (const option of visibleServices) {
      const bucket = groups.get(option.categoryName);
      if (bucket) bucket.push(option);
      else groups.set(option.categoryName, [option]);
    }
    return [...groups.entries()];
  }, [visibleServices]);

  const selectedAddOns = service
    ? service.addOns.flatMap((a) => {
        const qty = addOnQty[a.slug] ?? 0;
        return qty > 0 ? [{ ...a, qty }] : [];
      })
    : [];

  const addOnsUsdCents = selectedAddOns.reduce(
    (sum, a) => sum + a.unitUsdCents * a.qty,
    0,
  );

  const totalUsdCents = service
    ? service.adultUsdCents * adult + service.childUsdCents * child + addOnsUsdCents
    : 0;

  const ruleRows = bookingRuleRows(
    rules,
    service ? { hours: service.leadTimeHours, days: service.leadTimeDays } : undefined,
  );

  const serviceSteps = service
    ? resolveServiceSteps(serviceInfo, service.included, airport?.iataCode ?? null)
    : [];

  const airportNote = airport?.iataCode
    ? (serviceInfo[airport.iataCode]?.note ?? serviceInfo.default?.note)
    : serviceInfo.default?.note;

  /** Changing the country drops an airport that no longer belongs to it. */
  const chooseCountry = (name: string) => {
    setCountry(name);
    if (airportId && !airports.some((a) => a.id === airportId && a.country === name)) {
      chooseAirport("");
    }
  };

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  /** Can the customer leave the current step? */
  const canContinue = (): boolean => {
    switch (step) {
      case "country":
        return Boolean(country);
      case "airport":
        return Boolean(airportId);
      case "datetime":
        return Boolean(date && time);
      case "flight":
        return Boolean(airlineCode && flightCode.trim());
      case "service":
        return Boolean(service);
      case "passenger":
        return Boolean(leadName.trim() && email.trim() && phone.trim());
      default:
        return true;
    }
  };

  const goNext = () => {
    if (!canContinue()) return;
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next.key);
  };

  const goBack = () => {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev.key);
  };

  const handleSubmit = async () => {
    if (!service || submitting) return;

    setSubmitting(true);
    setError(null);

    const serviceAt = new Date(`${date}T${time}:00`);
    if (!Number.isFinite(serviceAt.getTime())) {
      setError("Tanggal atau jam tidak valid.");
      setSubmitting(false);
      return;
    }

    const result = await createBooking({
      productSlug: service.slug,
      packageId: service.packageId,
      serviceAt: serviceAt.toISOString(),
      adult,
      child,
      infant: 0,
      addOns: selectedAddOns.map((a) => ({ slug: a.slug, qty: a.qty })),
      contact: {
        firstName: leadName.trim(),
        lastName: "",
        email: email.trim(),
        phoneCountryCode: "ID",
        phone: phone.trim(),
        isGuestSelf: false,
        notes: notes.trim() || undefined,
      },
      flight: {
        airportName: airport
          ? `${airport.name}${airport.iataCode ? ` (${airport.iataCode})` : ""}`
          : undefined,
        location: airport?.city,
        airline: airline ? `${airline.name} (${airline.code})` : undefined,
        flightCode: flightCode.trim().toUpperCase(),
        direction,
      },
      travelers: [],
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
          Permintaan VIP airport kamu diterima
        </h1>
        <p className="mt-1.5 text-[13px] text-muted">
          Tim kami akan menghubungi kamu untuk konfirmasi detail layanan.
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
            href="/airport-vip"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-line bg-white px-5 text-[13px] font-semibold text-ink transition-colors hover:bg-canvas"
          >
            Pesan lagi
          </Link>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------------------- */
  /* Wizard                                                            */
  /* ----------------------------------------------------------------- */
  return (
    <div>
      {/* Stepper */}
      <ol className="mb-7 flex flex-wrap gap-2">
        {STEPS.map((s, index) => {
          const active = s.key === step;
          const done = index < stepIndex;

          return (
            <li key={s.key}>
              <button
                type="button"
                disabled={index > stepIndex}
                onClick={() => index <= stepIndex && setStep(s.key)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  active
                    ? "border-brand bg-brand text-white"
                    : done
                      ? "border-brand/30 bg-brand-soft text-brand-dark"
                      : "border-line bg-white text-muted"
                }`}
              >
                <span className="font-semibold">{index + 1}</span>
                {s.label}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-line bg-white p-6">
          {/* Step 1 — Country */}
          {step === "country" ? (
            <div>
              <h2 className="text-[17px] font-bold tracking-[-0.01em] text-ink">
                Negara tujuan
              </h2>
              <p className="mt-1.5 text-[13px] text-muted">
                Pilih negara, lalu kami tampilkan bandara yang kami layani di sana.
              </p>

              {countries.length === 0 ? (
                <p className="mt-5 rounded-xl border border-line bg-canvas px-4 py-3 text-[13px] text-muted">
                  Belum ada bandara yang aktif. Hubungi kami untuk permintaan khusus.
                </p>
              ) : (
                <div className="mt-5 space-y-2">
                  {countries.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => chooseCountry(c.name)}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                        country === c.name
                          ? "border-brand bg-brand-soft"
                          : "border-line bg-white hover:bg-canvas"
                      }`}
                    >
                      <span className="block text-[14px] font-semibold text-ink">
                        {c.name}
                      </span>
                      <span className="shrink-0 text-[12px] text-muted">
                        {c.airportCount} bandara
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {/* Step 2 — Airport */}
          {step === "airport" ? (
            <div>
              <h2 className="text-[17px] font-bold tracking-[-0.01em] text-ink">
                Di mana layanan ini?
              </h2>
              <p className="mt-1.5 text-[13px] text-muted">
                Pilih bandara dan jenis perjalanan.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {(["arrival", "departure"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDirection(d)}
                    className={`rounded-xl border px-4 py-3 text-left text-[13px] font-semibold transition-colors ${
                      direction === d
                        ? "border-brand bg-brand-soft text-brand-dark"
                        : "border-line bg-white text-ink hover:bg-canvas"
                    }`}
                  >
                    {d === "arrival" ? "Kedatangan (Arrival)" : "Keberangkatan (Departure)"}
                  </button>
                ))}
              </div>

              <div className="mt-5 space-y-2">
                {visibleAirports.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => chooseAirport(a.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                      airportId === a.id
                        ? "border-brand bg-brand-soft"
                        : "border-line bg-white hover:bg-canvas"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block text-[14px] font-semibold text-ink">
                        {a.name}
                      </span>
                      <span className="mt-0.5 block text-[12px] text-muted">{a.city}</span>
                    </span>
                    {a.iataCode ? (
                      <span className="shrink-0 rounded-lg bg-canvas px-2 py-1 font-mono text-[11px] font-semibold text-ink">
                        {a.iataCode}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Step 3 — Date & time */}
          {step === "datetime" ? (
            <div>
              <h2 className="text-[17px] font-bold tracking-[-0.01em] text-ink">
                Kapan kamu butuh layanan?
              </h2>
              <p className="mt-1.5 text-[13px] text-muted">
                Pilih tanggal dan jam layanan.
              </p>

              <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-ink">
                    Tanggal
                  </span>
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
            </div>
          ) : null}

          {/* Step 4 — Flight */}
          {step === "flight" ? (
            <div>
              <h2 className="text-[17px] font-bold tracking-[-0.01em] text-ink">
                Detail penerbangan
              </h2>
              <p className="mt-1.5 text-[13px] text-muted">
                Kami butuh ini supaya tim kami tahu kapan menunggu Kamu.
              </p>

              <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-ink">
                    Maskapai
                  </span>
                  <select
                    value={airlineCode}
                    onChange={(e) => setAirlineCode(e.target.value)}
                    className="h-11 w-full rounded-xl border border-line bg-white px-3 text-[13px] text-ink outline-none transition-colors focus:border-brand"
                  >
                    <option value="">Pilih maskapai…</option>
                    {airlines.map((a) => (
                      <option key={a.code} value={a.code}>
                        {a.name} ({a.code})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-ink">
                    Nomor penerbangan
                  </span>
                  <input
                    type="text"
                    value={flightCode}
                    onChange={(e) => setFlightCode(e.target.value.toUpperCase())}
                    placeholder="GA 012"
                    className="h-11 w-full rounded-xl border border-line bg-white px-3 font-mono text-[13px] tracking-[0.04em] text-ink outline-none transition-colors focus:border-brand"
                  />
                </label>
              </div>
            </div>
          ) : null}

          {/* Step 5 — Service */}
          {step === "service" ? (
            <div>
              <h2 className="text-[17px] font-bold tracking-[-0.01em] text-ink">
                Pilih layanan
              </h2>
              <p className="mt-1.5 text-[13px] text-muted">
                Harga per penumpang, mengikuti data di database.
              </p>

              {serviceGroups.length === 0 ? (
                <p className="mt-5 rounded-xl border border-line bg-canvas px-4 py-3 text-[13px] text-muted">
                  Belum ada layanan untuk bandara ini. Pilih bandara lain atau
                  hubungi kami untuk permintaan khusus.
                </p>
              ) : null}

              <div className="mt-5 space-y-5">
                {serviceGroups.map(([category, options]) => (
                  <div key={category}>
                    <h3 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted">
                      {category}
                    </h3>

                    <div className="mt-2 space-y-2.5">
                {options.map((s) => {
                  const value = `${s.slug}::${s.packageId}`;
                  const active = value === serviceKey;

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setServiceKey(value)}
                      className={`flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition-colors ${
                        active
                          ? "border-brand bg-brand-soft"
                          : "border-line bg-white hover:bg-canvas"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block text-[14px] font-semibold text-ink">
                          {s.title}
                        </span>
                        <span className="mt-0.5 block text-[12px] text-muted">
                          {s.packageLabel}
                          {s.direction ? ` · ${s.direction}` : ""}
                        </span>
                      </span>
                      <span className="shrink-0 text-[14px] font-bold text-ink">
                        {formatMoney((s.adultUsdCents || s.childUsdCents) / 100)}
                      </span>
                    </button>
                  );
                })}
                    </div>
                  </div>
                ))}
              </div>

              {service ? (
                <>
                  {/* Service description */}
                  <section className="mt-6 rounded-xl border border-line bg-canvas p-5">
                    <h3 className="text-[14px] font-bold tracking-[-0.01em] text-ink">
                      Rincian layanan
                    </h3>
                    <p className="mt-0.5 text-[12px] text-muted">
                      {airport
                        ? `${airport.name}${airport.iataCode ? ` (${airport.iataCode})` : ""}`
                        : service.title}
                    </p>

                    {service.description ? (
                      <p className="mt-3 text-[13px] leading-relaxed text-ink">
                        {service.description}
                      </p>
                    ) : null}

                    {serviceSteps.length > 0 ? (
                      <ol className="mt-3 space-y-1.5">
                        {serviceSteps.map((item, index) => (
                          <li key={item} className="flex gap-2.5 text-[13px] text-ink">
                            <span className="shrink-0 font-semibold text-brand">
                              {index + 1}.
                            </span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ol>
                    ) : null}

                    {service.requirements.length > 0 ? (
                      <div className="mt-4 border-t border-line pt-3">
                        <p className="text-[12px] font-semibold text-ink">
                          Yang perlu kamu siapkan
                        </p>
                        <ul className="mt-1.5 space-y-1">
                          {service.requirements.map((item) => (
                            <li key={item} className="text-[12px] text-muted">
                              · {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {airportNote ? (
                      <p className="mt-4 border-t border-line pt-3 text-[12px] leading-relaxed text-muted">
                        <span className="font-semibold text-ink">
                          Catatan {airport?.iataCode}.
                        </span>{" "}
                        {airportNote}
                      </p>
                    ) : null}
                  </section>

                  {/* Optional add-ons */}
                  {service.addOns.length > 0 ? (
                    <section className="mt-4">
                      <h3 className="text-[14px] font-bold tracking-[-0.01em] text-ink">
                        Layanan tambahan
                      </h3>
                      <p className="mt-0.5 text-[12px] text-muted">
                        Opsional — harganya langsung masuk ke total.
                      </p>

                      <div className="mt-3 space-y-2">
                        {service.addOns.map((a) => (
                          <PaxStepper
                            key={a.slug}
                            label={a.title}
                            price={`${formatMoney(a.unitUsdCents / 100)} per unit`}
                            value={addOnQty[a.slug] ?? 0}
                            max={10}
                            onChange={(next) =>
                              setAddOnQty((prev) => ({ ...prev, [a.slug]: next }))
                            }
                          />
                        ))}
                      </div>
                    </section>
                  ) : null}
                </>
              ) : null}
            </div>
          ) : null}

          {/* Step 6 — Passengers */}
          {step === "passenger" ? (
            <div>
              <h2 className="text-[17px] font-bold tracking-[-0.01em] text-ink">
                Data penumpang
              </h2>
              <p className="mt-1.5 text-[13px] text-muted">
                Cukup nama penanggung jawab dan cara kami menghubungi kamu.
              </p>

              <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-ink">
                    Dewasa
                  </span>
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
                  <span className="mb-1.5 block text-[12px] font-medium text-ink">
                    Anak
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={child}
                    onChange={(e) => setChild(Math.max(0, Number(e.target.value) || 0))}
                    className="h-11 w-full rounded-xl border border-line bg-white px-3 text-[13px] text-ink outline-none transition-colors focus:border-brand"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-[12px] font-medium text-ink">
                    Nama penanggung jawab
                  </span>
                  <input
                    type="text"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    className="h-11 w-full rounded-xl border border-line bg-white px-3 text-[13px] text-ink outline-none transition-colors focus:border-brand"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-ink">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 w-full rounded-xl border border-line bg-white px-3 text-[13px] text-ink outline-none transition-colors focus:border-brand"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-ink">
                    Telepon
                  </span>
                  <input
                    type="tel"
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
                    className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-[13px] text-ink outline-none transition-colors focus:border-brand"
                  />
                </label>
              </div>
            </div>
          ) : null}

          {/* Step 7 — Confirm */}
          {step === "confirm" ? (
            <div>
              <h2 className="text-[17px] font-bold tracking-[-0.01em] text-ink">
                Konfirmasi
              </h2>
              <p className="mt-1.5 text-[13px] text-muted">
                Periksa sekali lagi sebelum mengirim permintaan.
              </p>

              <dl className="mt-5 divide-y divide-line border-y border-line">
                <Row label="Negara" value={country || "—"} />
                <Row
                  label="Bandara"
                  value={airport ? `${airport.name} (${airport.city})` : "—"}
                />
                <Row
                  label="Jenis"
                  value={direction === "arrival" ? "Kedatangan" : "Keberangkatan"}
                />
                <Row
                  label="Jadwal"
                  value={`${
                    date
                      ? new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"
                  } · ${time}`}
                />
                <Row
                  label="Penerbangan"
                  value={
                    airline
                      ? `${airline.name} (${airline.code})${
                          flightCode ? ` · ${flightCode.toUpperCase()}` : ""
                        }`
                      : "—"
                  }
                />
                <Row
                  label="Layanan"
                  value={service ? `${service.title} · ${service.packageLabel}` : "—"}
                />
                <Row
                  label="Penumpang"
                  value={`${adult} dewasa${child > 0 ? `, ${child} anak` : ""}`}
                />
                {selectedAddOns.map((a) => (
                  <Row
                    key={a.slug}
                    label="Tambahan"
                    value={`${a.title} ×${a.qty}`}
                  />
                ))}
                <Row label="Nama" value={leadName || "—"} />
                <Row label="Email" value={email || "—"} />
                <Row label="Telepon" value={phone || "—"} />
              </dl>

              {error ? (
                <p className="mt-4 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-[13px] text-danger">
                  {error}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Navigation */}
          <div className="mt-7 flex items-center justify-between gap-3 border-t border-line pt-5">
            <button
              type="button"
              onClick={goBack}
              disabled={stepIndex === 0}
              className="h-11 rounded-xl border border-line bg-white px-5 text-[13px] font-semibold text-ink transition-colors hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-40"
            >
              Kembali
            </button>

            {step === "confirm" ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="h-11 rounded-xl bg-brand px-6 text-[13px] font-semibold text-white transition-opacity hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Memproses…" : "Lanjut ke pembayaran"}
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                disabled={!canContinue()}
                className="h-11 rounded-xl bg-brand px-6 text-[13px] font-semibold text-white transition-opacity hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                Lanjut
              </button>
            )}
          </div>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-[15px] font-bold tracking-[-0.01em] text-ink">
              Ringkasan
            </h2>

            <dl className="mt-4 space-y-2.5 text-[13px]">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Negara</dt>
                <dd className="text-right font-medium text-ink">
                  {country || "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Bandara</dt>
                <dd className="text-right font-medium text-ink">
                  {airport?.city ?? "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Jadwal</dt>
                <dd className="text-right font-medium text-ink">
                  {date ? `${date} · ${time}` : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Layanan</dt>
                <dd className="text-right font-medium text-ink">
                  {service?.title ?? "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Penumpang</dt>
                <dd className="text-right font-medium text-ink">
                  {adult} dewasa{child > 0 ? `, ${child} anak` : ""}
                </dd>
              </div>
            </dl>

            {selectedAddOns.length > 0 ? (
              <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-[12px]">
                {selectedAddOns.map((a) => (
                  <div key={a.slug} className="flex items-center justify-between gap-4">
                    <dt className="text-muted">
                      {a.title} ×{a.qty}
                    </dt>
                    <dd className="text-right text-ink">
                      {formatMoney((a.unitUsdCents * a.qty) / 100)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {/* Base price */}
            <div className="mt-4 border-t border-line pt-4">
              <span className="text-[12px] text-muted">Harga dasar</span>
              <p className="mt-0.5 text-[24px] font-bold tracking-[-0.02em] text-ink">
                {formatMoney(totalUsdCents / 100)}
              </p>
              <p className="mt-1 text-[12px] text-muted">
                {service
                  ? `${service.title} · ${adult + child} penumpang`
                  : "Pilih layanan untuk melihat harga"}
              </p>
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-muted">
              Harga di atas belum termasuk biaya pemesanan mendadak, tengah malam,
              akhir pekan, atau hari libur bila berlaku. Total akhir dihitung di
              server beserta pajak yang berlaku.
            </p>
          </div>

          {/* Booking rules */}
          <div className="mt-4 rounded-2xl border border-line bg-white p-5">
            <h2 className="text-[15px] font-bold tracking-[-0.01em] text-ink">
              Aturan pemesanan
            </h2>

            <dl className="mt-3 divide-y divide-line text-[12px]">
              {ruleRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-start justify-between gap-4 py-2"
                >
                  <dt className="text-muted">{row.label}</dt>
                  <dd className="shrink-0 text-right font-medium text-ink">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
