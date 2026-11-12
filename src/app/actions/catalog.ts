"use server";

import { db } from "@/prisma/db";
import {
  buildPlaceTree,
  filterPlaceTree,
  type PlaceKind,
  type PlaceNode,
} from "@/lib/places";
import type {
  CatalogDTO,
  OptionDTO,
  ProductCardDTO,
  ProductDetailDTO,
} from "@/types";

/** Map a service line slug to the DB ServiceLine record. */
async function getLineBySlug(lineSlug: string) {
  const lines = await db.orm.public.ServiceLine
    .select("id", "slug", "label", "tone")
    .where((f) => f.slug.eq(lineSlug))
    .where((f) => f.active.eq(true))
    .limit(1)
    .all();
  return lines[0] ?? null;
}

/** Get line by ID */
async function getLineById(lineId: string) {
  const lines = await db.orm.public.ServiceLine
    .select("id", "slug")
    .where((f) => f.id.eq(lineId))
    .limit(1)
    .all();
  return lines[0] ?? null;
}

/**
 * Convert cents to USD dollars (number).
 */
function centsToUsd(cents: number | null | undefined): number | undefined {
  if (cents == null) return undefined;
  return cents / 100;
}

/**
 * Fetch the full catalog for a service line: service types, places (airports),
 * price tiers, and products with joined names.
 *
 * Returns null on any error so the client can fall back to static data.
 */
export async function getCatalog(lineSlug: string): Promise<CatalogDTO | null> {
  try {
    const line = await getLineBySlug(lineSlug);
    if (!line) return null;

    // Fetch service types for this line (active, sorted)
    const serviceTypes = await db.orm.public.ServiceType
      .select("slug", "name")
      .where((f) => f.lineId.eq(line.id))
      .where((f) => f.active.eq(true))
      .orderBy((f) => f.sortOrder.asc())
      .all();

    // Fetch all products for this line (active, non-addon)
    const products = await db.orm.public.Product
      .select(
        "slug",
        "title",
        "description",
        "tone",
        "ribbon",
        "rating",
        "reviews",
        "durationLabel",
        "fromPriceUsdCents",
        "serviceTypeId",
        "airportId",
        "imageUrl"
      )
      .where((f) => f.lineId.eq(line.id))
      .where((f) => f.active.eq(true))
      .where((f) => f.isAddOn.eq(false))
      .all();

    // Collect unique service type IDs and airport IDs
    const serviceTypeIds = [...new Set(products.map((p) => p.serviceTypeId).filter((x): x is string => x != null))];
    const airportIds = [...new Set(products.map((p) => p.airportId).filter((x): x is string => x != null))];

    // Fetch service type names
    const serviceTypeMap = new Map<string, string>();
    if (serviceTypeIds.length > 0) {
      const types = await db.orm.public.ServiceType
        .select("id", "name")
        .where((f) => f.id.in(serviceTypeIds))
        .all();
      for (const t of types) serviceTypeMap.set(t.id, t.name);
    }

    // Fetch airport/city names
    const placeMap = new Map<string, string>();
    if (airportIds.length > 0) {
      const airports = await db.orm.public.Airport
        .select("id", "name", "city")
        .where((f) => f.id.in(airportIds))
        .all();
      for (const a of airports) placeMap.set(a.id, a.city || a.name);
    }

    // Fetch price tiers for this line
    const priceTiers = await db.orm.public.PriceTier
      .select("label", "maxUsdCents")
      .where((f) => f.lineId.eq(line.id))
      .where((f) => f.active.eq(true))
      .orderBy((f) => f.sortOrder.asc())
      .all();

    // Map products to DTOs
    const productDTOs: ProductCardDTO[] = products.map((p) => ({
      slug: p.slug,
      title: p.title,
      subtitle: p.description,
      priceUsd: centsToUsd(p.fromPriceUsdCents) ?? 0,
      fromUsd: centsToUsd(p.fromPriceUsdCents),
      ribbon: p.ribbon ?? undefined,
      tone: p.tone,
      imageUrl: p.imageUrl ?? null,
      serviceTypeName: p.serviceTypeId ? serviceTypeMap.get(p.serviceTypeId) : undefined,
      placeName: p.airportId ? placeMap.get(p.airportId) : undefined,
      rating: p.rating ?? undefined,
      reviews: p.reviews ?? undefined,
      durationLabel: p.durationLabel ?? undefined,
    }));

    // Collect unique places (airports referenced by products)
    const places = Array.from(placeMap.entries()).map(([id, name]) => ({ id, name }));

    return {
      serviceTypes: serviceTypes.map((t) => ({ slug: t.slug, name: t.name })),
      places,
      priceTiers: priceTiers.map((t) => ({
        label: t.label,
        maxUsd: centsToUsd(t.maxUsdCents) ?? 0,
      })),
      products: productDTOs,
      source: "db",
    };
  } catch (error) {
    console.error("[catalog] could not load catalog", error);
    return null;
  }
}

