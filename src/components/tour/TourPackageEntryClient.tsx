"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DateTimePopover from "@/components/ui/DateTimePopover";
import PaxPopover, { DEFAULT_PAX, type PaxCounts } from "@/components/ui/PaxPopover";
import PlaceSelect from "@/components/ui/PlaceSelect";
import { SearchIcon } from "@/components/icons";
import type { PlaceNode } from "@/lib/places";

export type TourPackageEntryClientProps = {
  /** The destination hierarchy — the cities with the tourist spots below them. */
  places: PlaceNode[];
  /** The tour classes ("Private", "Group", "Daily", …). */
  tourTypes: { slug: string; name: string }[];
};

/** Tomorrow, in `YYYY-MM-DD`. */
function tomorrow(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

/**
 * The entry page of the tour service.
 *
 * The customer picks the destination, the day of departure, how many people
 * travel and which kind of tour they want — the packages are shown next.
 */
export default function TourPackageEntryClient({
  places,
  tourTypes,
}: TourPackageEntryClientProps) {
  const router = useRouter();

  const [destination, setDestination] = useState("");
  const [date, setDate] = useState(tomorrow);
  const [time, setTime] = useState("09:00");
  const [pax, setPax] = useState<PaxCounts>(DEFAULT_PAX);
  const [tourType, setTourType] = useState("");

  const search = () => {
    const params = new URLSearchParams();
    if (destination) params.set("destination", destination);
    params.set("date", date);
    params.set("time", time);
    params.set("adults", String(pax.adults));
    params.set("children", String(pax.children));
    params.set("infants", String(pax.infants));
    if (tourType) params.set("type", tourType);

    router.push(`/tour-package/paket?${params.toString()}`);
  };

  return (
    <section className="rounded-2xl border border-line bg-white p-5 md:p-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <PlaceSelect
          label="Destinasi"
          places={places}
          value={destination}
          selectableKinds={["destination"]}
          placeholder="Pilih destinasiendgroup"
          onSelect={setDestination}
        />

        <div className="rounded-xl bg-canvas px-4 py-2.5">
          <DateTimePopover
            label="Tanggal mulai"
            date={date}
            time={time}
            onDate={setDate}
            onTime={setTime}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-canvas px-4 py-2.5">
          <PaxPopover label="Jumlah penumpang" value={pax} onChange={setPax} />
        </div>

        <div>
          <p className="mb-2 text-[12px] font-medium text-ink">Tipe tour</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTourType("")}
              className={`h-9 rounded-full border px-4 text-[12px] font-semibold transition-colors ${
                tourType === ""
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-line bg-white text-muted hover:bg-canvas"
              }`}
            >
              Semua
            </button>
            {tourTypes.map((type) => (
              <button
                key={type.slug}
                type="button"
                onClick={() => setTourType(type.slug)}
                className={`h-9 rounded-full border px-4 text-[12px] font-semibold transition-colors ${
                  tourType === type.slug
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-line bg-white text-muted hover:bg-canvas"
                }`}
              >
                {type.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-line pt-5 sm:flex-row sm:items-center">
        <p className="text-[13px] text-muted">
          {destination ? `${destination} · ` : ""}
          {pax.adults} dewasa
          {pax.children > 0 ? `, ${pax.children} anak` : ""}
          {pax.infants > 0 ? `, ${pax.infants} bayi` : ""}
        </p>
        <button
          type="button"
          onClick={search}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-8 text-[14px] font-semibold text-white transition-opacity hover:bg-brand-dark sm:w-auto"
        >
          <SearchIcon width={16} height={16} />
          Cari paket
        </button>
      </div>
    </section>
  );
}
