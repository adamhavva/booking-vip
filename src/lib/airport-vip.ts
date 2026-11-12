import { db } from "@/prisma/db";
import {
  BOOKING_RULES_KEY,
  DEFAULT_BOOKING_RULES,
  SERVICE_INFO_KEY,
  parseBookingRules,
  parseServiceInfo,
  type BookingRules,
  type ServiceInfoMap,
} from "@/lib/bookingRules";

/**
 * The data of the airport VIP wizard.
 *
 * Everything comes from the database:
 *   - the airports (`Airport`),
 *   - the airlines (`Airline`),
 *   - the services of the `vip-service` line (`Product` + `ProductPackage`).
 */

export type AirportOption = {
  id: string;
  name: string;
  city: string;
  iataCode: string | null;
  country: string;
};

export type CountryOption = {
  name: string;
  /** How many airports this country offers — shown under the name. */
  airportCount: number;
};

export type AirlineOption = {
  code: string;
  name: string;
};

export type ServiceAddOnOption = {
  slug: string;
  title: string;
  unitUsdCents: number;
};

export type AirportServiceOption = {
  slug: string;
  title: string;
  /** The airport this service belongs to — the service list is filtered by it. */
  airportId: string | null;
  /** The service type, shown as the group heading ("Meet & Greet", "Lounge"). */
  categoryName: string;
  description: string | null;
  imageUrl: string | null;
  direction: string | null;
  packageId: string;
  packageLabel: string;
  unitKind: string;
  adultUsdCents: number;
  childUsdCents: number;
  /** What the greeter does, step by step — the numbered service description. */
  included: string[];
  notIncluded: string[];
  requirements: string[];
  leadTimeHours: number;
  leadTimeDays: number;
  /** The add-ons this service offers, from the `ProductAddOn` join. */
  addOns: ServiceAddOnOption[];
};

/**
 * The countries that can be picked in the first step.
 *
 * Only countries that actually have an active airport appear, so the list can
 * never offer a country the customer cannot continue from. The grouping runs
 * in JS — the other readers in this file avoid aggregate queries too.
 */
export async function listWizardCountries(): Promise<CountryOption[]> {
  try {
    const rows = await db.orm.public.Airport
      .select("country")
      .where((f) => f.active.eq(true))
      .where((f) => f.kind.eq("airport"))
      .all();

    const counts = new Map<string, number>();
    for (const row of rows) {
      const name = row.country?.trim();
      if (!name) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([name, airportCount]) => ({ name, airportCount }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("[airport-vip] could not load countries", error);
    return [];
  }
}

/** The airports that can be picked, after the country. */
export async function listWizardAirports(): Promise<AirportOption[]> {
  try {
    const rows = await db.orm.public.Airport
      .select("id", "name", "city", "iataCode", "country")
      .where((f) => f.active.eq(true))
      .where((f) => f.kind.eq("airport"))
      .orderBy((f) => f.city.asc())
      .all();

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      city: row.city,
      iataCode: row.iataCode ?? null,
      country: row.country,
    }));
  } catch (error) {
    console.error("[airport-vip] could not load airports", error);
    return [];
  }
}

/** The airlines that can be picked in the flight step. */
export async function listWizardAirlines(): Promise<AirlineOption[]> {
  try {
    const rows = await db.orm.public.Airline
      .select("code", "name")
      .where((f) => f.active.eq(true))
      .orderBy((f) => f.name.asc())
      .all();

    return rows.map((row) => ({ code: row.code, name: row.name }));
  } catch (error) {
    console.error("[airport-vip] could not load airlines", error);
    return [];
  }
}