/**
 * Fetch full product details by slug.
 * Returns null on any error.
 */
export async function getProduct(slug: string): Promise<ProductDetailDTO | null> {
  try {
    const products = await db.orm.public.Product
      .select(
        "id",
        "slug",
        "lineId",
        "title",
        "description",
        "tone",
        "ribbon",
        "direction",
        "leadTimeHours",
        "leadTimeDays",
        "included",
        "notIncluded",
        "requirements",
        "fromPriceUsdCents",
        "serviceTypeId",
        "airportId",
        "isAddOn"
      )
      .where((f) => f.slug.eq(slug))
      .where((f) => f.active.eq(true))
      .where((f) => f.isAddOn.eq(false))
      .limit(1)
      .all();

    const product = products[0];
    if (!product) return null;

    // Get the line slug
    const line = await getLineById(product.lineId);
    if (!line) return null;

    // Get service type name
    let typeLabel = "";
    const serviceTypeId = product.serviceTypeId;
    if (serviceTypeId != null) {
      const types = await db.orm.public.ServiceType
        .select("name")
        .where((f) => f.id.eq(serviceTypeId))
        .limit(1)
        .all();
      typeLabel = types[0]?.name ?? "";
    }

    // Get place name
    let placeLabel = "";
    const airportId = product.airportId;
    if (airportId != null) {
      const airports = await db.orm.public.Airport
        .select("name", "city")
        .where((f) => f.id.eq(airportId))
        .limit(1)
        .all();
      placeLabel = airports[0]?.city ?? airports[0]?.name ?? "";
    }

    // Get packages (active, sorted)
    const packages = await db.orm.public.ProductPackage
      .select(
        "id",
        "label",
        "unitKind",
        "adultUsdCents",
        "childUsdCents",
        "infantUsdCents",
        "unitUsdCents",
        "durationHours",
        "extraHourUsdCents"
      )
      .where((f) => f.productId.eq(product.id))
      .where((f) => f.active.eq(true))
      .orderBy((f) => f.sortOrder.asc())
      .all();

    // Get add-ons via ProductAddOn join
    const addOnJoins = await db.orm.public.ProductAddOn
      .select("addOnId")
      .where((f) => f.productId.eq(product.id))
      .orderBy((f) => f.sortOrder.asc())
      .all();

    const addOnIds = addOnJoins.map((j) => j.addOnId);
    let addOns: ProductDetailDTO["addOns"] = [];
    if (addOnIds.length > 0) {
      const addOnProducts = await db.orm.public.Product
        .select("slug", "title", "fromPriceUsdCents")
        .where((f) => f.id.in(addOnIds))
        .where((f) => f.active.eq(true))
        .all();
      addOns = addOnProducts.map((p) => ({
        slug: p.slug,
        label: p.title,
        unitUsd: centsToUsd(p.fromPriceUsdCents) ?? 0,
      }));
    }

    return {
      slug: product.slug,
      lineSlug: line.slug,
      title: product.title,
      typeLabel,
      placeLabel,
      direction: product.direction,
      leadTimeHours: product.leadTimeHours,
      leadTimeDays: product.leadTimeDays,
      description: product.description,
      included: (product.included as string[]) ?? [],
      notIncluded: (product.notIncluded as string[]) ?? [],
      requirements: (product.requirements as string[]) ?? [],
      packages: packages.map((p) => ({
        id: p.id,
        label: p.label,
        unitKind: p.unitKind,
        adultUsd: centsToUsd(p.adultUsdCents),
        childUsd: centsToUsd(p.childUsdCents),
        infantUsd: centsToUsd(p.infantUsdCents),
        unitUsd: centsToUsd(p.unitUsdCents),
        durationHours: p.durationHours ?? undefined,
        extraHourUsd: centsToUsd(p.extraHourUsdCents),
      })),
      addOns,
      tone: product.tone,
      ribbon: product.ribbon ?? undefined,
      fromUsd: centsToUsd(product.fromPriceUsdCents) ?? 0,
    };
  } catch (error) {
    console.error("[catalog] could not load product", error);
    return null;
  }
}

