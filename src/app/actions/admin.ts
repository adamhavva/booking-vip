"use server";

import { db } from "@/prisma/db";
import { getAdminSession } from "@/lib/admin/session";
import { descendantPlaceIds } from "@/lib/places";
import type {
  AdminAmenityRow,
  AdminOption,
  AdminPackageRow,
  AdminPlaceRow,
  AdminPriceTierRow,
  AdminProductRow,
  AdminReferenceData,
  AdminServiceLineRow,
  AdminServiceTypeRow,
  AdminStats,
} from "@/types/admin";

/**
 * Admin server actions.
 *
 * Every function is gated by `assertAdmin()`, which requires BOTH:
 *   1. `ADMIN_ENABLED=1` in the environment — a deployment kill-switch, and
 *   2. a valid admin session cookie whose email is on the `ADMIN_EMAILS`
 *      allowlist — the actual authorization check.
 *
 * The env flag alone is not authorization; it only switches the surface off.
 */

async function assertAdmin(): Promise<void> {
  if (process.env.ADMIN_ENABLED !== "1") {
    throw new Error("admin disabled");
  }
  const session = await getAdminSession();
  if (!session) {
    throw new Error("admin unauthorized");
  }
}

function assertNonEmptyString(value: unknown, field: string): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} is required`);
  }
}

function assertIntGte(value: unknown, field: string, min = 0): asserts value is number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min) {
    throw new Error(`${field} must be an integer >= ${min}`);
  }
}

function assertBool(value: unknown, field: string): asserts value is boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${field} must be a boolean`);
  }
}

/**
 * Guard the natural key of an upsert.
 *
 * Editing always targets the row the operator picked (by id); creating always
 * creates a new row. Either way the natural key — slug, label, code — must
 * not already belong to a *different* row: silently overwriting somebody
 * else's row is never what the operator meant.
 */
function assertNaturalKeyFree(
  naturalOwner: { id: string } | null | undefined,
  existing: { id: string } | null | undefined,
  message: string,
): void {
  if (naturalOwner && naturalOwner.id !== existing?.id) {
    throw new Error(message);
  }
}

