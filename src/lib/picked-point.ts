import type { PickedPoint } from "@/components/map/PickMap";

export type { PickedPoint };

/**
 * Parse one of the points that the map step handed over through the URL.
 *
 * The value is a JSON string like `{"lat":…,"lng":…,"label":"…"}` — invalid
 * or incomplete values return null so the page can send the customer back to
 * the map.
 */
export function parsePickedPoint(raw: string | undefined): PickedPoint | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PickedPoint>;
    if (
      typeof parsed.lat !== "number" ||
      typeof parsed.lng !== "number" ||
      typeof parsed.label !== "string"
    ) {
      return null;
    }
    return { lat: parsed.lat, lng: parsed.lng, label: parsed.label };
  } catch {
    return null;
  }
}

/** Serialize a point for the query string. */
export function stringifyPickedPoint(point: PickedPoint): string {
  return JSON.stringify({ lat: point.lat, lng: point.lng, label: point.label });
}