/**
 * Fetch options for select fields (airports, cities, service types, countries, airlines).
 * Returns an empty array on error.
 * For serviceType, optionally scope by lineSlug.
 */
export async function getOptions(
  kind: "airport" | "city" | "area" | "destination" | "serviceType" | "airline" | "country",
  lineSlug?: string
): Promise<OptionDTO[]> {
  try {
    if (kind === "airport") {
      const rows = await db.orm.public.Airport
        .select("iataCode", "name")
        .where((f) => f.active.eq(true))
        .where((f) => f.kind.eq("airport"))
        .orderBy((f) => f.name.asc())
        .all();
      return rows.map((r) => ({
        value: r.iataCode ?? r.name,
        label: r.name + (r.iataCode ? ` (${r.iataCode})` : ""),
      }));
    }

    if (kind === "city") {
      const rows = await db.orm.public.Airport
        .select("city")
        .where((f) => f.active.eq(true))
        .where((f) => f.kind.eq("city"))
        .orderBy((f) => f.city.asc())
        .all();
      return rows.map((r) => ({ value: r.city, label: r.city }));
    }

    if (kind === "area" || kind === "destination") {
      const rows = await db.orm.public.Airport
        .select("name", "city")
        .where((f) => f.active.eq(true))
        .where((f) => f.kind.eq(kind))
        .orderBy((f) => f.name.asc())
        .all();
      return rows.map((r) => ({ value: r.name, label: `${r.name} (${r.city})` }));
    }

    if (kind === "serviceType") {
      // If lineSlug is provided, scope service types to that line
      if (lineSlug) {
        const line = await getLineBySlug(lineSlug);
        if (line) {
          const rows = await db.orm.public.ServiceType
            .select("slug", "name")
            .where((f) => f.lineId.eq(line.id))
            .where((f) => f.active.eq(true))
            .orderBy((f) => f.name.asc())
            .all();
          return rows.map((r) => ({ value: r.slug, label: r.name }));
        }
      }
      // Fallback: return all active service types
      const rows = await db.orm.public.ServiceType
        .select("slug", "name")
        .where((f) => f.active.eq(true))
        .orderBy((f) => f.name.asc())
        .all();
      return rows.map((r) => ({ value: r.slug, label: r.name }));
    }

    if (kind === "country") {
      const rows = await db.orm.public.Country
        .select("code", "name")
        .where((f) => f.active.eq(true))
        .orderBy((f) => f.name.asc())
        .all();
      return rows.map((r) => ({ value: r.code, label: r.name }));
    }

    if (kind === "airline") {
      const rows = await db.orm.public.Airline
        .select("code", "name")
        .where((f) => f.active.eq(true))
        .orderBy((f) => f.name.asc())
        .all();
      return rows.map((r) => ({ value: r.code, label: r.name }));
    }

    return [];
  } catch (error) {
    console.error("[catalog] could not load options", error);
    return [];
  }
}

/**
 * The place hierarchy, grouped by parent.
 *
 * Returns the tree of active places pruned to the requested kind: the
 * airports grouped under their city, the cities grouped under their parent
 * (if any). A place without a parent is returned as a root.
 */
export async function getPlaceOptions(
  kind: PlaceKind | PlaceKind[],
): Promise<PlaceNode[]> {
  try {
    const rows = await db.orm.public.Airport
      .select("id", "kind", "iataCode", "name", "city", "country", "parentId", "sortOrder")
      .where((f) => f.active.eq(true))
      .orderBy((f) => f.sortOrder.asc())
      .all();

    const tree = buildPlaceTree(rows);

    return filterPlaceTree(tree, kind);
  } catch (error) {
    console.error("[catalog] could not load places", error);
    return [];
  }
}

/**
 * The vehicles of the transport line.
 *
 * Every active product of the `transport` service line with its active
 * packages — the customer picks the vehicle on the transport booking form.
 */
