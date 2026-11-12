"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LocationPicker, { type PickedPoint } from "@/components/transport/LocationPicker";
import { stringifyPickedPoint } from "@/lib/picked-point";

/**
 * Step 1 of the tour flow — pick the meeting point and the destination.
 *
 * The map comes first: the customer clicks the map, drags the pin, or uses
 * "lokasi saya". "Lanjut" only unlocks when both points are set, then the
 * route is handed over to the booking step.
 */
export default function TourPackageSearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [pickup, setPickup] = useState<PickedPoint | null>(null);
  const [dropoff, setDropoff] = useState<PickedPoint | null>(null);
  const [activeField, setActiveField] = useState<"pickup" | "dropoff">("pickup");

  const ready = Boolean(pickup && dropoff);

  const handleContinue = () => {
    if (!pickup || !dropoff) return;

    // The package, the date and the passenger counts travel with the route,
    // so the booking step keeps the whole selection.
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("pickup", stringifyPickedPoint(pickup));
    params.set("dropoff", stringifyPickedPoint(dropoff));

    router.push(`/tour-package/booking?${params.toString()}`);
  };

  return (
    <div>
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
        heading="Titik jemput & tujuan"
        description="Tentukan titik berangkat dan tujuan — klik peta, geser pin, atau pakai lokasi kamu."
        pickupLabel="Titik berangkat"
        dropoffLabel="Tujuan wisata"
        searchLabel="Cari tempat"
        searchPlaceholder="Contoh: Hotel Marriott, Bali"
      />

      <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-line bg-white p-5 sm:flex-row">
        <p className="text-[13px] text-muted">
          {ready
            ? "Rute siap. Lanjut untuk memilih paket tour dan mengisi detail."
            : "Pilih titik berangkat dan tujuan untuk melanjutkan."}
        </p>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!ready}
          className="h-11 w-full rounded-xl bg-brand px-8 text-[14px] font-semibold text-white transition-opacity hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          Lanjut
        </button>
      </div>
    </div>
  );
}
