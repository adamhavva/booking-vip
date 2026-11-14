/**
 * Address lookup — OpenStreetMap Nominatim.
 *
 * The service is free and needs no key, which is enough for the address field
 * of the transport and tour flows.
 */

export type GeocodeResult = {
  lat: number;
  lng: number;
  label: string;
};

/**
 * Look an address up with Nominatim.
 *
 * Returns the five best matches; an empty array when nothing was found.
 */
export async function searchAddress(query: string): Promise<GeocodeResult[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");
  url.searchParams.set("q", query);

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Pencarian alamat gagal");

  const data = (await response.json()) as {
    lat: string;
    lon: string;
    display_name: string;
  }[];

  return data.map((item) => ({
    lat: Number(item.lat),
    lng: Number(item.lon),
    label: item.display_name,
  }));
}

/**
 * Turn a coordinate into an address with Nominatim.
 *
 * Returns null when the service is unreachable or has no answer — the caller
 * then falls back to the coordinate label, so a pin always has a name.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("zoom", "16");

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;

    const data = (await response.json()) as { display_name?: string };
    return typeof data.display_name === "string" && data.display_name.trim()
      ? data.display_name
      : null;
  } catch {
    return null;
  }
}

/** The coordinate fallback label — "−6.20880, 106.84560". */
export function coordsLabel(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}