/** The services of the airport VIP line, with their packages. */
export async function listWizardServices(): Promise<AirportServiceOption[]> {
  try {
    const lines = await db.orm.public.ServiceLine
      .select("id")
      .where((f) => f.slug.eq("vip-service"))
      .where((f) => f.active.eq(true))
      .limit(1)
      .all();

    const line = lines[0];
    if (!line) return [];

    const serviceTypes = await db.orm.public.ServiceType
      .select("id", "name")
      .where((f) => f.lineId.eq(line.id))
      .all();
    const typeNames = new Map(serviceTypes.map((t) => [t.id, t.name]));

    const products = await db.orm.public.Product
      .select(
        "id",
        "slug",
        "title",
        "description",
        "imageUrl",
        "direction",
        "airportId",
        "serviceTypeId",
        "included",
        "notIncluded",
        "requirements",
        "leadTimeHours",
        "leadTimeDays",
      )
      .where((f) => f.lineId.eq(line.id))
      .where((f) => f.active.eq(true))
      .where((f) => f.isAddOn.eq(false))
      .orderBy((f) => f.title.asc())
      .all();

    const services: AirportServiceOption[] = [];

    for (const product of products) {
      const addOns = await listServiceAddOns(product.id);

      const packages = await db.orm.public.ProductPackage
        .select("id", "label", "unitKind", "adultUsdCents", "childUsdCents")
        .where((f) => f.productId.eq(product.id))
        .where((f) => f.active.eq(true))
        .orderBy((f) => f.sortOrder.asc())
        .all();

      for (const pkg of packages) {
        services.push({
          slug: product.slug,
          title: product.title,
          airportId: product.airportId ?? null,
          categoryName: typeNames.get(product.serviceTypeId ?? "") ?? "Lainnya",
          description: product.description ?? null,
          imageUrl: product.imageUrl ?? null,
          direction: product.direction ?? null,
          packageId: pkg.id,
          packageLabel: pkg.label,
          unitKind: pkg.unitKind,
          adultUsdCents: pkg.adultUsdCents ?? 0,
          childUsdCents: pkg.childUsdCents ?? pkg.adultUsdCents ?? 0,
          included: (product.included as string[]) ?? [],
          notIncluded: (product.notIncluded as string[]) ?? [],
          requirements: (product.requirements as string[]) ?? [],
          leadTimeHours: product.leadTimeHours,
          leadTimeDays: product.leadTimeDays,
          addOns,
        });
      }
    }

    return services;
  } catch (error) {
    console.error("[airport-vip] could not load services", error);
    return [];
  }
}

/**
 * The add-ons one service offers.
 *
 * The edges live in `ProductAddOn`; the price of an add-on is the
 * `fromPriceUsdCents` of the add-on product itself, which is what
 * `createBooking` charges for it.
 */
async function listServiceAddOns(productId: string): Promise<ServiceAddOnOption[]> {
  const edges = await db.orm.public.ProductAddOn
    .select("addOnId")
    .where((f) => f.productId.eq(productId))
    .orderBy((f) => f.sortOrder.asc())
    .all();

  if (edges.length === 0) return [];

  const rows = await db.orm.public.Product
    .select("id", "slug", "title", "fromPriceUsdCents")
    .where((f) => f.id.in(edges.map((e) => e.addOnId)))
    .where((f) => f.active.eq(true))
    .all();

  // Keep the order of the join rows — that is the order the operator chose.
  const byId = new Map(rows.map((row) => [row.id, row]));

  return edges.flatMap((edge) => {
    const row = byId.get(edge.addOnId);
    if (!row) return [];
    return [{
      slug: row.slug,
      title: row.title,
      unitUsdCents: row.fromPriceUsdCents ?? 0,
    }];
  });
}

/**
 * The booking rules, or the defaults when the database is unreachable.
 *
 * The reads live here rather than in `bookingRules.ts` because the wizard is
 * a client component and imports that module for its pure helpers — pulling
 * `db` into it would drag the server bundle into the browser.
 */
export async function getBookingRules(): Promise<BookingRules> {
  try {
    const row = await db.orm.public.Setting
      .select("value")
      .where({ key: BOOKING_RULES_KEY })
      .first();

    return parseBookingRules(row?.value);
  } catch (error) {
    console.error("[airport-vip] could not load the booking rules", error);
    return DEFAULT_BOOKING_RULES;
  }
}

/** The service steps and notes of every airport, keyed by IATA code. */
export async function getServiceInfo(): Promise<ServiceInfoMap> {
  try {
    const row = await db.orm.public.Setting
      .select("value")
      .where({ key: SERVICE_INFO_KEY })
      .first();

    const value = row?.value;
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};

    const map: ServiceInfoMap = {};
    for (const [code, entry] of Object.entries(value as Record<string, unknown>)) {
      const parsed = parseServiceInfo(entry);
      if (parsed) map[code] = parsed;
    }
    return map;
  } catch (error) {
    console.error("[airport-vip] could not load the service info", error);
    return {};
  }
}
