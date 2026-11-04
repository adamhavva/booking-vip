"use server";

import { db } from "@/prisma/db";

/**
 * Reserved admin server actions.
 *
 * Every function is gated by `ADMIN_ENABLED=1` in the environment; without it
 * the call throws immediately. No admin UI is wired — this surface exists so
 * a future webadmin can call these actions without changing the API shape.
 */

function assertAdmin(): void {
  if (process.env.ADMIN_ENABLED !== "1") {
    throw new Error("admin disabled");
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
  assertAdmin();
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

  // Unique check: (lineId, slug)
  const existing = await db.orm.public.ServiceType
    .select("id")
    .where({ lineId: input.lineId, slug: input.slug })
    .first();

  if (existing) {
    await db.orm.public.ServiceType
      .where({ id: existing.id })
      .update({ name: input.name, sortOrder, active });
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
  active?: boolean;
}): Promise<{ ok: true }> {
  assertAdmin();
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

  // Lookup by iataCode (if provided) else by kind+city.
  const existing = input.iataCode
    ? await db.orm.public.Airport
        .select("id")
        .where({ iataCode: input.iataCode })
        .first()
    : await db.orm.public.Airport
        .select("id")
        .where((f) => f.kind.eq(kind))
        .where({ city: input.city })
        .first();

  if (existing) {
    await db.orm.public.Airport
      .where({ id: existing.id })
      .update({
        kind,
        iataCode: input.iataCode ?? null,
        name: input.name,
        city: input.city,
        country,
        active,
      });
  } else {
    await db.orm.public.Airport.create({
      id: input.id ?? crypto.randomUUID(),
      kind,
      iataCode: input.iataCode ?? null,
      name: input.name,
      city: input.city,
      country,
      active,
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
  assertAdmin();
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

  // Match by (lineId, label) — both nullable-safe.
  const existing = input.lineId
    ? await db.orm.public.PriceTier
        .select("id")
        .where({ lineId: input.lineId, label: input.label })
        .first()
    : await db.orm.public.PriceTier
        .select("id")
        .where((f) => f.lineId.isNull())
        .where({ label: input.label })
        .first();

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
}): Promise<{ ok: true }> {
  assertAdmin();
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

  // Unique slug check.
  const existing = await db.orm.public.Product
    .select("id")
    .where({ slug: input.slug })
    .first();

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
  } else {
    await db.orm.public.Product.create({
      id: input.id ?? crypto.randomUUID(),
      ...payload,
    });
  }

  return { ok: true };
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
  assertAdmin();
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

  // Unique by (productId, label).
  const existing = await db.orm.public.ProductPackage
    .select("id")
    .where({ productId: input.productId, label: input.label })
    .first();

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
  assertAdmin();
  assertNonEmptyString(input.code, "code");
  assertNonEmptyString(input.label, "label");

  const sortOrder = input.sortOrder ?? 0;
  assertIntGte(sortOrder, "sortOrder");
  const active = input.active ?? true;
  assertBool(active, "active");

  // Unique code check.
  const existing = await db.orm.public.PaymentMethod
    .select("id")
    .where({ code: input.code })
    .first();

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
  assertAdmin();
  assertNonEmptyString(input.code, "code");
  assertNonEmptyString(input.name, "name");

  const active = input.active ?? true;
  assertBool(active, "active");

  // Unique code check.
  const existing = await db.orm.public.Airline
    .select("id")
    .where({ code: input.code })
    .first();

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
  assertAdmin();
  assertNonEmptyString(input.code, "code");
  assertNonEmptyString(input.name, "name");
  assertNonEmptyString(input.dialCode, "dialCode");

  const active = input.active ?? true;
  assertBool(active, "active");

  // Unique code check.
  const existing = await db.orm.public.Country
    .select("id")
    .where({ code: input.code })
    .first();

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
