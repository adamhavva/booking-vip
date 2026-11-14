"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, MapPin } from "lucide-react";
import DateTimePopover from "@/components/ui/DateTimePopover";
import LocationModal from "@/components/transport/LocationModal";
import { useLocale } from "@/components/providers/LocaleProvider";
import { SearchIcon } from "@/components/icons";
import { stringifyPickedPoint, type PickedPoint } from "@/lib/picked-point";
import type { PlaceNode } from "@/lib/places";

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
 * Clicking the pick-up or the drop-off field opens the map modal (city
 * dropdown, clickable map, draggable pin, device location). "Cari mobil"
 * then takes the customer to the results list with everything filled in.
 */
export default function TransportSearchClient({
  places,
  vehicleTypes,
}: TransportSearchClientProps) {
  const router = useRouter();
  const { t } = useLocale();

  const [pickup, setPickup] = useState<PickedPoint | null>(null);
  const [dropoff, setDropoff] = useState<PickedPoint | null>(null);
  /** Which field the map modal is editing — null keeps it closed. */
  const [modalField, setModalField] = useState<"pickup" | "dropoff" | null>(null);

  const [pickupDate, setPickupDate] = useState(tomorrow);
  const [pickupTime, setPickupTime] = useState("09:00");
  const [returnDate, setReturnDate] = useState(dayAfterTomorrow);
  const [returnTime, setReturnTime] = useState("09:00");

  const [driverOption, setDriverOption] = useState<string>("with_driver");
  const [vehicleType, setVehicleType] = useState<string>("");

  const days = useMemo(
    () => daysBetween(pickupDate, returnDate),
    [pickupDate, returnDate],
  );

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
      params.set("pickup", stringifyPickedPoint(pickup));
    }
    if (dropoff) {
      params.set("to", dropoff.label);
      params.set("dropoff", stringifyPickedPoint(dropoff));
    }

    router.push(`/transport/armada?${params.toString()}`);
  };

  const driverOptions = [
    { value: "with_driver", label: t("transport.withDriver") },
    { value: "without_driver", label: t("transport.withoutDriver") },
  ];

  return (
    <div className="space-y-5">
      {/* The form */}
      <section className="rounded-2xl border border-line bg-white p-5 md:p-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <PlaceField
            label={t("transport.pickupLabel")}
            placeholder={t("transport.pickupPlaceholder")}
            point={pickup}
            onOpen={() => setModalField("pickup")}
          />
          <PlaceField
            label={t("transport.dropoffLabel")}
            placeholder={t("transport.dropoffPlaceholder")}
            point={dropoff}
            onOpen={() => setModalField("dropoff")}
          />
        </div>

        {/* Dates */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-canvas px-4 py-2.5">
            <DateTimePopover
              label={t("transport.pickupDateTime")}
              date={pickupDate}
              time={pickupTime}
              onDate={setPickupDate}
              onTime={setPickupTime}
            />
          </div>
          <div className="rounded-xl bg-canvas px-4 py-2.5">
            <DateTimePopover
              label={t("transport.returnDateTime")}
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
            <p className="mb-2 text-[12px] font-medium text-ink">
              {t("transport.driverOption")}
            </p>
            <div className="flex flex-wrap gap-2">
              {driverOptions.map((option) => (
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
            <p className="mb-2 text-[12px] font-medium text-ink">
              {t("transport.vehicleType")}
            </p>
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
                {t("transport.allTypes")}
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
            {t("transport.daysSummary", { n: days })} ·{" "}
            {driverOption === "with_driver"
              ? t("transport.withDriver")
              : t("transport.withoutDriver")}
            {vehicleType
              ? ` · ${vehicleTypes.find((type) => type.slug === vehicleType)?.name ?? ""}`
              : ""}
          </p>
          <button
            type="button"
            onClick={search}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-8 text-[14px] font-semibold text-white transition-opacity hover:bg-brand-dark sm:w-auto"
          >
            <SearchIcon width={16} height={16} />
            {t("transport.searchCars")}
          </button>
        </div>
      </section>

      {/* The map modal — opened by either place field. */}
      <LocationModal
        field={modalField}
        point={modalField === "pickup" ? pickup : dropoff}
        places={places}
        onClose={() => setModalField(null)}
        onConfirm={(field, point) => {
          if (field === "pickup") setPickup(point);
          else setDropoff(point);
        }}
      />
    </div>
  );
}

/** One place field — a trigger that opens the map modal for that field. */
function PlaceField({
  label,
  placeholder,
  point,
  onOpen,
}: {
  label: string;
  placeholder: string;
  point: PickedPoint | null;
  onOpen: () => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-[12px] font-medium text-ink">{label}</span>
      <button
        type="button"
        onClick={onOpen}
        className={`flex h-11 w-full items-center gap-2 rounded-xl border border-line bg-white px-3 text-left text-[13px] transition-colors hover:bg-canvas ${
          point ? "text-ink" : "text-muted"
        }`}
      >
        <MapPin width={16} height={16} className="shrink-0 text-brand" />
        <span className="min-w-0 flex-1 truncate">
          {point?.label ?? placeholder}
        </span>
        <ChevronDown width={16} height={16} className="shrink-0 text-muted" />
      </button>
    </div>
  );
}