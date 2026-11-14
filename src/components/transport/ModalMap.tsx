"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PickedPoint } from "@/lib/picked-point";

/** Jakarta — the default view when nothing is picked yet. */
const DEFAULT_CENTER: [number, number] = [-6.2088, 106.8456];

/**
 * A pin drawn with plain HTML — Leaflet's default marker images break when
 * bundled, so the marker is a `divIcon` (no image files needed).
 */
function pinIcon(kind: "pickup" | "dropoff") {
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
    "><span style="
      transform:rotate(45deg);
      color:#fff;font:700 13px/1 ui-sans-serif,system-ui,sans-serif;
    ">${letter}</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
}

/** Sends map clicks to the parent. */
function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

/** Keeps the map centred on the pin as it moves. */
function Follow({ point }: { point: PickedPoint | null }) {
  const map = useMap();
  const lat = point?.lat;
  const lng = point?.lng;

  useEffect(() => {
    // The dialog may still be settling its layout — re-measure the container.
    const frame = requestAnimationFrame(() => map.invalidateSize());
    if (lat != null && lng != null) {
      map.setView([lat, lng], Math.max(map.getZoom(), 14), { animate: true });
    }
    return () => cancelAnimationFrame(frame);
  }, [lat, lng, map]);

  return null;
}

/**
 * The leaflet map inside the location modal — one draggable pin, OSM tiles.
 * Loaded with `ssr: false` by the modal (Leaflet needs the browser).
 */
export default function ModalMap({
  point,
  kind,
  onPick,
  onMove,
}: {
  point: PickedPoint | null;
  kind: "pickup" | "dropoff";
  onPick: (lat: number, lng: number) => void;
  onMove: (lat: number, lng: number) => void;
}) {
  const center = useMemo<[number, number]>(
    () => (point ? [point.lat, point.lng] : DEFAULT_CENTER),
    // The initial centre only — Follow keeps it on the pin afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const icon = useMemo(() => pinIcon(kind), [kind]);

  return (
    <MapContainer center={center} zoom={12} className="h-full w-full" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onPick} />
      <Follow point={point} />
      {point ? (
        <Marker
          position={[point.lat, point.lng]}
          icon={icon}
          draggable
          eventHandlers={{
            dragend(event) {
              const latLng = (event.target as L.Marker).getLatLng();
              onMove(latLng.lat, latLng.lng);
            },
          }}
        />
      ) : null}
    </MapContainer>
  );
}