export type TransportVehicleDTO = {
  productSlug: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  tone: string | null;
  packageId: string;
  packageLabel: string;
  unitKind: string;
  /** The price of one unit in USD cents. */
  unitUsdCents: number;
  /** The slug of the parent type ("sedan", "hourly-hire", …). */
  parentSlug: string | null;
  /** The name of the parent type ("Sedan", "Hourly Hire", …). */
  parentName: string | null;
};

/**
 * A parent type with the products (children) below it.
 *
 * The transport line is grouped the same way the airport line is: the parent
 * is the vehicle class, the children are the concrete products.
 */
export type TransportVehicleGroupDTO = {
  parentSlug: string;
  parentName: string;
  children: TransportVehicleDTO[];
};

export async function getTransportVehicles(): Promise<TransportVehicleDTO[]> {
  try {
    const line = await getLineBySlug("transport");
    if (!line) return [];

    const products = await db.orm.public.Product
      .select("id", "slug", "title", "description", "imageUrl", "tone", "serviceTypeId")
      .where((f) => f.lineId.eq(line.id))
      .where((f) => f.active.eq(true))
      .where((f) => f.isAddOn.eq(false))
      .orderBy((f) => f.title.asc())
      .all();

    const typeMap = await getServiceTypeNames(
      products.map((p) => p.serviceTypeId),
    );

    const vehicles: TransportVehicleDTO[] = [];

    for (const product of products) {
      const packages = await db.orm.public.ProductPackage
        .select("id", "label", "unitKind", "unitUsdCents", "adultUsdCents")
        .where((f) => f.productId.eq(product.id))
        .where((f) => f.active.eq(true))
        .orderBy((f) => f.sortOrder.asc())
        .all();

      const parent = product.serviceTypeId
        ? typeMap.get(product.serviceTypeId)
        : undefined;

      for (const pkg of packages) {
        vehicles.push({
          productSlug: product.slug,
          title: product.title,
          description: product.description ?? null,
          imageUrl: product.imageUrl ?? null,
          tone: product.tone ?? null,
          packageId: pkg.id,
          packageLabel: pkg.label,
          unitKind: pkg.unitKind,
          unitUsdCents: pkg.unitUsdCents ?? pkg.adultUsdCents ?? 0,
          parentSlug: parent?.slug ?? null,
          parentName: parent?.name ?? null,
        });
      }
    }

    return vehicles;
  } catch (error) {
    console.error("[catalog] could not load transport vehicles", error);
    return [];
  }
}

/**
 * The transport vehicles, grouped by their parent type.
 *
 * A product without a parent type ends up in a "Lainnya" group, so nothing
 * is ever hidden from the customer.
 */
export async function getTransportVehicleGroups(): Promise<
  TransportVehicleGroupDTO[]
> {
  const vehicles = await getTransportVehicles();
  return groupByParent(vehicles, "Lainnya");
}

/**
 * Look up the parent type of a product.
 *
 * The products point at their parent through `serviceTypeId`. This helper
 * resolves a list of ids into the slug / name of the parent, so the client
 * can group the products the way the airport line does.
 */
async function getServiceTypeNames(
  ids: (string | null)[],
): Promise<Map<string, { slug: string; name: string }>> {
  const wanted = [...new Set(ids.filter((id): id is string => !!id))];
  const result = new Map<string, { slug: string; name: string }>();
  if (wanted.length === 0) return result;

  try {
    const rows = await db.orm.public.ServiceType
      .select("id", "slug", "name")
      .where((f) => f.id.in(wanted))
      .all();

    for (const row of rows) {
      result.set(row.id, { slug: row.slug, name: row.name });
    }
  } catch (error) {
    console.error("[catalog] could not load the service types", error);
  }

  return result;
}

/**
 * Group the items by their parent type.
 *
 * The groups keep the order in which the parents first appear, so the
 * customer sees the vehicles in the same order as before.
 */
function groupByParent<
  T extends { parentSlug: string | null; parentName: string | null },
>(items: T[], fallbackName: string): { parentSlug: string; parentName: string; children: T[] }[] {
  const groups: { parentSlug: string; parentName: string; children: T[] }[] = [];
  const bySlug = new Map<string, (typeof groups)[number]>();

  for (const item of items) {
    const slug = item.parentSlug ?? "other";
    const name = item.parentName ?? fallbackName;

    let group = bySlug.get(slug);
    if (!group) {
      group = { parentSlug: slug, parentName: name, children: [] };
      bySlug.set(slug, group);
      groups.push(group);
    }
    group.children.push(item);
  }

  return groups;
}

