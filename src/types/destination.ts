/**
 * A tourist destination of the static fallback content.
 *
 * The optional hierarchy fields mirror the place tree (region → country →
 * province → city → district → village) so a static destination can carry
 * the same geographic context as a database place. They are optional —
 * existing records keep working unchanged.
 */
export type Destination = {
  name: string;
  country: string;
  tone: string;
  /** e.g. "Asia Tenggara". */
  region?: string;
  /** e.g. "Bali", "DI Yogyakarta". */
  province?: string;
  /** The kota / kabupaten the destination belongs to. */
  city?: string;
  /** The kecamatan, when known. */
  district?: string;
  /** The desa / kelurahan, when known. */
  village?: string;
};