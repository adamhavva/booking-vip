// DTO types for the admin area.
//
// Every amount is an integer number of USD cents, matching the database and
// the rest of the app (see CLAUDE.md — "Prices are integer USD cents").

export type AdminProductRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  lineId: string;
  lineLabel: string;
  serviceTypeId: string | null;
  serviceTypeName: string | null;
  airportId: string | null;
  airportName: string | null;
  direction: string;
  leadTimeHours: number;
  leadTimeDays: number;
  included: string[];
  notIncluded: string[];
  requirements: string[];
  isAddOn: boolean;
  imageUrl: string | null;
  tone: string;
  ribbon: string | null;
  rating: number | null;
  reviews: number | null;
  durationLabel: string | null;
  fromPriceUsdCents: number | null;
  active: boolean;
  packageCount: number;
};

export type AdminPackageRow = {
  id: string;
  productId: string;
  productTitle: string;
  label: string;
  unitKind: string;
  adultUsdCents: number | null;
  childUsdCents: number | null;
  infantUsdCents: number | null;
  unitUsdCents: number | null;
  durationHours: number | null;
  extraHourUsdCents: number | null;
  sortOrder: number;
  active: boolean;
};

export type AdminServiceTypeRow = {
  id: string;
  lineId: string;
  lineLabel: string;
  slug: string;
  name: string;
  sortOrder: number;
  active: boolean;
  productCount: number;
};

export type AdminPriceTierRow = {
  id: string;
  lineId: string | null;
  lineLabel: string | null;
  label: string;
  maxUsdCents: number;
  sortOrder: number;
  active: boolean;
};

export type AdminPlaceRow = {
  id: string;
  kind: string;
  iataCode: string | null;
  name: string;
  city: string;
  country: string;
  imageUrl: string | null;
  active: boolean;
  /** The parent place (null for a root of the hierarchy). */
  parentId: string | null;
  /** The name of the parent place, for display. */
  parentName: string | null;
  /** Sort order inside the parent group. */
  sortOrder: number;
  productCount: number;
};

export type AdminServiceLineRow = {
  id: string;
  slug: string;
  label: string;
  short: string;
  badge: string | null;
  tone: string;
  imageUrl: string | null;
  sortOrder: number;
  active: boolean;
  productCount: number;
};

export type AdminAmenityRow = {
  id: string;
  label: string;
  productCount: number;
};

export type AdminPromoCodeRow = {
  id: string;
  code: string;
  title: string;
  /** "fixed" | "percentage". */
  type: string;
  /** Fixed → USD cents. Percentage → 0-100. */
  value: number;
  minTotalUsdCents: number;
  usageLimit: number | null;
  usedCount: number;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
};

export type AdminStats = {
  products: number;
  activeProducts: number;
  packages: number;
  serviceTypes: number;
  priceTiers: number;
  places: number;
  serviceLines: number;
  amenities: number;
  productAmenities: number;
  productAddOns: number;
};

export type AdminOption = {
  value: string;
  label: string;
};

export type AdminReferenceData = {
  lines: AdminOption[];
  serviceTypes: AdminOption[];
  places: AdminOption[];
  products: AdminOption[];
  amenities: AdminOption[];
  addOns: AdminOption[];
};
