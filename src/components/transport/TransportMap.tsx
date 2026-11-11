"use client";

import { useEffect, useMemo, useState } from "react";
import {
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
      onPick({ lat: event.latLng.lat, lng: event.latLng.lng });
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

/**
 * The map of the transport flow.
 *
 * It is loaded with `ssr: false` (Leaflet needs the browser), so this file
 * only holds the map itself — the surrounding UI lives in the parent.
 */
export default function TransportMap({
  pickup,
  dropoff,
  activeField,
  onPick,
}: {
  pickup: PickedPoint | null;
  dropoff: PickedPoint | null;
  /** Which field the next map click fills — "pickup" or "dropoff". */
  activeField: "pickup" | "dropoff";
  onPick: (point: { lat: number; lng: number }) => void;
}) {
  const center = useMemo<[number, number]>(() => {
    const point = activeField === "pickup" ? pickup : dropoff;
    if (point) return [point.lat, point.lng];
    if (pickup) return [pickup.lat, pickup.lng];
    if (dropoff) return [dropoff.lat, dropoff.lng];
    return DEFAULT_CENTER;
  }, [activeField, pickup, dropoff]);

  const [zoom] = useState(12);

  return (
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
      {pickup ? (
        <Marker
          position={[pickup.lat, pickup.lng]}
          icon={pinIcon("pickup", activeField === "pickup")}
        />
      ) : null}
      {dropoff ? (
        <Marker
          position={[dropoff.lat, dropoff.lng]}
          icon={pinIcon("dropoff", activeField === "dropoff")}
        />
      ) : null}
    </MapContainer>
  );
}
