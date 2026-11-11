import { db } from "@/prisma/db";

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
};

export type AirlineOption = {
  code: string;
  name: string;
};

export type AirportServiceOption = {
  slug: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  direction: string | null;
  packageId: string;
  packageLabel: string;
  unitKind: string;
  adultUsdCents: number;
  childUsdCents: number;
};

/** The airports that can be picked in the first step. */
export async function listWizardAirports(): Promise<AirportOption[]> {
  try {
    const rows = await db.orm.public.Airport
      .select("id", "name", "city", "iataCode")
      .where((f) => f.active.eq(true))
      .where((f) => f.kind.eq("airport"))
      .orderBy((f) => f.city.asc())
      .all();

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      city: row.city,
      iataCode: row.iataCode ?? null,
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

    const products = await db.orm.public.Product
      .select("id", "slug", "title", "description", "imageUrl", "direction")
      .where((f) => f.lineId.eq(line.id))
      .where((f) => f.active.eq(true))
      .where((f) => f.isAddOn.eq(false))
      .orderBy((f) => f.title.asc())
      .all();

    const services: AirportServiceOption[] = [];

    for (const product of products) {
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
          description: product.description ?? null,
          imageUrl: product.imageUrl ?? null,
          direction: product.direction ?? null,
          packageId: pkg.id,
          packageLabel: pkg.label,
          unitKind: pkg.unitKind,
          adultUsdCents: pkg.adultUsdCents ?? 0,
          childUsdCents: pkg.childUsdCents ?? pkg.adultUsdCents ?? 0,
        });
      }
    }

    return services;
  } catch (error) {
    console.error("[airport-vip] could not load services", error);
    return [];
  }
}
