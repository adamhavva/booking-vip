"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Container from "@/components/ui/Container";
import DateTimePopover from "@/components/ui/DateTimePopover";
import PlaceSelect from "@/components/ui/PlaceSelect";
import LocationPicker, { type PickedPoint } from "@/components/transport/LocationPicker";
import { SearchIcon } from "@/components/icons";
import { searchAddress } from "@/lib/geocode";
import { stringifyPickedPoint } from "@/lib/picked-point";
import type { PlaceNode } from "@/lib/places";

/** The driver options — the same two the marketplace offers. */
const DRIVER_OPTIONS = [
  { value: "with_driver", label: "Dengan supir" },
  { value: "without_driver", label: "Tanpa supir" },
] as const;

export type TransportSearchClientProps = {
  /** The place hierarchy — the cities with their pick-up areas below them. */
  places: PlaceNode[];
  /** The vehicle classes ("Sedan", "SUV", …). */
  vehicleTypes: { slug: string; name: string }[];
};

/** The days between two ISO dates (at least one). */
function daysBetween(from: string, to: string): number {
  const start = new Date(`${from}T00:00:00`).getTime();
  const end = new Date(`${to}T00:00:00`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 1;
  return Math.max(1, Math.round((end - start) / 86_400_000));
}

/** Tomorrow, in `YYYY-MM-DD`. */
function tomorrow(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

/** The day after tomorrow, in `YYYY-MM-DD`. */
function dayAfterTomorrow(): string {
  const date = new Date();
  date.setDate(date.getDate() + 2);
  return date.toISOString().slice(0, 10);
}

/**
 * The entry page of the transport service — "Sewa Mobil".
 *
 * The customer picks the pick-up and the drop-off (on the map or from the
 * place hierarchy), the pick-up and the return date, whether a driver is
 * included and which class of car they want. "Cari mobil" then takes them to
 * the fleet list with everything filled in.
 */
export default function TransportSearchClient({
  places,
  vehicleTypes,
}: TransportSearchClientProps) {
  const router = useRouter();

  const [pickup, setPickup] = useState<PickedPoint | null>(null);
  const [dropoff, setDropoff] = useState<PickedPoint | null>(null);
  const [activeField, setActiveField] = useState<"pickup" | "dropoff">("pickup");

  const [pickupDate, setPickupDate] = useState(tomorrow);
  const [pickupTime, setPickupTime] = useState("09:00");
  const [returnDate, setReturnDate] = useState(dayAfterTomorrow);
  const [returnTime, setReturnTime] = useState("09:00");

  const [driverOption, setDriverOption] = useState<string>("with_driver");
  const [vehicleType, setVehicleType] = useState<string>("");

  const [geocoding, setGeocoding] = useState(false);

  const days = useMemo(
    () => daysBetween(pickupDate, returnDate),
    [pickupDate, returnDate],
  );

  /** Pick a place from the hierarchy and move the pin onto it. */
  const choosePlace = async (label: string) => {
    setGeocoding(true);
    try {
      const found = await searchAddress(label);
      if (found.length === 0) return;
      const point = { lat: found[0].lat, lng: found[0].lng, label: found[0].label };
      if (activeField === "pickup") {
        setPickup(point);
        setActiveField("dropoff");
      } else {
        setDropoff(point);
      }
    } catch {
      // The map is still there — the customer can click it instead.
    } finally {
      setGeocoding(false);
    }
  };

  const search = () => {
    const params = new URLSearchParams();
    params.set("date", pickupDate);
    params.set("time", pickupTime);
    params.set("returnDate", returnDate);
    params.set("returnTime", returnTime);
    params.set("totalDays", String(days));
    params.set("driverOption", driverOption);
    if (vehicleType) params.set("type", vehicleType);
    if (pickup) {
      params.set("from", pickup.label);
      params.set("latitude", String(pickup.lat));
      params.set("longitude", String(pickup.lng));
      params.set("pickup", stringifyPickedPoint(pickup));
    }
    if (dropoff) {
      params.set("to", dropoff.label);
      params.set("dropoff", stringifyPickedPoint(dropoff));
    }

    router.push(`/transport/armada?${params.toString()}`);
  };

  return (
    <div className="space-y-5">
      {/* The form */}
      <section className="rounded-2xl border border-line bg-white p-5 md:p-6">
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Pick-up */}
          <PlaceSelect
            label="Lokasi penjemputan"
            places={places}
            value={pickup?.label ?? ""}
            selectableKinds={["city", "area"]}
            placeholder="Pilih kota atau area penjemputan"
            onSelect={choosePlace}
          />

          {/* Drop-off */}
          <PlaceSelect
            label="Lokasi tujuan"
            places={places}
            value={dropoff?.label ?? ""}
            selectableKinds={["city", "area"]}
            placeholder="Pilih kota atau area tujuan"
            onSelect={choosePlace}
          />
        </div>

        {/* Dates */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-canvas px-4 py-2.5">
            <DateTimePopover
              label="Tanggal & jam penjemputan"
              date={pickupDate}
              time={pickupTime}
              onDate={setPickupDate}
              onTime={setPickupTime}
            />
          </div>
          <div className="rounded-xl bg-canvas px-4 py-2.5">
            <DateTimePopover
              label="Tanggal & jam pengembalian"
              date={returnDate}
              time={returnTime}
              onDate={setReturnDate}
              onTime={setReturnTime}
            />
          </div>
        </div>

        {/* Driver + class */}
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <p className="mb-2 text-[12px] font-medium text-ink">Opsi supir</p>
            <div className="flex flex-wrap gap-2">
              {DRIVER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDriverOption(option.value)}
                  className={`h-9 rounded-full border px-4 text-[12px] font-semibold transition-colors ${
                    driverOption === option.value
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-line bg-white text-muted hover:bg-canvas"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[12px] font-medium text-ink">Tipe mobil</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setVehicleType("")}
                className={`h-9 rounded-full border px-4 text-[12px] font-semibold transition-colors ${
                  vehicleType === ""
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-line bg-white text-muted hover:bg-canvas"
                }`}
              >
                Semua
              </button>
              {vehicleTypes.map((type) => (
                <button
                  key={type.slug}
                  type="button"
                  onClick={() => setVehicleType(type.slug)}
                  className={`h-9 rounded-full border px-4 text-[12px] font-semibold transition-colors ${
                    vehicleType === type.slug
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

        {/* Summary + search */}
        <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-line pt-5 sm:flex-row sm:items-center">
          <p className="text-[13px] text-muted">
            {days} hari ·{" "}
            {driverOption === "with_driver" ? "dengan supir" : "tanpa supir"}
            {vehicleType
              ? ` · ${vehicleTypes.find((t) => t.slug === vehicleType)?.name ?? ""}`
              : ""}
          </p>
          <button
            type="button"
            onClick={search}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-8 text-[14px] font-semibold text-white transition-opacity hover:bg-brand-dark sm:w-auto"
          >
            <SearchIcon width={16} height={16} />
            Cari mobil
          </button>
        </div>
      </section>

      {/* The map */}
      <section className="rounded-2xl border border-line bg-white p-4 md:p-5">
        <h2 className="text-[15px] font-bold tracking-[-0.01em] text-ink">
          Tentukan titik pickup &amp; dropoff
        </h2>
        <p className="mt-1 text-[13px] text-muted">
          Klik peta, geser pin, atau gunakan "Gunakan lokasi saya".
        </p>
        <div className="mt-4">
          <LocationPicker
            pickup={pickup}
            dropoff={dropoff}
            activeField={activeField}
            onActiveFieldChange={setActiveField}
            onChange={(field, point) => {
              if (field === "pickup") {
                setPickup(point);
                if (point) setActiveField("dropoff");
              } else {
                setDropoff(point);
              }
            }}
            heading=""
            description=""
          />
        </div>
      </section>
    </div>
  );
}
