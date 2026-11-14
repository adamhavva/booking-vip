"use server";

import { db } from "@/prisma/db";
import { parseBookingRules, type BookingRules } from "@/lib/bookingRules";

/**
 * The transport rental readers — the results list, the vehicle detail and
 * the reviews behind them.
 *
 * Everything is DB-first and degrades to an empty result on error, so the
 * pages keep rendering when the database is unreachable (the same contract
 * the other catalog actions follow).
 */

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

/** One free-form spec of a vehicle — `key` is stable, `name` is display text. */
export type TransportSpec = { key: string; name: string };

/** One free-form info entry of a package; `excluded` = paid to the vendor. */
export type TransportPackageInfo = {
  key: string;
  name: string;
  excluded?: boolean;
};

export type TransportResultItem = {
  slug: string;
  title: string;
  vendor: string | null;
  tone: string;
  /** The first gallery photo (Media), else the product image, else null. */
  imageUrl: string | null;
  seats: number | null;
  driverOption: string;
  specs: TransportSpec[];
  /** The strikethrough "from" price — null when there is no promo. */
  fromUsdCents: number | null;
  /** The cheapest active package price of one rental day. */
  netUsdCents: number;
  /** 0 when there is no promo, else the rounded percent cut. */
  discountPercent: number;
  electric: boolean;
  serviceTypeName: string | null;
};

export type TransportSort = "recommended" | "price_asc" | "price_desc" | "discount";

export type TransportSearchInput = {
  /** Opaque cursor from a previous page (null/absent = first page). */
  cursor?: string | null;
  limit?: number;
  sort?: TransportSort;
  /** Only vehicles with a promo (from > net). */
  discountOnly?: boolean;
  /** Only vehicles with strictly more seats than this. */
  minPassengers?: number;
  /** Only electric vehicles (a spec with key "electric"). */
  electricOnly?: boolean;
  /** "with_driver" | "without_driver" — filters the product column. */
  driverOption?: string;
  /** The vehicle class slug (ServiceType of the transport line). */
  type?: string;
};

export type TransportSearchResult = {
  items: TransportResultItem[];
  nextCursor: string | null;
  total: number;
};

export type TransportPackageDTO = {
  id: string;
  label: string;
  unitKind: string;
  unitUsdCents: number;
  fromUsdCents: number | null;
  description: string | null;
  info: TransportPackageInfo[];
  durationHours: number | null;
};

export type TransportReviewDTO = {
  id: string;
  author: string;
  initials: string;
  rating: number;
  body: string;
  createdAt: string;
};

export type TransportDetailDTO = {
  slug: string;
  title: string;
  vendor: string | null;
  driverOption: string;
  seats: number | null;
  transmission: string | null;
  description: string;
  tone: string;
  specs: TransportSpec[];
  photos: { url: string; alt: string | null; credit: string | null }[];
  packages: TransportPackageDTO[];
  rating: number | null;
  reviewCount: number;
  reviews: TransportReviewDTO[];
  rules: BookingRules;
  leadTimeHours: number;
  leadTimeDays: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 24;

function parseSpecs(value: unknown): TransportSpec[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is Record<string, unknown> =>
        !!item && typeof item === "object" && !Array.isArray(item),
    )
    .map((item) => ({
      key: typeof item.key === "string" ? item.key : "",
      name: typeof item.name === "string" ? item.name : "",
    }))
    .filter((spec) => spec.key !== "" && spec.name !== "");
}

function parseInfo(value: unknown): TransportPackageInfo[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is Record<string, unknown> =>
        !!item && typeof item === "object" && !Array.isArray(item),
    )
    .map((item) => ({
      key: typeof item.key === "string" ? item.key : "",
      name: typeof item.name === "string" ? item.name : "",
      excluded: item.excluded === true,
    }))
    .filter((entry) => entry.key !== "" && entry.name !== "");
}

/** The cursor is the offset of the next page, base64-encoded. */
function encodeCursor(offset: number): string {
  return Buffer.from(String(offset), "utf8").toString("base64url");
}