export type TourPackageDTO = {
  productSlug: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  tone: string | null;
  durationLabel: string | null;
  packageId: string;
  packageLabel: string;
  unitKind: string;
  adultUsdCents: number;
  childUsdCents: number;
  infantUsdCents: number;
  /** The minimum lead time of the product (days / hours). */
  leadTimeDays: number;
  leadTimeHours: number;
  /** The slug of the parent type (the destination, e.g. "bali"). */
  parentSlug: string | null;
  /** The name of the parent type (the destination, e.g. "Bali"). */
  parentName: string | null;
};

/**
 * A destination with the tour packages (children) below it.
 *
 * The tour line follows the same parent → child shape as the other lines:
 * the parent is the destination, the children are the packages.
 */
export type TourPackageGroupDTO = {
  parentSlug: string;
  parentName: string;
  children: TourPackageDTO[];
};

/**
 * Fetch the bookable tour packages of the "tour-package" line.
 *
 * Every package is priced per passenger (adult / child / infant), so the
 * client can compute the total from the traveller counts.
 */
export async function getTourPackages(): Promise<TourPackageDTO[]> {
  try {
    const line = await getLineBySlug("tour-package");
    if (!line) return [];

    const products = await db.orm.public.Product
      .select("id", "slug", "title", "description", "imageUrl", "tone", "durationLabel", "leadTimeDays", "leadTimeHours", "serviceTypeId")
      .where((f) => f.lineId.eq(line.id))
      .where((f) => f.active.eq(true))
      .where((f) => f.isAddOn.eq(false))
      .orderBy((f) => f.title.asc())
      .all();

    const tours: TourPackageDTO[] = [];

    const typeMap = await getServiceTypeNames(
      products.map((p) => p.serviceTypeId),
    );

    for (const product of products) {
      const packages = await db.orm.public.ProductPackage
        .select(
          "id",
          "label",
          "unitKind",
          "adultUsdCents",
          "childUsdCents",
          "infantUsdCents",
          "unitUsdCents",
        )
        .where((f) => f.productId.eq(product.id))
        .where((f) => f.active.eq(true))
        .orderBy((f) => f.sortOrder.asc())
        .all();

      const parent = product.serviceTypeId
        ? typeMap.get(product.serviceTypeId)
        : undefined;

      for (const pkg of packages) {
        tours.push({
          productSlug: product.slug,
          title: product.title,
          description: product.description ?? null,
          imageUrl: product.imageUrl ?? null,
          tone: product.tone ?? null,
          durationLabel: product.durationLabel ?? null,
          packageId: pkg.id,
          packageLabel: pkg.label,
          unitKind: pkg.unitKind,
          adultUsdCents:
            pkg.unitKind === "per_pax"
              ? (pkg.adultUsdCents ?? pkg.unitUsdCents ?? 0)
              : (pkg.unitUsdCents ?? 0),
          childUsdCents:
            pkg.unitKind === "per_pax" ? (pkg.childUsdCents ?? 0) : 0,
          infantUsdCents:
            pkg.unitKind === "per_pax" ? (pkg.infantUsdCents ?? 0) : 0,
          leadTimeDays: product.leadTimeDays ?? 0,
          leadTimeHours: product.leadTimeHours ?? 0,
          parentSlug: parent?.slug ?? null,
          parentName: parent?.name ?? null,
        });
      }
    }

    return tours;
  } catch (error) {
    console.error("[catalog] could not load tour packages", error);
    return [];
  }
}

/**
 * The tour packages, grouped by their destination.
 *
 * A package without a destination ends up in a "Lainnya" group, so nothing
 * is ever hidden from the customer.
 */
export async function getTourPackageGroups(): Promise<TourPackageGroupDTO[]> {
  const tours = await getTourPackages();
  return groupByParent(tours, "Lainnya");
}

/**
 * Fetch active payment methods.
 * Returns an empty array on error.
 */
export async function getPaymentMethods(): Promise<{ code: string; label: string }[]> {
  try {
    const rows = await db.orm.public.PaymentMethod
      .select("code", "label")
      .where((f) => f.active.eq(true))
      .orderBy((f) => f.sortOrder.asc())
      .all();
    return rows.map((r) => ({ code: r.code, label: r.label }));
  } catch (error) {
    console.error("[catalog] could not load payment methods", error);
    return [];
  }
}
