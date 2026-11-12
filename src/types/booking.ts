// Booking domain types.

export type CreateBookingInput = {
  productSlug: string;
  packageId?: string;
  serviceAt: string; // ISO datetime
  adult: number;
  child: number;
  infant: number;
  units?: number; // for per_unit packages (default 1)
  /** The number of rental days (for "per_day" packages). */
  days?: number;
  /** "vendor_pickup" | "delivered" — where the car is handed over. */
  pickupPolicy?: string;
  /** "with_driver" | "without_driver". */
  driverOption?: string;
  /** The free-form note of the customer (the "special request"). */
  notes?: string;
  addOns: { slug: string; qty: number }[];
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phoneCountryCode: string;
    phone: string;
    isGuestSelf: boolean;
    notes?: string;
    /** "mr" | "mrs" | "ms" */
    title?: string;
  };
  flight: {
    airportName?: string;
    location?: string;
    airline?: string;
    flightCode?: string;
    direction?: string;
  };
  /**
   * The passenger names.
   *
   * Optional: the transport flow only asks for the number of passengers, so
   * the names can be omitted — the booking is then stored without travellers.
   */
  travelers?: { fullName: string; kind: string }[];
  /** The pickup point of a transport booking. */
  pickup?: {
    label: string;
    lat: number;
    lng: number;
  };
  /** The dropoff point of a transport booking. */
  dropoff?: {
    label: string;
    lat: number;
    lng: number;
  };
  // Currency snapshot at time of booking
  currencyCode: string;
  fxRate: number;
  /** The promo code the customer entered (optional). */
  promoCode?: string;
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