function decodeCursor(cursor: string | null | undefined): number {
  if (!cursor) return 0;
  try {
    const value = Number(Buffer.from(cursor, "base64url").toString("utf8"));
    return Number.isInteger(value) && value >= 0 ? value : 0;
  } catch {
    return 0;
  }
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]![0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]![0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

/** The transport ServiceLine id, or null when the line is missing. */
async function transportLineId(): Promise<string | null> {
  const lines = await db.orm.public.ServiceLine
    .select("id")
    .where((f) => f.slug.eq("transport"))
    .where((f) => f.active.eq(true))
    .limit(1)
    .all();
  return lines[0]?.id ?? null;
}

type ProductRow = {
  id: string;
  slug: string;
  title: string;
  vendor: string | null;
  tone: string;
  imageUrl: string | null;
  seats: number | null;
  driverOption: string;
  specs: unknown;
  fromPriceUsdCents: number | null;
  serviceTypeId: string | null;
};

/** Load the active transport products with their cheapest package price. */
async function loadFleet(): Promise<
  (TransportResultItem & { serviceTypeId: string | null })[]
> {
  const lineId = await transportLineId();
  if (!lineId) return [];

  const products = (await db.orm.public.Product
    .select(
      "id",
      "slug",
      "title",
      "vendor",
      "tone",
      "imageUrl",
      "seats",
      "driverOption",
      "specs",
      "fromPriceUsdCents",
      "serviceTypeId",
    )
    .where((f) => f.lineId.eq(lineId))
    .where((f) => f.active.eq(true))
    .where((f) => f.isAddOn.eq(false))
    .orderBy((f) => f.title.asc())
    .all()) as ProductRow[];

  if (products.length === 0) return [];

  const productIds = products.map((p) => p.id);

  // Only daily-rental packages make a vehicle part of the rental fleet —
  // point-to-point transfers (per_unit) stay out of the "/hari" results.
  const packages = await db.orm.public.ProductPackage
    .select("productId", "unitKind", "unitUsdCents", "adultUsdCents")
    .where((f) => f.productId.in(productIds))
    .where((f) => f.active.eq(true))
    .all();

  const cheapest = new Map<string, number>();
  for (const pkg of packages) {
    if (pkg.unitKind !== "per_day") continue;
    const price = pkg.unitUsdCents ?? pkg.adultUsdCents ?? 0;
    const current = cheapest.get(pkg.productId);
    if (current == null || price < current) cheapest.set(pkg.productId, price);
  }

  const media = await db.orm.public.Media
    .select("ownerId", "url", "sortOrder")
    .where((f) => f.ownerType.eq("Product"))
    .where((f) => f.ownerId.in(productIds))
    .where((f) => f.active.eq(true))
    .orderBy((f) => f.sortOrder.asc())
    .all();

  const firstPhoto = new Map<string, string>();
  for (const row of media) {
    if (!firstPhoto.has(row.ownerId)) firstPhoto.set(row.ownerId, row.url);
  }

  const typeIds = [
    ...new Set(products.map((p) => p.serviceTypeId).filter((x): x is string => !!x)),
  ];
  const typeNames = new Map<string, string>();
  if (typeIds.length > 0) {
    const types = await db.orm.public.ServiceType
      .select("id", "name")
      .where((f) => f.id.in(typeIds))
      .all();
    for (const t of types) typeNames.set(t.id, t.name);
  }

  const items: (TransportResultItem & { serviceTypeId: string | null })[] = [];
  for (const product of products) {
    const net = cheapest.get(product.id);
    // A vehicle without any active package is not bookable — hide it.
    if (net == null) continue;

    const specs = parseSpecs(product.specs);
    const from = product.fromPriceUsdCents;
    const hasPromo = from != null && from > net;
    items.push({
      slug: product.slug,
      title: product.title,
      vendor: product.vendor,
      tone: product.tone,
      imageUrl: firstPhoto.get(product.id) ?? product.imageUrl,
      seats: product.seats,
      driverOption: product.driverOption,
      specs,
      fromUsdCents: hasPromo ? from : null,
      netUsdCents: net,
      discountPercent: hasPromo ? Math.round(((from - net) / from) * 100) : 0,
      electric: specs.some((spec) => spec.key === "electric"),
      serviceTypeName: product.serviceTypeId
        ? (typeNames.get(product.serviceTypeId) ?? null)
        : null,
      serviceTypeId: product.serviceTypeId,
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// searchTransport — the paginated, filterable results list
// ---------------------------------------------------------------------------

/**
 * One page of the transport results.
 *
 * The fleet is small (dozens of cars), so the filter + sort runs over the
 * whole loaded fleet and the cursor pages through the ordered result —
 * stable across pages because the order is deterministic (title tiebreak).
 */
export async function searchTransport(
  input: TransportSearchInput = {},
): Promise<TransportSearchResult> {
  try {
    const limit = Math.min(MAX_LIMIT, Math.max(1, input.limit ?? DEFAULT_LIMIT));
    const offset = decodeCursor(input.cursor);

    let fleet = await loadFleet();

    if (input.driverOption === "with_driver" || input.driverOption === "without_driver") {
      fleet = fleet.filter((item) => item.driverOption === input.driverOption);
    }
    if (input.type) {
      const lineId = await transportLineId();
      if (lineId) {
        const types = await db.orm.public.ServiceType
          .select("id")
          .where((f) => f.lineId.eq(lineId))
          .where((f) => f.slug.eq(input.type!))
          .limit(1)
          .all();
        const typeId = types[0]?.id;
        fleet = typeId ? fleet.filter((item) => item.serviceTypeId === typeId) : [];
      }
    }
    if (input.discountOnly) {
      fleet = fleet.filter((item) => item.discountPercent > 0);
    }
    if (input.minPassengers != null && input.minPassengers > 0) {
      fleet = fleet.filter((item) => (item.seats ?? 0) > input.minPassengers!);
    }
    if (input.electricOnly) {
      fleet = fleet.filter((item) => item.electric);
    }

    const sort = input.sort ?? "recommended";
    fleet.sort((a, b) => {
      if (sort === "price_asc") return a.netUsdCents - b.netUsdCents || a.title.localeCompare(b.title);
      if (sort === "price_desc") return b.netUsdCents - a.netUsdCents || a.title.localeCompare(b.title);
      if (sort === "discount") return b.discountPercent - a.discountPercent || a.title.localeCompare(b.title);
      return a.title.localeCompare(b.title);
    });

    const page = fleet.slice(offset, offset + limit);
    const nextOffset = offset + limit;
    return {
      items: page.map(({ serviceTypeId: _typeId, ...item }) => item),
      nextCursor: nextOffset < fleet.length ? encodeCursor(nextOffset) : null,
      total: fleet.length,
    };
  } catch (error) {
    console.error("[transport] could not search the fleet", error);
    return { items: [], nextCursor: null, total: 0 };
  }
}

// ---------------------------------------------------------------------------
// getTransportDetail — one vehicle with packages, photos, reviews and rules
// ---------------------------------------------------------------------------

export async function getTransportDetail(
  slug: string,
): Promise<TransportDetailDTO | null> {
  try {
    const products = await db.orm.public.Product
      .select(
        "id",
        "slug",
        "title",
        "vendor",
        "driverOption",
        "seats",
        "transmission",
        "description",
        "tone",
        "imageUrl",
        "specs",
        "rating",
        "reviews",
        "leadTimeHours",
        "leadTimeDays",
      )
      .where((f) => f.slug.eq(slug))
      .where((f) => f.active.eq(true))
      .where((f) => f.isAddOn.eq(false))
      .limit(1)
      .all();

    const product = products[0];
    if (!product) return null;

    const packages = await db.orm.public.ProductPackage
      .select(
        "id",
        "label",
        "unitKind",
        "unitUsdCents",
        "adultUsdCents",
        "fromUsdCents",
        "description",
        "info",
        "durationHours",
      )
      .where((f) => f.productId.eq(product.id))
      .where((f) => f.active.eq(true))
      .orderBy((f) => f.sortOrder.asc())
      .all();

    const media = await db.orm.public.Media
      .select("url", "alt", "credit")
      .where((f) => f.ownerType.eq("Product"))
      .where((f) => f.ownerId.eq(product.id))
      .where((f) => f.active.eq(true))
      .orderBy((f) => f.sortOrder.asc())
      .all();

    const photos = media.map((row) => ({
      url: row.url,
      alt: row.alt,
      credit: row.credit,
    }));
    if (photos.length === 0 && product.imageUrl) {
      photos.push({ url: product.imageUrl, alt: product.title, credit: null });
    }

    // Reviews — the root comments on this product, newest first.
    const reviewRows = await db.orm.public.Review
      .select("id", "userId", "rating", "body", "createdAt")
      .where((f) => f.subjectType.eq("product"))
      .where((f) => f.subjectId.eq(product.id))
      .where((f) => f.parentId.isNull())
      .orderBy((f) => f.createdAt.desc())
      .all();

    const userIds = [...new Set(reviewRows.map((row) => row.userId))];
    const names = new Map<string, string>();
    if (userIds.length > 0) {
      const users = await db.orm.public.User
        .select("id", "name", "email")
        .where((f) => f.id.in(userIds))
        .all();
      for (const user of users) {
        names.set(user.id, user.name ?? user.email.split("@")[0] ?? "Customer");
      }
    }

    const reviews: TransportReviewDTO[] = reviewRows.map((row) => {
      const author = names.get(row.userId) ?? "Customer";
      return {
        id: row.id,
        author,
        initials: initialsOf(author),
        rating: row.rating,
        body: row.body,
        createdAt: new Date(row.createdAt).toISOString(),
      };
    });

    const settings = await db.orm.public.Setting
      .select("value")
      .where((f) => f.key.eq("booking.rules"))
      .limit(1)
      .all();

    return {
      slug: product.slug,
      title: product.title,
      vendor: product.vendor,
      driverOption: product.driverOption,
      seats: product.seats,
      transmission: product.transmission,
      description: product.description,
      tone: product.tone,
      specs: parseSpecs(product.specs),
      photos,
      packages: packages.map((pkg) => ({
        id: pkg.id,
        label: pkg.label,
        unitKind: pkg.unitKind,
        unitUsdCents: pkg.unitUsdCents ?? pkg.adultUsdCents ?? 0,
        fromUsdCents: pkg.fromUsdCents,
        description: pkg.description,
        info: parseInfo(pkg.info),
        durationHours: pkg.durationHours,
      })),
      rating: product.rating,
      reviewCount: product.reviews ?? reviews.length,
      reviews,
      rules: parseBookingRules(settings[0]?.value),
      leadTimeHours: product.leadTimeHours,
      leadTimeDays: product.leadTimeDays,
    };
  } catch (error) {
    console.error("[transport] could not load the vehicle", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// listTransportReviews — the full review list behind "Lihat semua"
// ---------------------------------------------------------------------------

export async function listTransportReviews(
  slug: string,
): Promise<TransportReviewDTO[]> {
  try {
    const products = await db.orm.public.Product
      .select("id")
      .where((f) => f.slug.eq(slug))
      .limit(1)
      .all();
    const product = products[0];
    if (!product) return [];

    const rows = await db.orm.public.Review
      .select("id", "userId", "rating", "body", "createdAt")
      .where((f) => f.subjectType.eq("product"))
      .where((f) => f.subjectId.eq(product.id))
      .where((f) => f.parentId.isNull())
      .orderBy((f) => f.createdAt.desc())
      .all();

    const userIds = [...new Set(rows.map((row) => row.userId))];
    const names = new Map<string, string>();
    if (userIds.length > 0) {
      const users = await db.orm.public.User
        .select("id", "name", "email")
        .where((f) => f.id.in(userIds))
        .all();
      for (const user of users) {
        names.set(user.id, user.name ?? user.email.split("@")[0] ?? "Customer");
      }
    }

    return rows.map((row) => {
      const author = names.get(row.userId) ?? "Customer";
      return {
        id: row.id,
        author,
        initials: initialsOf(author),
        rating: row.rating,
        body: row.body,
        createdAt: new Date(row.createdAt).toISOString(),
      };
    });
  } catch (error) {
    console.error("[transport] could not load the reviews", error);
    return [];
  }
}