// ---------------------------------------------------------------------------
// upsertServiceType
// ---------------------------------------------------------------------------
export async function upsertServiceType(input: {
  id?: string;
  lineId: string;
  slug: string;
  name: string;
  sortOrder?: number;
  active?: boolean;
}): Promise<{ ok: true }> {
  await assertAdmin();
  assertNonEmptyString(input.lineId, "lineId");
  assertNonEmptyString(input.slug, "slug");
  assertNonEmptyString(input.name, "name");

  const sortOrder = input.sortOrder ?? 0;
  assertIntGte(sortOrder, "sortOrder");
  const active = input.active ?? true;
  assertBool(active, "active");

  // Verify the parent line exists.
  const line = await db.orm.public.ServiceLine
    .select("id")
    .where({ id: input.lineId })
    .first();
  if (!line) throw new Error("line not found");

  // Editing targets the supplied row; creating always makes a new one.
  const existing = input.id
    ? await db.orm.public.ServiceType
        .select("id")
        .where({ id: input.id })
        .first()
    : undefined;

  // The (lineId, slug) pair must stay unique.
  const slugOwner = await db.orm.public.ServiceType
    .select("id")
    .where({ lineId: input.lineId, slug: input.slug })
    .first();
  assertNaturalKeyFree(slugOwner, existing, "slug already used in this line");

  if (existing) {
    await db.orm.public.ServiceType
      .where({ id: existing.id })
      .update({ lineId: input.lineId, slug: input.slug, name: input.name, sortOrder, active });
  } else {
    await db.orm.public.ServiceType.create({
      id: input.id ?? crypto.randomUUID(),
      lineId: input.lineId,
      slug: input.slug,
      name: input.name,
      sortOrder,
      active,
    });
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// upsertAirport
// ---------------------------------------------------------------------------
export async function upsertAirport(input: {
  id?: string;
  kind?: "airport" | "city";
  iataCode?: string | null;
  name: string;
  city: string;
  country?: string;
  imageUrl?: string | null;
  active?: boolean;
  /** The parent place — `null` makes the place a root of the hierarchy. */
  parentId?: string | null;
  /** Sort order inside the parent group (lower comes first). */
  sortOrder?: number;
}): Promise<{ ok: true }> {
  await assertAdmin();
  assertNonEmptyString(input.name, "name");
  assertNonEmptyString(input.city, "city");

  const kind = input.kind ?? "airport";
  if (kind !== "airport" && kind !== "city") {
    throw new Error("kind must be 'airport' or 'city'");
  }
  const country = input.country ?? "Indonesia";
  assertNonEmptyString(country, "country");
  const active = input.active ?? true;
  assertBool(active, "active");

  const sortOrder = input.sortOrder ?? 0;
  assertIntGte(sortOrder, "sortOrder", 0);

  // Editing targets the supplied row; creating always makes a new one.
  const existing = input.id
    ? await db.orm.public.Airport
        .select("id")
        .where({ id: input.id })
        .first()
    : undefined;

  // The IATA code must stay unique.
  if (input.iataCode) {
    const iataOwner = await db.orm.public.Airport
      .select("id")
      .where({ iataCode: input.iataCode })
      .first();
    assertNaturalKeyFree(iataOwner, existing, "iata code already used");
  }

  const parentId = input.parentId ?? null;
  if (parentId) {
    if (existing && parentId === existing.id) {
      throw new Error("a place cannot be its own parent");
    }
    const parent = await db.orm.public.Airport
      .select("id")
      .where({ id: parentId })
      .first();
    if (!parent) throw new Error("parent place not found");
    // The parent may not sit below the place being edited.
    if (existing) {
      const all = await db.orm.public.Airport
        .select("id", "parentId")
        .all();
      const descendants = descendantPlaceIds(all, existing.id);
      if (descendants.has(parentId)) {
        throw new Error("a place cannot be moved below one of its own children");
      }
    }
  }

  if (existing) {
    await db.orm.public.Airport
      .where({ id: existing.id })
      .update({
        kind,
        iataCode: input.iataCode ?? null,
        name: input.name,
        city: input.city,
        country,
        imageUrl: input.imageUrl ?? null,
        active,
        parentId,
        sortOrder,
      });
  } else {
    await db.orm.public.Airport.create({
      id: input.id ?? crypto.randomUUID(),
      kind,
      iataCode: input.iataCode ?? null,
      name: input.name,
      city: input.city,
      country,
      imageUrl: input.imageUrl ?? null,
      active,
      parentId,
      sortOrder,
    });
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// upsertPriceTier
// ---------------------------------------------------------------------------
export async function upsertPriceTier(input: {
  id?: string;
  lineId?: string | null;
  label: string;
  maxUsdCents: number;
  sortOrder?: number;
  active?: boolean;
}): Promise<{ ok: true }> {
  await assertAdmin();
  assertNonEmptyString(input.label, "label");
  assertIntGte(input.maxUsdCents, "maxUsdCents");

  const sortOrder = input.sortOrder ?? 0;
  assertIntGte(sortOrder, "sortOrder");
  const active = input.active ?? true;
  assertBool(active, "active");

  if (input.lineId) {
    const line = await db.orm.public.ServiceLine
      .select("id")
      .where({ id: input.lineId })
      .first();
    if (!line) throw new Error("line not found");
  }

  // Editing targets the supplied row; creating always makes a new one.
  const existing = input.id
    ? await db.orm.public.PriceTier
        .select("id")
        .where({ id: input.id })
        .first()
    : undefined;

  // The (lineId, label) pair must stay unique inside its scope.
  const labelOwner = input.lineId
    ? await db.orm.public.PriceTier
        .select("id")
        .where({ lineId: input.lineId, label: input.label })
        .first()
    : await db.orm.public.PriceTier
        .select("id")
        .where((f) => f.lineId.isNull())
        .where({ label: input.label })
        .first();
  assertNaturalKeyFree(labelOwner, existing, "label already used in this scope");

  if (existing) {
    await db.orm.public.PriceTier
      .where({ id: existing.id })
      .update({
        lineId: input.lineId ?? null,
        label: input.label,
        maxUsdCents: input.maxUsdCents,
        sortOrder,
        active,
      });
  } else {
    await db.orm.public.PriceTier.create({
      id: input.id ?? crypto.randomUUID(),
      lineId: input.lineId ?? null,
      label: input.label,
      maxUsdCents: input.maxUsdCents,
      sortOrder,
      active,
    });
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// upsertProduct
// ---------------------------------------------------------------------------
export async function upsertProduct(input: {
  id?: string;
  slug: string;
  lineId: string;
  serviceTypeId?: string | null;
  airportId?: string | null;
  title: string;
  description?: string;
  direction?: "arrival" | "departure" | "both";
  leadTimeHours?: number;
  leadTimeDays?: number;
  included?: string[];
  notIncluded?: string[];
  requirements?: string[];
  isAddOn?: boolean;
  imageUrl?: string | null;
  tone?: string;
  ribbon?: string | null;
  rating?: number | null;
  reviews?: number | null;
  durationLabel?: string | null;
  fromPriceUsdCents?: number | null;
  active?: boolean;
}): Promise<{ ok: true; id: string }> {
  await assertAdmin();
  assertNonEmptyString(input.slug, "slug");
  assertNonEmptyString(input.lineId, "lineId");
  assertNonEmptyString(input.title, "title");

  const direction = input.direction ?? "both";
  if (!["arrival", "departure", "both"].includes(direction)) {
    throw new Error("direction must be 'arrival' | 'departure' | 'both'");
  }

  const leadTimeHours = input.leadTimeHours ?? 0;
  const leadTimeDays = input.leadTimeDays ?? 0;
  assertIntGte(leadTimeHours, "leadTimeHours");
  assertIntGte(leadTimeDays, "leadTimeDays");

  if (input.fromPriceUsdCents != null) {
    assertIntGte(input.fromPriceUsdCents, "fromPriceUsdCents");
  }
  if (input.rating != null && (typeof input.rating !== "number" || input.rating < 0 || input.rating > 5)) {
    throw new Error("rating must be 0..5");
  }
  if (input.reviews != null) assertIntGte(input.reviews, "reviews");

  const isAddOn = input.isAddOn ?? false;
  assertBool(isAddOn, "isAddOn");
  const active = input.active ?? true;
  assertBool(active, "active");

  // Verify line exists.
  const line = await db.orm.public.ServiceLine
    .select("id")
    .where({ id: input.lineId })
    .first();
  if (!line) throw new Error("line not found");

  // Editing targets the supplied row; creating always makes a new one.
  const existing = input.id
    ? await db.orm.public.Product
        .select("id")
        .where({ id: input.id })
        .first()
    : undefined;

  // The slug must stay unique.
  const slugOwner = await db.orm.public.Product
    .select("id")
    .where({ slug: input.slug })
    .first();
  assertNaturalKeyFree(slugOwner, existing, "slug already used");

  const payload = {
    slug: input.slug,
    lineId: input.lineId,
    serviceTypeId: input.serviceTypeId ?? null,
    airportId: input.airportId ?? null,
    title: input.title,
    description: input.description ?? "",
    direction,
    leadTimeHours,
    leadTimeDays,
    included: (input.included ?? []) as unknown as [],
    notIncluded: (input.notIncluded ?? []) as unknown as [],
    requirements: (input.requirements ?? []) as unknown as [],
    isAddOn,
    imageUrl: input.imageUrl ?? null,
    tone: input.tone ?? "from-sky-400 to-blue-600",
    ribbon: input.ribbon ?? null,
    rating: input.rating ?? null,
    reviews: input.reviews ?? null,
    durationLabel: input.durationLabel ?? null,
    fromPriceUsdCents: input.fromPriceUsdCents ?? null,
    active,
  };

  if (existing) {
    await db.orm.public.Product.where({ id: existing.id }).update(payload);
    return { ok: true, id: existing.id };
  }

  const id = input.id ?? crypto.randomUUID();
  await db.orm.public.Product.create({
    id,
    ...payload,
  });

  return { ok: true, id };
}

// ---------------------------------------------------------------------------
// upsertPackage (ProductPackage)
// ---------------------------------------------------------------------------
export async function upsertPackage(input: {
  id?: string;
  productId: string;
  label: string;
  unitKind: "per_pax" | "per_unit";
  adultUsdCents?: number | null;
  childUsdCents?: number | null;
  infantUsdCents?: number | null;
  unitUsdCents?: number | null;
  durationHours?: number | null;
  extraHourUsdCents?: number | null;
  sortOrder?: number;
  active?: boolean;
}): Promise<{ ok: true }> {
  await assertAdmin();
  assertNonEmptyString(input.productId, "productId");
  assertNonEmptyString(input.label, "label");

  const unitKind = input.unitKind;
  if (unitKind !== "per_pax" && unitKind !== "per_unit") {
    throw new Error("unitKind must be 'per_pax' | 'per_unit'");
  }

  // unitKind consistency: per_pax needs adultUsdCents; per_unit needs unitUsdCents.
  if (unitKind === "per_pax") {
    if (input.adultUsdCents != null) assertIntGte(input.adultUsdCents, "adultUsdCents");
    if (input.childUsdCents != null) assertIntGte(input.childUsdCents, "childUsdCents");
    if (input.infantUsdCents != null) assertIntGte(input.infantUsdCents, "infantUsdCents");
  } else {
    if (input.unitUsdCents != null) assertIntGte(input.unitUsdCents, "unitUsdCents");
  }

  // duration consistency: durationHours goes with extraHourUsdCents.
  if (input.durationHours != null) {
    assertIntGte(input.durationHours, "durationHours");
    if (input.extraHourUsdCents != null) {
      assertIntGte(input.extraHourUsdCents, "extraHourUsdCents");
    }
  }

  const sortOrder = input.sortOrder ?? 0;
  assertIntGte(sortOrder, "sortOrder");
  const active = input.active ?? true;
  assertBool(active, "active");

  // Verify product exists.
  const product = await db.orm.public.Product
    .select("id")
    .where({ id: input.productId })
    .first();
  if (!product) throw new Error("product not found");

  // Editing targets the supplied row; creating always makes a new one.
  const existing = input.id
    ? await db.orm.public.ProductPackage
        .select("id")
        .where({ id: input.id })
        .first()
    : undefined;

  // The (productId, label) pair must stay unique.
  const labelOwner = await db.orm.public.ProductPackage
    .select("id")
    .where({ productId: input.productId, label: input.label })
    .first();
  assertNaturalKeyFree(labelOwner, existing, "label already used in this product");

  const payload = {
    productId: input.productId,
    label: input.label,
    unitKind,
    adultUsdCents: unitKind === "per_pax" ? (input.adultUsdCents ?? null) : null,
    childUsdCents: unitKind === "per_pax" ? (input.childUsdCents ?? null) : null,
    infantUsdCents: unitKind === "per_pax" ? (input.infantUsdCents ?? 0) : null,
    unitUsdCents: unitKind === "per_unit" ? (input.unitUsdCents ?? null) : null,
    durationHours: input.durationHours ?? null,
    extraHourUsdCents: input.durationHours != null ? (input.extraHourUsdCents ?? null) : null,
    sortOrder,
    active,
  };

  if (existing) {
    await db.orm.public.ProductPackage
      .where({ id: existing.id })
      .update(payload);
  } else {
    await db.orm.public.ProductPackage.create({
      id: input.id ?? crypto.randomUUID(),
      ...payload,
    });
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// upsertPaymentMethod
// ---------------------------------------------------------------------------
export async function upsertPaymentMethod(input: {
  id?: string;
  code: string;
  label: string;
  sortOrder?: number;
  active?: boolean;
}): Promise<{ ok: true }> {
  await assertAdmin();
  assertNonEmptyString(input.code, "code");
  assertNonEmptyString(input.label, "label");

  const sortOrder = input.sortOrder ?? 0;
  assertIntGte(sortOrder, "sortOrder");
  const active = input.active ?? true;
  assertBool(active, "active");

  // Editing targets the supplied row; creating always makes a new one.
  const existing = input.id
    ? await db.orm.public.PaymentMethod
        .select("id")
        .where({ id: input.id })
        .first()
    : undefined;

  // The code must stay unique.
  const codeOwner = await db.orm.public.PaymentMethod
    .select("id")
    .where({ code: input.code })
    .first();
  assertNaturalKeyFree(codeOwner, existing, "code already used");

  if (existing) {
    await db.orm.public.PaymentMethod
      .where({ id: existing.id })
      .update({ code: input.code, label: input.label, sortOrder, active });
  } else {
    await db.orm.public.PaymentMethod.create({
      id: input.id ?? crypto.randomUUID(),
      code: input.code,
      label: input.label,
      sortOrder,
      active,
    });
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// upsertAirline
// ---------------------------------------------------------------------------
export async function upsertAirline(input: {
  id?: string;
  code: string;
  name: string;
  active?: boolean;
}): Promise<{ ok: true }> {
  await assertAdmin();
  assertNonEmptyString(input.code, "code");
  assertNonEmptyString(input.name, "name");

  const active = input.active ?? true;
  assertBool(active, "active");

  // Editing targets the supplied row; creating always makes a new one.
  const existing = input.id
    ? await db.orm.public.Airline
        .select("id")
        .where({ id: input.id })
        .first()
    : undefined;

  // The code must stay unique.
  const codeOwner = await db.orm.public.Airline
    .select("id")
    .where({ code: input.code })
    .first();
  assertNaturalKeyFree(codeOwner, existing, "code already used");

  if (existing) {
    await db.orm.public.Airline
      .where({ id: existing.id })
      .update({ code: input.code, name: input.name, active });
  } else {
    await db.orm.public.Airline.create({
      id: input.id ?? crypto.randomUUID(),
      code: input.code,
      name: input.name,
      active,
    });
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// upsertCountry
// ---------------------------------------------------------------------------
export async function upsertCountry(input: {
  id?: string;
  code: string;
  name: string;
  dialCode: string;
  active?: boolean;
}): Promise<{ ok: true }> {
  await assertAdmin();
  assertNonEmptyString(input.code, "code");
  assertNonEmptyString(input.name, "name");
  assertNonEmptyString(input.dialCode, "dialCode");

  const active = input.active ?? true;
  assertBool(active, "active");

  // Editing targets the supplied row; creating always makes a new one.
  const existing = input.id
    ? await db.orm.public.Country
        .select("id")
        .where({ id: input.id })
        .first()
    : undefined;

  // The code must stay unique.
  const codeOwner = await db.orm.public.Country
    .select("id")
    .where({ code: input.code })
    .first();
  assertNaturalKeyFree(codeOwner, existing, "code already used");

  if (existing) {
    await db.orm.public.Country
      .where({ id: existing.id })
      .update({ code: input.code, name: input.name, dialCode: input.dialCode, active });
  } else {
    await db.orm.public.Country.create({
      id: input.id ?? crypto.randomUUID(),
      code: input.code,
      name: input.name,
      dialCode: input.dialCode,
      active,
    });
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Read actions — the admin tables
// ---------------------------------------------------------------------------

/** All products with their line / type / place labels. */
export async function listProducts(): Promise<AdminProductRow[]> {
  await assertAdmin();

  const rows = await db.orm.public.Product
    .select(
      "id",
      "slug",
      "title",
      "description",
      "lineId",
      "serviceTypeId",
      "airportId",
      "direction",
      "leadTimeHours",
      "leadTimeDays",
      "included",
      "notIncluded",
      "requirements",
      "isAddOn",
      "imageUrl",
      "tone",
      "ribbon",
      "rating",
      "reviews",
      "durationLabel",
      "fromPriceUsdCents",
      "active",
    )
    .include("line", (l) => l.select("label"))
    .include("serviceType", (t) => t.select("name"))
    .include("airport", (a) => a.select("name"))
    .include("packages", (p) => p.count())
    .orderBy((f) => f.title.asc())
    .all();

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    lineId: r.lineId,
    lineLabel: r.line?.label ?? "—",
    serviceTypeId: r.serviceTypeId,
    serviceTypeName: r.serviceType?.name ?? null,
    airportId: r.airportId,
    airportName: r.airport?.name ?? null,
    direction: r.direction,
    leadTimeHours: r.leadTimeHours,
    leadTimeDays: r.leadTimeDays,
    included: (r.included as string[]) ?? [],
    notIncluded: (r.notIncluded as string[]) ?? [],
    requirements: (r.requirements as string[]) ?? [],
    isAddOn: r.isAddOn,
    imageUrl: r.imageUrl,
    tone: r.tone,
    ribbon: r.ribbon,
    rating: r.rating,
    reviews: r.reviews,
    durationLabel: r.durationLabel,
    fromPriceUsdCents: r.fromPriceUsdCents,
    active: r.active,
    packageCount: r.packages,
  }));
}

/** All packages with the parent product title. */
export async function listPackages(): Promise<AdminPackageRow[]> {
  await assertAdmin();

  const rows = await db.orm.public.ProductPackage
    .select(
      "id",
      "productId",
      "label",
      "unitKind",
      "adultUsdCents",
      "childUsdCents",
      "infantUsdCents",
      "unitUsdCents",
      "durationHours",
      "extraHourUsdCents",
      "sortOrder",
      "active",
    )
    .include("product", (p) => p.select("title"))
    .orderBy((f) => f.sortOrder.asc())
    .all();

  return rows.map((r) => ({
    id: r.id,
    productId: r.productId,
    productTitle: r.product?.title ?? "—",
    label: r.label,
    unitKind: r.unitKind,
    adultUsdCents: r.adultUsdCents,
    childUsdCents: r.childUsdCents,
    infantUsdCents: r.infantUsdCents,
    unitUsdCents: r.unitUsdCents,
    durationHours: r.durationHours,
    extraHourUsdCents: r.extraHourUsdCents,
    sortOrder: r.sortOrder,
    active: r.active,
  }));
}

/** All service types with their line label and product count. */
export async function listServiceTypes(): Promise<AdminServiceTypeRow[]> {
  await assertAdmin();

  const rows = await db.orm.public.ServiceType
    .select("id", "lineId", "slug", "name", "sortOrder", "active")
    .include("line", (l) => l.select("label"))
    .include("products", (p) => p.count())
    .orderBy((f) => f.sortOrder.asc())
    .all();

  return rows.map((r) => ({
    id: r.id,
    lineId: r.lineId,
    lineLabel: r.line?.label ?? "—",
    slug: r.slug,
    name: r.name,
    sortOrder: r.sortOrder,
    active: r.active,
    productCount: r.products,
  }));
}

/** All price tiers with the scope line — labels repeat per line, so the scope matters. */
export async function listPriceTiers(): Promise<AdminPriceTierRow[]> {
  await assertAdmin();

  const rows = await db.orm.public.PriceTier
    .select("id", "lineId", "label", "maxUsdCents", "sortOrder", "active")
    .include("line", (l) => l.select("label"))
    .orderBy((f) => f.sortOrder.asc())
    .all();

  return rows.map((r) => ({
    id: r.id,
    lineId: r.lineId,
    lineLabel: r.line?.label ?? null,
    label: r.label,
    maxUsdCents: r.maxUsdCents,
    sortOrder: r.sortOrder,
    active: r.active,
  }));
}

/** All places (airports and cities). */
export async function listPlaces(): Promise<AdminPlaceRow[]> {
  await assertAdmin();

  const rows = await db.orm.public.Airport
    .select(
      "id",
      "kind",
      "iataCode",
      "name",
      "city",
      "country",
      "imageUrl",
      "active",
      "parentId",
      "sortOrder"
    )
    .include("products", (p) => p.count())
    .orderBy((f) => f.sortOrder.asc())
    .all();

  const names = new Map(rows.map((r) => [r.id, r.name]));

  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    iataCode: r.iataCode,
    name: r.name,
    city: r.city,
    country: r.country,
    imageUrl: r.imageUrl,
    active: r.active,
    parentId: r.parentId,
    parentName: r.parentId ? (names.get(r.parentId) ?? null) : null,
    sortOrder: r.sortOrder,
    productCount: r.products,
  }));
}

/** All service lines. */
export async function listServiceLines(): Promise<AdminServiceLineRow[]> {
  await assertAdmin();

  const rows = await db.orm.public.ServiceLine
    .select("id", "slug", "label", "short", "badge", "tone", "imageUrl", "sortOrder", "active")
    .include("products", (p) => p.count())
    .orderBy((f) => f.sortOrder.asc())
    .all();

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    label: r.label,
    short: r.short,
    badge: r.badge,
    tone: r.tone,
    imageUrl: r.imageUrl,
    sortOrder: r.sortOrder,
    active: r.active,
    productCount: r.products,
  }));
}

/** All amenities with the number of products using them. */
export async function listAmenities(): Promise<AdminAmenityRow[]> {
  await assertAdmin();

  const rows = await db.orm.public.Amenity
    .select("id", "label")
    .include("products", (p) => p.count())
    .orderBy((f) => f.label.asc())
    .all();

  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    productCount: r.products,
  }));
}

/** Reference lists used to populate the relation pickers in the edit drawer. */
export async function getAdminReferenceData(): Promise<AdminReferenceData> {
  await assertAdmin();

  const [lines, serviceTypes, places, products, amenities] = await Promise.all([
    db.orm.public.ServiceLine.select("id", "label").orderBy((f) => f.sortOrder.asc()).all(),
    db.orm.public.ServiceType.select("id", "name", "lineId").orderBy((f) => f.name.asc()).all(),
    db.orm.public.Airport.select("id", "name", "iataCode", "kind").orderBy((f) => f.name.asc()).all(),
    db.orm.public.Product.select("id", "title", "isAddOn").orderBy((f) => f.title.asc()).all(),
    db.orm.public.Amenity.select("id", "label").orderBy((f) => f.label.asc()).all(),
  ]);

  const lineLabels = new Map(lines.map((l) => [l.id, l.label]));
  const serviceTypeOptions: AdminOption[] = serviceTypes.map((t) => ({
    value: t.id,
    label: `${t.name} · ${lineLabels.get(t.lineId) ?? "—"}`,
  }));
  const placeOptions: AdminOption[] = places.map((p) => ({
    value: p.id,
    label: p.iataCode ? `${p.name} (${p.iataCode})` : p.name,
  }));
  const productOptions: AdminOption[] = products.map((p) => ({
    value: p.id,
    label: p.title,
  }));
  const addOnOptions: AdminOption[] = products
    .filter((p) => p.isAddOn)
    .map((p) => ({ value: p.id, label: p.title }));

  return {
    lines: lines.map((l) => ({ value: l.id, label: l.label })),
    serviceTypes: serviceTypeOptions,
    places: placeOptions,
    products: productOptions,
    amenities: amenities.map((a) => ({ value: a.id, label: a.label })),
    addOns: addOnOptions,
  };
}

/** Dashboard counters. */
export async function getAdminStats(): Promise<AdminStats> {
  await assertAdmin();

  const [products, activeProducts, packages, serviceTypes, priceTiers, places, lines, amenities, productAmenities, productAddOns] =
    await Promise.all([
      db.orm.public.Product.aggregate((a) => ({ n: a.count() })),
      db.orm.public.Product.where((f) => f.active.eq(true)).aggregate((a) => ({ n: a.count() })),
      db.orm.public.ProductPackage.aggregate((a) => ({ n: a.count() })),
      db.orm.public.ServiceType.aggregate((a) => ({ n: a.count() })),
      db.orm.public.PriceTier.aggregate((a) => ({ n: a.count() })),
      db.orm.public.Airport.aggregate((a) => ({ n: a.count() })),
      db.orm.public.ServiceLine.aggregate((a) => ({ n: a.count() })),
      db.orm.public.Amenity.aggregate((a) => ({ n: a.count() })),
      db.orm.public.ProductAmenity.aggregate((a) => ({ n: a.count() })),
      db.orm.public.ProductAddOn.aggregate((a) => ({ n: a.count() })),
    ]);

  return {
    products: products.n,
    activeProducts: activeProducts.n,
    packages: packages.n,
    serviceTypes: serviceTypes.n,
    priceTiers: priceTiers.n,
    places: places.n,
    serviceLines: lines.n,
    amenities: amenities.n,
    productAmenities: productAmenities.n,
    productAddOns: productAddOns.n,
  };
}

// ---------------------------------------------------------------------------
// Mutations — service lines, amenities, activation, ordering, relations
// ---------------------------------------------------------------------------

/** Create or update a service line. */
export async function upsertServiceLine(input: {
  id?: string;
  slug: string;
  label: string;
  short: string;
  badge?: string | null;
  tone?: string;
  imageUrl?: string | null;
  sortOrder?: number;
  active?: boolean;
}): Promise<{ ok: true }> {
  await assertAdmin();
  assertNonEmptyString(input.slug, "slug");
  assertNonEmptyString(input.label, "label");
  assertNonEmptyString(input.short, "short");

  const sortOrder = input.sortOrder ?? 0;
  assertIntGte(sortOrder, "sortOrder");
  const active = input.active ?? true;
  assertBool(active, "active");

  // Editing targets the supplied row; creating always makes a new one.
  const existing = input.id
    ? await db.orm.public.ServiceLine
        .select("id")
        .where({ id: input.id })
        .first()
    : undefined;

  // The slug must stay unique.
  const slugOwner = await db.orm.public.ServiceLine
    .select("id")
    .where({ slug: input.slug })
    .first();
  assertNaturalKeyFree(slugOwner, existing, "slug already used");

  const payload = {
    slug: input.slug,
    label: input.label,
    short: input.short,
    badge: input.badge ?? null,
    tone: input.tone ?? "from-sky-400 to-blue-600",
    imageUrl: input.imageUrl ?? null,
    sortOrder,
    active,
  };

  if (existing) {
    await db.orm.public.ServiceLine.where({ id: existing.id }).update(payload);
  } else {
    await db.orm.public.ServiceLine.create({
      id: input.id ?? crypto.randomUUID(),
      ...payload,
    });
  }

  return { ok: true };
}

/** Create or update an amenity. */
export async function upsertAmenity(input: {
  id?: string;
  label: string;
}): Promise<{ ok: true }> {
  await assertAdmin();
  assertNonEmptyString(input.label, "label");

  // Editing targets the supplied row; creating always makes a new one.
  const existing = input.id
    ? await db.orm.public.Amenity
        .select("id")
        .where({ id: input.id })
        .first()
    : undefined;

  // The label must stay unique.
  const labelOwner = await db.orm.public.Amenity
    .select("id")
    .where({ label: input.label })
    .first();
  assertNaturalKeyFree(labelOwner, existing, "label already used");

  if (existing) {
    await db.orm.public.Amenity.where({ id: existing.id }).update({ label: input.label });
  } else {
    await db.orm.public.Amenity.create({
      id: input.id ?? crypto.randomUUID(),
      label: input.label,
    });
  }

  return { ok: true };
}

/**
 * Toggle the `active` flag of a catalog row.
 *
 * `table` is a closed union so the write stays type-safe; soft delete is the
 * default everywhere (rows stay in the database but disappear from the site).
 */
export async function setCatalogActive(input: {
  table: "product" | "package" | "serviceType" | "priceTier" | "place" | "serviceLine";
  id: string;
  active: boolean;
}): Promise<{ ok: true }> {
  await assertAdmin();
  assertNonEmptyString(input.id, "id");
  assertBool(input.active, "active");

  switch (input.table) {
    case "product":
      await db.orm.public.Product.where({ id: input.id }).update({ active: input.active });
      break;
    case "package":
      await db.orm.public.ProductPackage.where({ id: input.id }).update({ active: input.active });
      break;
    case "serviceType":
      await db.orm.public.ServiceType.where({ id: input.id }).update({ active: input.active });
      break;
    case "priceTier":
      await db.orm.public.PriceTier.where({ id: input.id }).update({ active: input.active });
      break;
    case "place":
      await db.orm.public.Airport.where({ id: input.id }).update({ active: input.active });
      break;
    case "serviceLine":
      await db.orm.public.ServiceLine.where({ id: input.id }).update({ active: input.active });
      break;
    default:
      throw new Error("unknown table");
  }

  return { ok: true };
}

/**
 * Move a row up or down within its sort order.
 *
 * `direction` is "up" | "down"; the sibling is looked up inside the same
 * scope (same line / same product) so the order never crosses groups.
 */
export async function reorderCatalog(input: {
  table: "serviceType" | "priceTier" | "package" | "serviceLine";
  id: string;
  direction: "up" | "down";
}): Promise<{ ok: true }> {
  await assertAdmin();
  assertNonEmptyString(input.id, "id");

  if (input.table === "serviceLine") {
    const rows = await db.orm.public.ServiceLine
      .select("id", "sortOrder")
      .orderBy((f) => f.sortOrder.asc())
      .all();
    await swapOrder(rows, input.id, input.direction, (id, sortOrder) =>
      db.orm.public.ServiceLine.where({ id }).update({ sortOrder }),
    );
    return { ok: true };
  }

  if (input.table === "serviceType") {
    const rows = await db.orm.public.ServiceType
      .select("id", "lineId", "sortOrder")
      .orderBy((f) => f.sortOrder.asc())
      .all();
    await swapOrder(rows, input.id, input.direction, (id, sortOrder) =>
      db.orm.public.ServiceType.where({ id }).update({ sortOrder }),
    );
    return { ok: true };
  }

  if (input.table === "priceTier") {
    const rows = await db.orm.public.PriceTier
      .select("id", "lineId", "sortOrder")
      .orderBy((f) => f.sortOrder.asc())
      .all();
    await swapOrder(rows, input.id, input.direction, (id, sortOrder) =>
      db.orm.public.PriceTier.where({ id }).update({ sortOrder }),
    );
    return { ok: true };
  }

  const rows = await db.orm.public.ProductPackage
    .select("id", "productId", "sortOrder")
    .orderBy((f) => f.sortOrder.asc())
    .all();
  await swapOrder(rows, input.id, input.direction, (id, sortOrder) =>
    db.orm.public.ProductPackage.where({ id }).update({ sortOrder }),
  );
  return { ok: true };
}

/**
 * Swap the sort order of a row with its neighbour inside the same scope.
 */
async function swapOrder(
  rows: { id: string; sortOrder: number; lineId?: string | null; productId?: string }[],
  id: string,
  direction: "up" | "down",
  update: (id: string, sortOrder: number) => Promise<unknown>,
): Promise<void> {
  const index = rows.findIndex((r) => r.id === id);
  if (index === -1) throw new Error("row not found");

  const current = rows[index];
  const scope = current.lineId ?? current.productId ?? null;
  const siblings = rows.filter((r) => (r.lineId ?? r.productId ?? null) === scope);

  const siblingIndex = siblings.findIndex((r) => r.id === id);
  const target = siblings[siblingIndex + (direction === "up" ? -1 : 1)];
  if (!target) return; // already at the edge of its group

  await update(current.id, target.sortOrder);
  await update(target.id, current.sortOrder);
}

/** Replace the amenities attached to a product. */
export async function setProductAmenities(input: {
  productId: string;
  amenityIds: string[];
}): Promise<{ ok: true }> {
  await assertAdmin();
  assertNonEmptyString(input.productId, "productId");

  const product = await db.orm.public.Product
    .select("id")
    .where({ id: input.productId })
    .first();
  if (!product) throw new Error("product not found");

  const existing = await db.orm.public.ProductAmenity
    .select("id", "amenityId")
    .where({ productId: input.productId })
    .all();

  const wanted = new Set(input.amenityIds);

  for (const row of existing) {
    if (!wanted.has(row.amenityId)) {
      await db.orm.public.ProductAmenity.where({ id: row.id }).delete();
    }
  }

  const already = new Set(existing.map((r) => r.amenityId));
  for (const amenityId of wanted) {
    if (already.has(amenityId)) continue;
    await db.orm.public.ProductAmenity.create({
      id: crypto.randomUUID(),
      productId: input.productId,
      amenityId,
    });
  }

  return { ok: true };
}

/** Replace the add-ons offered by a product. */
export async function setProductAddOns(input: {
  productId: string;
  addOnIds: string[];
}): Promise<{ ok: true }> {
  await assertAdmin();
  assertNonEmptyString(input.productId, "productId");

  const product = await db.orm.public.Product
    .select("id")
    .where({ id: input.productId })
    .first();
  if (!product) throw new Error("product not found");

  const existing = await db.orm.public.ProductAddOn
    .select("id", "addOnId")
    .where({ productId: input.productId })
    .all();

  const wanted = new Set(input.addOnIds);

  for (const row of existing) {
    if (!wanted.has(row.addOnId)) {
      await db.orm.public.ProductAddOn.where({ id: row.id }).delete();
    }
  }

  const already = new Set(existing.map((r) => r.addOnId));
  let sortOrder = existing.length;
  for (const addOnId of wanted) {
    if (already.has(addOnId)) continue;
    await db.orm.public.ProductAddOn.create({
      id: crypto.randomUUID(),
      productId: input.productId,
      addOnId,
      sortOrder: sortOrder++,
    });
  }

  return { ok: true };
}

/** Amenity and add-on ids currently attached to a product. */
export async function getProductRelations(input: {
  productId: string;
}): Promise<{ amenityIds: string[]; addOnIds: string[] }> {
  await assertAdmin();
  assertNonEmptyString(input.productId, "productId");

  const amenities = await db.orm.public.ProductAmenity
    .select("amenityId")
    .where({ productId: input.productId })
    .all();
  const addOns = await db.orm.public.ProductAddOn
    .select("addOnId")
    .where({ productId: input.productId })
    .orderBy((f) => f.sortOrder.asc())
    .all();

  return {
    amenityIds: amenities.map((a) => a.amenityId),
    addOnIds: addOns.map((a) => a.addOnId),
  };
}
