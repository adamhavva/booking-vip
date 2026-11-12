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
