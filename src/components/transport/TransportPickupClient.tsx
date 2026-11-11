"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LocationPicker, { type PickedPoint } from "@/components/transport/LocationPicker";

/**
 * Step 1 of the transport flow — pick the pickup and the dropoff point.
 *
 * The map is the first thing the customer sees: they click the map, use
 * "Gunakan lokasi saya" or search for an address. "Lanjut" only unlocks when
 * both points are set, then the route is handed over to the booking step.
 */
export default function TransportPickupClient() {
  const router = useRouter();

  const [pickup, setPickup] = useState<PickedPoint | null>(null);
  const [dropoff, setDropoff] = useState<PickedPoint | null>(null);
  const [activeField, setActiveField] = useState<"pickup" | "dropoff">("pickup");

  const ready = Boolean(pickup && dropoff);

  const handleContinue = () => {
    if (!pickup || !dropoff) return;

    const params = new URLSearchParams();
    params.set("pickup", JSON.stringify(pickup));
    params.set("dropoff", JSON.stringify(dropoff));

    router.push(`/transport/booking?${params.toString()}`);
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
      />

      <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-line bg-white p-5 sm:flex-row">
        <p className="text-[13px] text-muted">
          {ready
            ? "Rute siap. Lanjut untuk mengisi detail perjalanan."
            : "Pilih titik pickup dan dropoff untuk melanjutkan."}
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
