"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type PickedPoint = {
  lat: number;
  lng: number;
  /** A short human label — the address or a coordinate fallback. */
  label: string;
};

/** Jakarta — the default view of the map. */
const DEFAULT_CENTER: [number, number] = [-6.2088, 106.8456];

/**
 * A pin drawn with plain HTML.
 *
 * Leaflet's default marker images break when the app is bundled, so the
 * markers are built as a `divIcon` instead — no image files needed.
 */
function pinIcon(kind: "pickup" | "dropoff", active: boolean) {
  const color = kind === "pickup" ? "#0064d2" : "#e4002b";
  const letter = kind === "pickup" ? "A" : "B";

  return L.divIcon({
    className: "",
    html: `<div style="
      width:30px;height:30px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      background:${color};
      border:3px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,.28);
      display:flex;align-items:center;justify-content:center;
      ${active ? "transform:rotate(-45deg) scale(1.15);" : ""}
    "><span style="
      transform:rotate(45deg);
      color:#fff;font:700 13px/1 ui-sans-serif,system-ui,sans-serif;
    ">${letter}</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -28],
  });
}

/** Sends the map clicks to the parent. */
function ClickHandler({
  onPick,
}: {
  onPick: (point: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(event) {
      onPick({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

/** Keeps the map centred on the point that was just picked. */
function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
}

/** Flies to a position that was requested (the "my location" button). */
function FlyTo({
  center,
  zoom,
}: {
  center: [number, number] | null;
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 0.6 });
  }, [center, zoom, map]);

  return null;
}

/**
 * The map of the transport / tour flow.
 *
 * It is loaded with `ssr: false` (Leaflet needs the browser), so this file
 * only holds the map itself — the surrounding UI lives in the parent.
 */
export default function PickMap({
  pickup,
  dropoff,
  activeField,
  onPick,
  onMove,
  onLocate,
}: {
  pickup: PickedPoint | null;
  dropoff: PickedPoint | null;
  /** Which field the next map click fills — "pickup" or "dropoff". */
  activeField: "pickup" | "dropoff";
  /** A click on the map. */
  onPick: (point: { lat: number; lng: number }) => void;
  /** A marker was dragged to a new place. */
  onMove: (field: "pickup" | "dropoff", point: { lat: number; lng: number }) => void;
  /** The device location was read (the "lokasi saya" button). */
  onLocate?: (point: { lat: number; lng: number }) => void;
}) {
  const center = useMemo<[number, number]>(() => {
    const point = activeField === "pickup" ? pickup : dropoff;
    if (point) return [point.lat, point.lng];
    if (pickup) return [pickup.lat, pickup.lng];
    if (dropoff) return [dropoff.lat, dropoff.lng];
    return DEFAULT_CENTER;
  }, [activeField, pickup, dropoff]);

  const [zoom] = useState(12);
  const [myPosition, setMyPosition] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  /** Read the real position of the device and centre the map on it. */
  const handleLocate = () => {
    if (!("geolocation" in navigator)) {
      setLocateError("Perangkat kamu tidak mendukung lokasi otomatis.");
      return;
    }

    setLocating(true);
    setLocateError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setLocating(false);
        setMyPosition({
          lat,
          lng,
          accuracy: position.coords.accuracy ?? 0,
        });
        setFlyTarget([lat, lng]);
        onLocate?.({ lat, lng });
      },
      () => {
        setLocating(false);
        setLocateError("Tidak bisa membaca lokasi kamu. Pastikan izin lokasi aktif.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={onPick} />
        <Recenter center={center} />
        <FlyTo center={flyTarget} zoom={15} />

        {myPosition ? (
          <>
            <CircleMarker
              center={[myPosition.lat, myPosition.lng]}
              radius={7}
              pathOptions={{
                color: "#ffffff",
                weight: 3,
                fillColor: "#0064d2",
                fillOpacity: 1,
              }}
            />
            {myPosition.accuracy > 0 ? (
              <Circle
                center={[myPosition.lat, myPosition.lng]}
                radius={myPosition.accuracy}
                pathOptions={{
                  color: "#0064d2",
                  weight: 1,
                  fillColor: "#0064d2",
                  fillOpacity: 0.12,
                }}
              />
            ) : null}
          </>
        ) : null}

        {pickup ? (
          <Marker
            position={[pickup.lat, pickup.lng]}
            icon={pinIcon("pickup", activeField === "pickup")}
            draggable
            eventHandlers={{
              dragend(event) {
                const latLng = (event.target as L.Marker).getLatLng();
                onMove("pickup", { lat: latLng.lat, lng: latLng.lng });
              },
            }}
          />
        ) : null}
        {dropoff ? (
          <Marker
            position={[dropoff.lat, dropoff.lng]}
            icon={pinIcon("dropoff", activeField === "dropoff")}
            draggable
            eventHandlers={{
              dragend(event) {
                const latLng = (event.target as L.Marker).getLatLng();
                onMove("dropoff", { lat: latLng.lat, lng: latLng.lng });
              },
            }}
          />
        ) : null}
      </MapContainer>

      {/* "Lokasi saya" — the position button on top of the map. */}
      <button
        type="button"
        onClick={handleLocate}
        disabled={locating}
        title="Gunakan lokasi saya"
        aria-label="Gunakan lokasi saya"
        className="absolute right-3 top-3 z-[1000] flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-ink shadow-sm transition-colors hover:bg-canvas disabled:opacity-60"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="7.6" stroke="currentColor" strokeWidth="1.6" opacity="0.5" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      {locateError ? (
        <p className="absolute bottom-3 left-3 right-3 z-[1000] rounded-lg border border-danger/20 bg-white/95 px-3 py-2 text-[11px] text-danger">
          {locateError}
        </p>
      ) : null}
    </div>
  );
}
