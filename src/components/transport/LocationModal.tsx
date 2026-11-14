"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { LocateFixed, MapPin, X } from "lucide-react";
import PlaceSelect from "@/components/ui/PlaceSelect";
import { useLocale } from "@/components/providers/LocaleProvider";
import { coordsLabel, reverseGeocode, searchAddress } from "@/lib/geocode";
import type { PickedPoint } from "@/lib/picked-point";
import type { PlaceNode } from "@/lib/places";

/**
 * The pickup / dropoff map modal.
 *
 * Clicking a place field opens this top-layer `<dialog>`: the customer can
 * pick a city from the hierarchy, click the map, drag the pin or use the
 * device location. The chosen point is reverse-geocoded (Nominatim) with a
 * coordinate-label fallback, and "Gunakan lokasi" writes it into the field.
 */
const ModalMap = dynamic(() => import("./ModalMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-canvas text-[13px] text-muted">
      Memuat peta…
    </div>
  ),
});

export type LocationModalProps = {
  /** The field being edited — null keeps the modal closed. */
  field: "pickup" | "dropoff" | null;
  /** The point the field already holds. */
  point: PickedPoint | null;
  /** The place hierarchy for the city dropdown. */
  places: PlaceNode[];
  onClose: () => void;
  onConfirm: (field: "pickup" | "dropoff", point: PickedPoint) => void;
};

export default function LocationModal({
  field,
  point,
  places,
  onClose,
  onConfirm,
}: LocationModalProps) {
  const { t } = useLocale();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [draft, setDraft] = useState<PickedPoint | null>(null);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Guards against a slow reverse-geocode overwriting a newer pin. */
  const geocodeSeq = useRef(0);

  const open = field !== null;
  /** The map mounts only once the dialog is visible — Leaflet needs a sized container. */
  const [mapReady, setMapReady] = useState(false);

  // Open / close the native dialog — showModal puts it in the top layer.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      setMapReady(true);
    } else if (!open && dialog.open) {
      dialog.close();
      setMapReady(false);
    }
  }, [open]);

  // Seed the draft from the field each time the modal opens.
  useEffect(() => {
    if (open) {
      setDraft(point);
      setError(null);
      setGeocoding(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, field]);

  /** Move the pin and resolve its address (coordinate label until then). */
  const placePin = useCallback((lat: number, lng: number) => {
    const seq = ++geocodeSeq.current;
    setDraft({ lat, lng, label: coordsLabel(lat, lng) });
    setGeocoding(true);
    void reverseGeocode(lat, lng).then((label) => {
      if (seq !== geocodeSeq.current) return;
      setGeocoding(false);
      if (label) {
        setDraft((current) =>
          current && current.lat === lat && current.lng === lng
            ? { ...current, label }
            : current,
        );
      }
    });
  }, []);

  /** Pick a city / area from the hierarchy — geocode it onto the map. */
  const choosePlace = async (label: string) => {
    setError(null);
    setGeocoding(true);
    try {
      const found = await searchAddress(label);
      if (found.length === 0) {
        setError(t("transport.map.notFound"));
        return;
      }
      const first = found[0]!;
      const seq = ++geocodeSeq.current;
      setDraft({ lat: first.lat, lng: first.lng, label: first.label });
      // Keep the short place label the customer picked, not the full address.
      if (seq === geocodeSeq.current) setGeocoding(false);
    } catch {
      setError(t("transport.map.searchUnavailable"));
    } finally {
      setGeocoding(false);
    }
  };

  /** The device location — the pin jumps to it and the address resolves. */
  const useMyLocation = () => {
    if (!("geolocation" in navigator)) {
      setError(t("transport.map.geoUnsupported"));
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        placePin(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setLocating(false);
        setError(t("transport.map.geoDenied"));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const confirm = () => {
    if (!field || !draft) return;
    onConfirm(field, draft);
    onClose();
  };

  const title =
    field === "dropoff"
      ? t("transport.map.titleDropoff")
      : t("transport.map.titlePickup");

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // A click on the backdrop (the dialog element itself) closes.
        if (e.target === dialogRef.current) onClose();
      }}
      className="fixed inset-0 m-auto h-fit max-h-[calc(100dvh-2rem)] w-[min(880px,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-line bg-white p-0 shadow-2xl backdrop:bg-ink/40 backdrop:backdrop-blur-[2px]"
      aria-label={title}
    >
      <div className="p-5 md:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[17px] font-bold tracking-[-0.01em] text-ink">
              {title}
            </h2>
            <p className="mt-0.5 text-[12px] text-muted">
              {t("transport.map.subtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("transport.map.close")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-muted transition-colors hover:bg-canvas hover:text-ink"
          >
            <X width={16} height={16} />
          </button>
        </div>

        {/* The city dropdown stays available next to the map. */}
        <div className="mt-4">
          <PlaceSelect
            label={t("transport.map.cityLabel")}
            places={places}
            value=""
            selectableKinds={["city", "area", "district", "village", "destination"]}
            placeholder={t("transport.map.cityPlaceholder")}
            onSelect={(label) => void choosePlace(label)}
          />
        </div>

        {/* The map */}
        <div className="relative mt-4 h-[320px] overflow-hidden rounded-xl border border-line bg-canvas md:h-[400px]">
          {mapReady ? (
            <ModalMap
              point={draft}
              kind={field === "dropoff" ? "dropoff" : "pickup"}
              onPick={(lat, lng) => placePin(lat, lng)}
              onMove={(lat, lng) => placePin(lat, lng)}
            />
          ) : null}
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="absolute right-3 top-3 z-[1000] inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-3 text-[12px] font-semibold text-ink shadow-sm transition-colors hover:bg-canvas disabled:opacity-60"
          >
            <LocateFixed width={16} height={16} className="text-brand" />
            {locating ? t("transport.map.locating") : t("transport.map.useMyLocation")}
          </button>
        </div>

        {/* The resolved address */}
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-canvas px-3 py-2.5">
          <MapPin width={16} height={16} className="mt-0.5 shrink-0 text-brand" />
          <p className="min-w-0 flex-1 text-[12px] leading-relaxed text-ink">
            {draft ? draft.label : t("transport.map.noPoint")}
            {geocoding ? (
              <span className="ml-2 text-muted">{t("transport.map.resolving")}</span>
            ) : null}
          </p>
        </div>

        {error ? <p className="mt-2 text-[12px] text-danger">{error}</p> : null}

        {/* Footer */}
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-line bg-white px-5 text-[13px] font-semibold text-ink transition-colors hover:bg-canvas"
          >
            {t("transport.map.cancel")}
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={!draft}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-brand px-6 text-[13px] font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
          >
            {t("transport.map.confirm")}
          </button>
        </div>
      </div>
    </dialog>
  );
}