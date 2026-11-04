// Booking domain types.

export type CreateBookingInput = {
  productSlug: string;
  packageId?: string;
  serviceAt: string; // ISO datetime
  adult: number;
  child: number;
  infant: number;
  units?: number; // for per_unit packages (default 1)
  addOns: { slug: string; qty: number }[];
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phoneCountryCode: string;
    phone: string;
    isGuestSelf: boolean;
    notes?: string;
  };
  flight: {
    airportName?: string;
    location?: string;
    airline?: string;
    flightCode?: string;
    direction?: string;
  };
  travelers: { fullName: string; kind: string }[];
  // Currency snapshot at time of booking
  currencyCode: string;
  fxRate: number;
};

export type CreateBookingResult =
  | { ok: true; code: string }
  | { ok: false; error: string };

export type BookingLookupDTO = {
  code: string;
  status: string;
  serviceAt: string;
  adultCount: number;
  childCount: number;
  infantCount: number;
  subtotalUsd: number;
  addOnsUsd: number;
  totalUsd: number;
  currencyCode: string;
  fxRate: number;
  items: {
    label: string;
    packageLabel?: string;
    unitKind: string;
    adultCount: number;
    childCount: number;
    infantCount: number;
    unitUsd: number;
    totalUsd: number;
  }[];
  addOns: {
    label: string;
    quantity: number;
    unitUsd: number;
    totalUsd: number;
  }[];
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phoneCountryCode: string;
    phone: string;
  };
  travelers: { fullName: string; kind: string }[];
  createdAt: string;
};

export type BookingLookupResult =
  | { found: true; booking: BookingLookupDTO }
  | { found: false; reason: "not_found" | "error" };
