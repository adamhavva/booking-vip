// DTO types for DB-backed catalog data.

export type ProductCardDTO = {
  slug: string;
  title: string;
  subtitle: string;
  priceUsd: number;
  fromUsd?: number;
  unit?: string;
  ribbon?: string;
  tone: string;
  imageUrl?: string | null;
  serviceTypeName?: string;
  placeName?: string;
  rating?: number;
  reviews?: number;
  durationLabel?: string;
};

export type PackageDTO = {
  id: string;
  label: string;
  unitKind: string;
  adultUsd?: number;
  childUsd?: number;
  infantUsd?: number;
  unitUsd?: number;
  durationHours?: number;
  extraHourUsd?: number;
};

export type AddOnDTO = {
  slug: string;
  label: string;
  unitUsd: number;
};

export type ProductDetailDTO = {
  slug: string;
  lineSlug: string;
  title: string;
  typeLabel: string;
  placeLabel: string;
  direction: string;
  leadTimeHours: number;
  leadTimeDays: number;
  description: string;
  included: string[];
  notIncluded: string[];
  requirements: string[];
  packages: PackageDTO[];
  addOns: AddOnDTO[];
  tone: string;
  ribbon?: string;
  fromUsd: number;
};

export type CatalogDTO = {
  serviceTypes: { slug: string; name: string }[];
  places: { id: string; name: string }[];
  priceTiers: { label: string; maxUsd: number }[];
  products: ProductCardDTO[];
  source: "db" | "fallback";
};

export type OptionDTO = {
  value: string;
  label: string;
};
