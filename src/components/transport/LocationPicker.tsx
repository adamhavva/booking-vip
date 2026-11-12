"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { PickedPoint } from "@/components/map/PickMap";
import { searchAddress } from "@/lib/geocode";

/**
 * The map of the transport flow.
 *
 * Leaflet only works in the browser, so the map is loaded with `ssr: false`
 * and a plain skeleton is shown until it is ready.
 */
const PickMap = dynamic(() => import("@/components/map/PickMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-canvas text-[13px] text-muted">
      Memuat peta…
    </div>
  ),
});

export type { PickedPoint };

/** A search result from the address lookup. */
type SearchResult = {
  lat: number;
  lng: number;
  label: string;
};

/** The pickup / dropoff picker of the transport flow. */
export default function LocationPicker({
  pickup,
  dropoff,
  activeField,
  onChange,
  onActiveFieldChange,
  heading = "Titik jemput",
  description = "Pilih titik pickup dan dropoff — klik peta, geser pin, atau cari alamat.",
  pickupLabel = "Lokasi pickup",
  dropoffLabel = "Lokasi dropoff",
  searchLabel = "Cari alamat",
  searchPlaceholder = "Contoh: Plaza Senayan, Jakarta",
}: {
  pickup: PickedPoint | null;
  dropoff: PickedPoint | null;
  /** Which field is being filled right now. */
  activeField: "pickup" | "dropoff";
  onChange: (field: "pickup" | "dropoff", point: PickedPoint | null) => void;
  onActiveFieldChange: (field: "pickup" | "dropoff") => void;
  heading?: string;
  description?: string;
  pickupLabel?: string;
  dropoffLabel?: string;
  searchLabel?: string;
  searchPlaceholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The address of the field that is currently being edited.
  const activeValue = activeField === "pickup" ? pickup : dropoff;
  const [address, setAddress] = useState(activeValue?.label ?? "");

  useEffect(() => {
    setAddress(activeValue?.label ?? "");
  }, [activeField, activeValue?.label]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  /** Run the address search — debounced while the customer types. */
  const runSearch = useCallback(
    async (text: string) => {
      if (text.trim().length < 3) {
        setResults([]);
        setSearchError(null);
        return;
      }

      setSearching(true);
      setSearchError(null);

      try {
        const found = await searchAddress(text);
        setResults(found);
        if (found.length === 0) {
          setSearchError("Alamat tidak ditemukan. Coba nama lain atau klik peta.");
        }
      } catch {
        setResults([]);
        setSearchError("Pencarian alamat sedang tidak tersedia. Klik peta untuk memilih lokasi.");
      } finally {
        setSearching(false);
      }
    },
    [],
  );

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(text), 500);
  };

  /** Use the real location of the device (the button under the two fields). */
  const handleUseMyLocation = () => {
    if (!("geolocation" in navigator)) {
      setGeoError("Perangkat kamu tidak mendukung lokasi otomatis.");
      return;
    }

    setLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        onChange(activeField, {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          label: "Lokasi saya",
        });
      },
      () => {
        setLocating(false);
        setGeoError("Tidak bisa membaca lokasi kamu. Pastikan izin lokasi aktif.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  /** A click on the map fills the field that is active. */
  const handleMapPick = (point: { lat: number; lng: number }) => {
    onChange(activeField, {
      lat: point.lat,
      lng: point.lng,
      label: `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`,
    });
  };

  /** A dragged pin moves the point it belongs to. */
  const handleMapMove = (
    field: "pickup" | "dropoff",
    point: { lat: number; lng: number },
  ) => {
    onChange(field, {
      lat: point.lat,
      lng: point.lng,
      label: `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`,
    });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
      {/* Left: the two address fields */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-[15px] font-bold text-ink">{heading}</h2>
          <p className="mt-1 text-[13px] text-muted">{description}</p>

          {/* Pickup */}
          <button
            type="button"
            onClick={() => onActiveFieldChange("pickup")}
            className={`mt-4 flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
              activeField === "pickup"
                ? "border-brand bg-brand-soft"
                : "border-line bg-white hover:bg-canvas"
            }`}
          >
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">
              A
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-semibold text-ink">
                {pickupLabel}
              </span>
              <span className="mt-0.5 block truncate text-[12px] text-muted">
                {pickup?.label ?? "Belum dipilih"}
              </span>
            </span>
          </button>

          {/* Dropoff */}
          <button
            type="button"
            onClick={() => onActiveFieldChange("dropoff")}
            className={`mt-2 flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
              activeField === "dropoff"
                ? "border-danger bg-danger/5"
                : "border-line bg-white hover:bg-canvas"
            }`}
          >
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-danger text-[11px] font-bold text-white">
              B
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-semibold text-ink">
                {dropoffLabel}
              </span>
              <span className="mt-0.5 block truncate text-[12px] text-muted">
                {dropoff?.label ?? "Belum dipilih"}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={locating}
            className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-canvas disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.7" />
            </svg>
            {locating ? "Mencari lokasi…" : "Gunakan lokasi saya"}
          </button>

          {geoError ? (
            <p className="mt-2 text-[12px] text-danger">{geoError}</p>
          ) : null}
        </div>

        {/* Address search */}
        <div className="rounded-2xl border border-line bg-white p-5">
          <label
            htmlFor="transport-address-search"
            className="block text-[12px] font-semibold text-ink"
          >
            {searchLabel} ({activeField === "pickup" ? pickupLabel : dropoffLabel})
          </label>
          <input
            id="transport-address-search"
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="mt-2 h-10 w-full rounded-xl border border-line bg-white px-3 text-[13px] text-ink outline-none placeholder:text-muted focus:border-brand"
          />

          {searching ? (
            <p className="mt-2 text-[12px] text-muted">Mencari alamat…</p>
          ) : null}
          {searchError ? (
            <p className="mt-2 text-[12px] text-muted">{searchError}</p>
          ) : null}

          {results.length > 0 ? (
            <ul className="mt-3 space-y-1">
              {results.map((result) => (
                <li key={`${result.lat}-${result.lng}`}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(activeField, result);
                      setResults([]);
                      setQuery("");
                    }}
                    className="w-full rounded-lg border border-line px-3 py-2 text-left text-[12px] text-ink transition-colors hover:bg-canvas"
                  >
                    {result.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {/* Right: the map */}
      <div className="h-[420px] overflow-hidden rounded-2xl border border-line bg-canvas lg:h-[560px]">
        <PickMap
          pickup={pickup}
          dropoff={dropoff}
          activeField={activeField}
          onPick={handleMapPick}
          onMove={handleMapMove}
        />
      </div>
    </div>
  );
}
