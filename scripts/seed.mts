#!/usr/bin/env node --experimental-strip-types
// Idempotent seed for the booking domain. Re-running is safe — it only
// inserts rows when unique-key lookup misses, never deletes.
//
// Run:  node --experimental-strip-types scripts/seed.mts
//   (or `npm run db:seed` from repo root)

import "dotenv/config";
import { db } from "../src/prisma/db.ts";
import {
  categories,
  vipServices,
  transports,
  tours,
  evoaPlans,
} from "../src/data/home.ts";
import { serviceNav } from "../src/data/services.ts";
import { seedContent } from "./seed-content.mts";

// ---------- tiny helpers ----------
const counts: Record<string, { created: number; existing: number }> = {};
function bump(table: string, created: boolean) {
  counts[table] ??= { created: 0, existing: 0 };
  if (created) counts[table].created++;
  else counts[table].existing++;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// ---------- ServiceLine ----------
async function seedServiceLines(): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  for (let i = 0; i < serviceNav.length; i++) {
    const s = serviceNav[i]!;
    const slug = s.href.replace(/^\//, ""); // "/vip-service" -> "vip-service"
    const existing = await db.orm.public.ServiceLine
      .select("id")
      .where({ slug })
      .first();
    const cat = categories[i];
    if (existing) {
      map[slug] = existing.id;
      // Keep the rail badge in sync with the static copy.
      if (cat?.badge) {
        await db.orm.public.ServiceLine
          .where({ id: existing.id })
          .update({ badge: cat.badge });
      }
      bump("ServiceLine", false);
      continue;
    }
    const created = await db.orm.public.ServiceLine.create({
      id: crypto.randomUUID(),
      slug,
      label: s.label,
      short: s.short,
      badge: cat?.badge ?? null,
      tone: cat?.tone ?? s.tone,
      sortOrder: i,
    });
    map[slug] = created.id;
    bump("ServiceLine", true);
  }
  return map;
}

// ---------- ServiceType ----------
type TypeSpec = { slug: string; name: string };
const serviceTypesByLine: Record<string, TypeSpec[]> = {
  "vip-service": [
    { slug: "meet-greet", name: "Meet & Greet" },
    { slug: "fast-track", name: "Fast Track" },
    { slug: "lounge", name: "Lounge" },
    { slug: "porter", name: "Porter" },
  ],
  transport: [
    { slug: "sedan", name: "Sedan" },
    { slug: "suv", name: "SUV" },
    { slug: "van", name: "Van" },
    { slug: "limousine", name: "Limousine" },
  ],
  evoa: [
    { slug: "tourist", name: "Tourist" },
    { slug: "business", name: "Business" },
    { slug: "express", name: "Express" },
    { slug: "transit", name: "Transit" },
  ],
  // tour: none (tabs are destinations)
};

async function seedServiceTypes(
  lineIds: Record<string, string>
): Promise<Record<string, string>> {
  // key = "<lineSlug>:<typeSlug>"
  const map: Record<string, string> = {};
  for (const [lineSlug, types] of Object.entries(serviceTypesByLine)) {
    const lineId = lineIds[lineSlug];
    if (!lineId) continue;
    for (let i = 0; i < types.length; i++) {
      const t = types[i]!;
      const existing = await db.orm.public.ServiceType
        .select("id")
        .where({ lineId, slug: t.slug })
        .first();
      if (existing) {
        map[`${lineSlug}:${t.slug}`] = existing.id;
        bump("ServiceType", false);
        continue;
      }
      const created = await db.orm.public.ServiceType.create({
        id: crypto.randomUUID(),
        lineId,
        slug: t.slug,
        name: t.name,
        sortOrder: i,
      });
      map[`${lineSlug}:${t.slug}`] = created.id;
      bump("ServiceType", true);
    }
  }
  return map;
}

// ---------- Airport ----------
// Parsed from vipServices[].airport strings ("Soekarno-Hatta (CGK)").
// City entries (kind=city) are listed in the brief.
type AirportRow = { kind: "airport" | "city"; iataCode: string | null; name: string; city: string; country?: string };

const parsedAirports: AirportRow[] = [
  { kind: "airport", iataCode: "CGK", name: "Soekarno-Hatta", city: "Jakarta" },
  { kind: "airport", iataCode: "DPS", name: "Ngurah Rai", city: "Bali" },
  { kind: "airport", iataCode: "SUB", name: "Juanda", city: "Surabaya" },
  { kind: "airport", iataCode: "KNO", name: "Kualanamu", city: "Medan" },
];
const cityAirports: AirportRow[] = [
  { kind: "city", iataCode: null, name: "Bali", city: "Bali" },
  { kind: "city", iataCode: null, name: "Labuan Bajo", city: "Labuan Bajo" },
  { kind: "city", iataCode: null, name: "Yogyakarta", city: "Yogyakarta" },
  { kind: "city", iataCode: null, name: "Lombok", city: "Lombok" },
  { kind: "city", iataCode: null, name: "East Java", city: "East Java" },
  { kind: "city", iataCode: null, name: "West Papua", city: "West Papua" },
  { kind: "city", iataCode: null, name: "Jakarta", city: "Jakarta" },
  { kind: "city", iataCode: null, name: "Malang", city: "Malang" },
];

async function seedAirports(): Promise<{
  byIata: Record<string, string>;
  byCity: Record<string, string>;
  allIds: string[];
}> {
  const byIata: Record<string, string> = {};
  const byCity: Record<string, string> = {};
  const all: AirportRow[] = [...parsedAirports, ...cityAirports];
  for (const a of all) {
    const existing = a.iataCode
      ? await db.orm.public.Airport.select("id").where({ iataCode: a.iataCode }).first()
      : await db.orm.public.Airport
          .select("id")
          .where((f) => f.kind.eq("city"))
          .where({ city: a.city })
          .first();
    if (existing) {
      if (a.iataCode) byIata[a.iataCode] = existing.id;
      byCity[a.city] = existing.id;
      bump("Airport", false);
      continue;
    }
    const created = await db.orm.public.Airport.create({
      id: crypto.randomUUID(),
      kind: a.kind,
      iataCode: a.iataCode,
      name: a.name,
      city: a.city,
      country: a.country ?? "Indonesia",
    });
    if (a.iataCode) byIata[a.iataCode] = created.id;
    byCity[a.city] = created.id;
    bump("Airport", true);
  }
  return { byIata, byCity, allIds: Object.values(byIata).concat(Object.values(byCity).filter((id) => !Object.values(byIata).includes(id))) };
}

// ---------- Product ----------
function matchVipServiceType(title: string): string | null {
  const t = title.toLowerCase();
  if (t.includes("meet") || t.includes("greet") || t.includes("family")) return "meet-greet";
  if (t.includes("fast track")) return "fast-track";
  if (t.includes("lounge")) return "lounge";
  if (t.includes("porter") || t.includes("baggage")) return "porter";
  if (t.includes("buggy") || t.includes("terminal")) return "porter";
  return null;
}

function matchTransportServiceType(category: string, model: string): string | null {
  const m = model.toLowerCase();
  if (m.includes("sedan")) return "sedan";
  if (m.includes("suv")) return "suv";
  if (m.includes("van")) return "van";
  if (m.includes("limousine")) return "limousine";
  // "By the Hour" (City Hourly Hire) — no matching tab
  return null;
}

function matchEvoaServiceType(name: string): string | null {
  const n = name.toLowerCase();
  if (n.includes("tourist") || n.includes("extendable")) return "tourist";
  if (n.includes("business")) return "business";
  if (n.includes("express")) return "express";
  if (n.includes("transit")) return "transit";
  return null;
}

function parseVipAirportIata(airport: string): string | null {
  const m = airport.match(/\(([A-Z]{3})\)/);
  return m ? m[1] : null;
}

function matchVipAirportId(airport: string, byIata: Record<string, string>): string | null {
  const iata = parseVipAirportIata(airport);
  return iata ? byIata[iata] ?? null : null;
}

async function seedProducts(
  lineIds: Record<string, string>,
  typeIds: Record<string, string>,
  airportByIata: Record<string, string>,
  airportByCity: Record<string, string>
): Promise<Record<string, string>> {
  // key = slug -> id
  const map: Record<string, string> = {};
  const vipLineId = lineIds["vip-service"]!;
  const transportLineId = lineIds["transport"]!;
  const tourLineId = lineIds["tour-package"]!;
  const evoaLineId = lineIds["evoa"]!;

  // --- VIP products
  for (const v of vipServices) {
    const slug = v.slug;
    const existing = await db.orm.public.Product.select("id").where({ slug }).first();
    if (existing) {
      map[slug] = existing.id;
      bump("Product", false);
      continue;
    }
    const typeSlug = matchVipServiceType(v.title);
    const serviceTypeId = typeSlug ? typeIds[`vip-service:${typeSlug}`] ?? null : null;
    const airportId = matchVipAirportId(v.airport, airportByIata);
    const direction = /arrival|meet|greet|track|lounge|porter|baggage|buggy|family/i.test(v.title)
      ? "arrival"
      : "both";
    const created = await db.orm.public.Product.create({
      id: crypto.randomUUID(),
      slug,
      lineId: vipLineId,
      serviceTypeId,
      airportId,
      title: v.title,
      description: v.desc,
      direction,
      leadTimeHours: 3,
      tone: v.tone,
      ribbon: v.ribbon ?? null,
      fromPriceUsdCents: v.priceNet * 100,
    });
    map[slug] = created.id;
    bump("Product", true);
  }

  // --- Transport products
  for (const t of transports) {
    const slug = t.slug;
    const existing = await db.orm.public.Product.select("id").where({ slug }).first();
    if (existing) {
      map[slug] = existing.id;
      bump("Product", false);
      continue;
    }
    const typeSlug = matchTransportServiceType(t.category, t.model);
    const serviceTypeId = typeSlug ? typeIds[`transport:${typeSlug}`] ?? null : null;
    const created = await db.orm.public.Product.create({
      id: crypto.randomUUID(),
      slug,
      lineId: transportLineId,
      serviceTypeId,
      title: t.model,
      description: `${t.category} · ${t.seats} seats · ${t.bags} bags`,
      direction: "both",
      tone: t.tone,
      ribbon: t.ribbon ?? null,
      fromPriceUsdCents: t.priceNet * 100,
    });
    map[slug] = created.id;
    bump("Product", true);
  }

  // --- Tour products
  for (const t of tours) {
    const slug = t.slug;
    const existing = await db.orm.public.Product.select("id").where({ slug }).first();
    if (existing) {
      map[slug] = existing.id;
      bump("Product", false);
      continue;
    }
    const airportId = airportByCity[t.location] ?? null;
    const created = await db.orm.public.Product.create({
      id: crypto.randomUUID(),
      slug,
      lineId: tourLineId,
      airportId,
      title: t.title,
      description: `${t.location} · ${t.duration}`,
      direction: "both",
      leadTimeDays: 2,
      tone: t.tone,
      ribbon: t.ribbon ?? null,
      rating: t.rating,
      reviews: t.reviews,
      durationLabel: t.duration,
      fromPriceUsdCents: t.priceNet * 100,
    });
    map[slug] = created.id;
    bump("Product", true);
  }

  // --- eVOA products
  for (const e of evoaPlans) {
    const slug = e.slug;
    const existing = await db.orm.public.Product.select("id").where({ slug }).first();
    if (existing) {
      map[slug] = existing.id;
      bump("Product", false);
      continue;
    }
    const typeSlug = matchEvoaServiceType(e.name);
    const serviceTypeId = typeSlug ? typeIds[`evoa:${typeSlug}`] ?? null : null;
    const created = await db.orm.public.Product.create({
      id: crypto.randomUUID(),
      slug,
      lineId: evoaLineId,
      serviceTypeId,
      title: e.name,
      description: `${e.stay} · ${e.processing} processing`,
      direction: "both",
      durationLabel: e.stay,
      tone: e.tone,
      ribbon: e.ribbon ?? null,
      fromPriceUsdCents: e.priceNet * 100,
    });
    map[slug] = created.id;
    bump("Product", true);
  }

  // --- City variants: duplicate Executive Sedan and Luxury Van for Bali & Jakarta
  const cityVariantSpecs: { baseSlug: string; city: string; priceFactor: number; suffix: string }[] = [
    { baseSlug: "executive-sedan", city: "Bali", priceFactor: 1.1, suffix: "bali" },
    { baseSlug: "executive-sedan", city: "Jakarta", priceFactor: 0.9, suffix: "jakarta" },
    { baseSlug: "luxury-van", city: "Bali", priceFactor: 1.1, suffix: "bali" },
    { baseSlug: "luxury-van", city: "Jakarta", priceFactor: 0.9, suffix: "jakarta" },
  ];
  for (const spec of cityVariantSpecs) {
    const slug = `${spec.baseSlug}-${spec.suffix}`;
    const existing = await db.orm.public.Product.select("id", "title", "fromPriceUsdCents").where({ slug }).first();
    if (existing) {
      map[slug] = existing.id;
      bump("Product", false);
      continue;
    }
    const base = transports.find((t) => t.slug === spec.baseSlug)!;
    const typeSlug = matchTransportServiceType(base.category, base.model);
    const serviceTypeId = typeSlug ? typeIds[`transport:${typeSlug}`] ?? null : null;
    const airportId = airportByCity[spec.city] ?? null;
    const newPrice = Math.round(base.priceNet * spec.priceFactor);
    const title = `${base.model} · ${spec.city}`;
    const created = await db.orm.public.Product.create({
      id: crypto.randomUUID(),
      slug,
      lineId: transportLineId,
      serviceTypeId,
      airportId,
      title,
      description: `${base.category} · ${spec.city} · ${base.seats} seats`,
      direction: "both",
      tone: base.tone,
      fromPriceUsdCents: newPrice * 100,
    });
    map[slug] = created.id;
    bump("Product", true);
  }

  // --- Add-on products
  const addOnSpecs = [
    { slug: "evoa-registration", title: "eVOA Registration Assistance", unitUsdCents: 3575, label: "Per applicant" },
    { slug: "travel-insurance", title: "Travel Insurance", unitUsdCents: 2500, label: "Per policy" },
  ];
  for (const a of addOnSpecs) {
    const existing = await db.orm.public.Product.select("id").where({ slug: a.slug }).first();
    if (existing) {
      map[a.slug] = existing.id;
      bump("Product", false);
      continue;
    }
    const created = await db.orm.public.Product.create({
      id: crypto.randomUUID(),
      slug: a.slug,
      lineId: evoaLineId,
      title: a.title,
      isAddOn: true,
      fromPriceUsdCents: a.unitUsdCents,
    });
    map[a.slug] = created.id;
    bump("Product", true);
  }

  return map;
}

// ---------- ProductPackage ----------
async function seedProductPackages(productIds: Record<string, string>) {
  // Helper to find-or-create a package by (productId, label)
  async function upsertPkg(args: {
    productId: string;
    label: string;
    unitKind?: string;
    adultUsdCents?: number | null;
    childUsdCents?: number | null;
    infantUsdCents?: number | null;
    unitUsdCents?: number | null;
    durationHours?: number | null;
    extraHourUsdCents?: number | null;
    sortOrder?: number;
  }) {
    const existing = await db.orm.public.ProductPackage
      .select("id")
      .where({ productId: args.productId, label: args.label })
      .first();
    if (existing) {
      bump("ProductPackage", false);
      return existing.id;
    }
    const created = await db.orm.public.ProductPackage.create({
      id: crypto.randomUUID(),
      productId: args.productId,
      label: args.label,
      unitKind: args.unitKind ?? "per_pax",
      adultUsdCents: args.adultUsdCents ?? null,
      childUsdCents: args.childUsdCents ?? null,
      infantUsdCents: args.infantUsdCents ?? null,
      unitUsdCents: args.unitUsdCents ?? null,
      durationHours: args.durationHours ?? null,
      extraHourUsdCents: args.extraHourUsdCents ?? null,
      sortOrder: args.sortOrder ?? 0,
    });
    bump("ProductPackage", true);
    return created.id;
  }

  // VIP: per_pax Standard (adult = child = priceNet*100)
  for (const v of vipServices) {
    const pid = productIds[v.slug];
    if (!pid) continue;
    await upsertPkg({
      productId: pid,
      label: "Standard",
      unitKind: "per_pax",
      adultUsdCents: v.priceNet * 100,
      childUsdCents: v.priceNet * 100,
    });
  }

  // Tour: per_pax Standard
  for (const t of tours) {
    const pid = productIds[t.slug];
    if (!pid) continue;
    await upsertPkg({
      productId: pid,
      label: "Standard",
      unitKind: "per_pax",
      adultUsdCents: t.priceNet * 100,
      childUsdCents: t.priceNet * 100,
    });
  }

  // Transport: per_unit "Point-to-point · with driver" (except City Hourly Hire)
  for (const t of transports) {
    const pid = productIds[t.slug];
    if (!pid) continue;
    if (t.slug === "city-hourly-hire") {
      // Two duration tiers
      await upsertPkg({
        productId: pid,
        label: "6 hours",
        unitKind: "per_unit",
        unitUsdCents: 1925,
        durationHours: 6,
        extraHourUsdCents: 330,
        sortOrder: 0,
      });
      await upsertPkg({
        productId: pid,
        label: "10 hours",
        unitKind: "per_unit",
        unitUsdCents: 3300,
        durationHours: 10,
        extraHourUsdCents: 330,
        sortOrder: 1,
      });
    } else {
      await upsertPkg({
        productId: pid,
        label: "Point-to-point · with driver",
        unitKind: "per_unit",
        unitUsdCents: t.priceNet * 100,
      });
    }
  }

  // City variants also get "Point-to-point · with driver"
  for (const spec of [
    { baseSlug: "executive-sedan", suffix: "bali", factor: 1.1 },
    { baseSlug: "executive-sedan", suffix: "jakarta", factor: 0.9 },
    { baseSlug: "luxury-van", suffix: "bali", factor: 1.1 },
    { baseSlug: "luxury-van", suffix: "jakarta", factor: 0.9 },
  ] as const) {
    const pid = productIds[`${spec.baseSlug}-${spec.suffix}`];
    if (!pid) continue;
    const base = transports.find((t) => t.slug === spec.baseSlug)!;
    await upsertPkg({
      productId: pid,
      label: "Point-to-point · with driver",
      unitKind: "per_unit",
      unitUsdCents: Math.round(base.priceNet * spec.factor) * 100,
    });
  }

  // eVOA: per_unit, label = stay
  for (const e of evoaPlans) {
    const pid = productIds[e.slug];
    if (!pid) continue;
    await upsertPkg({
      productId: pid,
      label: e.stay,
      unitKind: "per_unit",
      unitUsdCents: e.priceNet * 100,
    });
  }

  // Add-on products
  await upsertPkg({
    productId: productIds["evoa-registration"]!,
    label: "Per applicant",
    unitKind: "per_unit",
    unitUsdCents: 3575,
  });
  await upsertPkg({
    productId: productIds["travel-insurance"]!,
    label: "Per policy",
    unitKind: "per_unit",
    unitUsdCents: 2500,
  });
}

// ---------- ProductAddOn ----------
async function seedProductAddOns(productIds: Record<string, string>) {
  async function link(productId: string, addOnId: string, sortOrder: number) {
    const existing = await db.orm.public.ProductAddOn
      .select("id")
      .where({ productId, addOnId })
      .first();
    if (existing) {
      bump("ProductAddOn", false);
      return;
    }
    await db.orm.public.ProductAddOn.create({
      id: crypto.randomUUID(),
      productId,
      addOnId,
      sortOrder,
    });
    bump("ProductAddOn", true);
  }

  const evoaReg = productIds["evoa-registration"]!;
  const insurance = productIds["travel-insurance"]!;

  // evoa-registration -> every VIP product
  for (const v of vipServices) {
    const pid = productIds[v.slug];
    if (!pid) continue;
    await link(pid, evoaReg, 0);
  }

  // travel-insurance -> every tour & transport product (incl. city variants)
  for (const t of tours) {
    const pid = productIds[t.slug];
    if (!pid) continue;
    await link(pid, insurance, 0);
  }
  for (const t of transports) {
    const pid = productIds[t.slug];
    if (!pid) continue;
    await link(pid, insurance, 0);
  }
  for (const spec of [
    "executive-sedan-bali",
    "executive-sedan-jakarta",
    "luxury-van-bali",
    "luxury-van-jakarta",
  ]) {
    const pid = productIds[spec];
    if (!pid) continue;
    await link(pid, insurance, 0);
  }
}

// ---------- Amenity + ProductAmenity ----------
async function seedAmenities(productIds: Record<string, string>) {
  const labels = ["With Driver", "AC", "Audio", "Petrol", "Baggage"];
  const amenityIds: Record<string, string> = {};

  for (const label of labels) {
    const existing = await db.orm.public.Amenity.select("id").where({ label }).first();
    if (existing) {
      amenityIds[label] = existing.id;
      bump("Amenity", false);
      continue;
    }
    const created = await db.orm.public.Amenity.create({
      id: crypto.randomUUID(),
      label,
    });
    amenityIds[label] = created.id;
    bump("Amenity", true);
  }

  // Link to all transport products (incl. city variants)
  const transportSlugs = [
    ...transports.map((t) => t.slug),
    "executive-sedan-bali",
    "executive-sedan-jakarta",
    "luxury-van-bali",
    "luxury-van-jakarta",
  ];
  for (const slug of transportSlugs) {
    const pid = productIds[slug];
    if (!pid) continue;
    for (const label of labels) {
      const amenityId = amenityIds[label]!;
      const existing = await db.orm.public.ProductAmenity
        .select("id")
        .where({ productId: pid, amenityId })
        .first();
      if (existing) {
        bump("ProductAmenity", false);
        continue;
      }
      await db.orm.public.ProductAmenity.create({
        id: crypto.randomUUID(),
        productId: pid,
        amenityId,
      });
      bump("ProductAmenity", true);
    }
  }
}

// ---------- PriceTier ----------
async function seedPriceTiers(lineIds: Record<string, string>) {
  type TierSpec = { label: string; maxUsdCents: number; sortOrder: number };
  const tiersByLine: Record<string, TierSpec[]> = {
    "vip-service": [
      { label: "Up to $50", maxUsdCents: 5000, sortOrder: 0 },
      { label: "Up to $100", maxUsdCents: 10000, sortOrder: 1 },
      { label: "Up to $250", maxUsdCents: 25000, sortOrder: 2 },
    ],
    transport: [
      { label: "Up to $50", maxUsdCents: 5000, sortOrder: 0 },
      { label: "Up to $100", maxUsdCents: 10000, sortOrder: 1 },
      { label: "Up to $200", maxUsdCents: 20000, sortOrder: 2 },
    ],
    "tour-package": [
      { label: "Up to $200", maxUsdCents: 20000, sortOrder: 0 },
      { label: "Up to $500", maxUsdCents: 50000, sortOrder: 1 },
      { label: "Up to $1,200", maxUsdCents: 120000, sortOrder: 2 },
    ],
    evoa: [
      { label: "Up to $50", maxUsdCents: 5000, sortOrder: 0 },
      { label: "Up to $100", maxUsdCents: 10000, sortOrder: 1 },
    ],
  };

  for (const [lineSlug, tiers] of Object.entries(tiersByLine)) {
    const lineId = lineIds[lineSlug];
    if (!lineId) continue;
    for (const t of tiers) {
      const existing = await db.orm.public.PriceTier
        .select("id")
        .where({ lineId, maxUsdCents: t.maxUsdCents })
        .first();
      if (existing) {
        bump("PriceTier", false);
        continue;
      }
      await db.orm.public.PriceTier.create({
        id: crypto.randomUUID(),
        lineId,
        label: t.label,
        maxUsdCents: t.maxUsdCents,
        sortOrder: t.sortOrder,
      });
      bump("PriceTier", true);
    }
  }
}

// ---------- Airline ----------
async function seedAirlines() {
  const rows = [
    { code: "GA", name: "Garuda Indonesia" },
    { code: "IA", name: "Indonesia AirAsia" },
    { code: "QG", name: "Citilink" },
    { code: "JT", name: "Lion Air" },
    { code: "SQ", name: "Singapore Airlines" },
  ];
  for (const r of rows) {
    const existing = await db.orm.public.Airline.select("id").where({ code: r.code }).first();
    if (existing) {
      bump("Airline", false);
      continue;
    }
    await db.orm.public.Airline.create({
      id: crypto.randomUUID(),
      code: r.code,
      name: r.name,
    });
    bump("Airline", true);
  }
}

// ---------- Country ----------
async function seedCountries() {
  const rows = [
    { code: "ID", name: "Indonesia", dialCode: "+62" },
    { code: "SG", name: "Singapore", dialCode: "+65" },
    { code: "MY", name: "Malaysia", dialCode: "+60" },
    { code: "TH", name: "Thailand", dialCode: "+66" },
    { code: "US", name: "United States", dialCode: "+1" },
    { code: "AU", name: "Australia", dialCode: "+61" },
    { code: "JP", name: "Japan", dialCode: "+81" },
    { code: "CN", name: "China", dialCode: "+86" },
  ];
  for (const r of rows) {
    const existing = await db.orm.public.Country.select("id").where({ code: r.code }).first();
    if (existing) {
      bump("Country", false);
      continue;
    }
    await db.orm.public.Country.create({
      id: crypto.randomUUID(),
      code: r.code,
      name: r.name,
      dialCode: r.dialCode,
    });
    bump("Country", true);
  }
}

// ---------- Currency + ExchangeRate ----------
async function seedCurrencies() {
  // USD
  const usdExisting = await db.orm.public.Currency.select("code").where({ code: "USD" }).first();
  if (!usdExisting) {
    await db.orm.public.Currency.create({
      code: "USD",
      name: "US Dollar",
      symbol: "$",
      decimals: 2,
      locale: "en-US",
      isDefault: true,
      sortOrder: 0,
    });
    bump("Currency", true);
  } else {
    bump("Currency", false);
  }

  const idrExisting = await db.orm.public.Currency.select("code").where({ code: "IDR" }).first();
  if (!idrExisting) {
    await db.orm.public.Currency.create({
      code: "IDR",
      name: "Indonesian Rupiah",
      symbol: "Rp",
      decimals: 0,
      locale: "id-ID",
      isDefault: false,
      sortOrder: 1,
    });
    bump("Currency", true);
  } else {
    bump("Currency", false);
  }

  // Exchange rate for IDR
  const rateExisting = await db.orm.public.ExchangeRate.select("code").where({ code: "IDR" }).first();
  if (!rateExisting) {
    await db.orm.public.ExchangeRate.create({
      code: "IDR",
      ratePerUsd: 16500,
      rateDate: todayISO(),
    });
    bump("ExchangeRate", true);
  } else {
    bump("ExchangeRate", false);
  }
}

// ---------- LoyaltyLevel ----------
const loyaltyLevels = [
  {
    code: "MEMBER",
    name: "Member",
    minPoints: 0,
    multiplier: 1,
    benefits: ["Akses promo member", "Pembaruan pesanan via WhatsApp"],
    sortOrder: 0,
  },
  {
    code: "SILVER",
    name: "Silver",
    minPoints: 1000,
    multiplier: 1.05,
    benefits: ["Diskon tambahan 2%", "Prioritas customer service"],
    sortOrder: 1,
  },
  {
    code: "GOLD",
    name: "Gold",
    minPoints: 5000,
    multiplier: 1.1,
    benefits: ["Diskon tambahan 5%", "Gratis upgrade kendaraan", "Priority support"],
    sortOrder: 2,
  },
  {
    code: "PLATINUM",
    name: "Platinum",
    minPoints: 15000,
    multiplier: 1.2,
    benefits: [
      "Diskon tambahan 10%",
      "Gratis upgrade kendaraan",
      "Airport meet & greet premium",
      "Priority support 24/7",
    ],
    sortOrder: 3,
  },
];

async function seedLoyaltyLevels() {
  for (const level of loyaltyLevels) {
    const existing = await db.orm.public.LoyaltyLevel.select("id").where({ code: level.code }).first();
    if (existing) {
      await db.orm.public.LoyaltyLevel.where({ id: existing.id }).update({
        name: level.name,
        minPoints: level.minPoints,
        multiplier: level.multiplier,
        benefits: level.benefits as never,
        sortOrder: level.sortOrder,
        active: true,
      });
      bump("LoyaltyLevel", false);
      continue;
    }
    await db.orm.public.LoyaltyLevel.create({
      id: crypto.randomUUID(),
      code: level.code,
      name: level.name,
      minPoints: level.minPoints,
      multiplier: level.multiplier,
      benefits: level.benefits as never,
      sortOrder: level.sortOrder,
      active: true,
    });
    bump("LoyaltyLevel", true);
  }
}

// ---------- main ----------
async function main() {
  console.log("Seeding booking domain…");
  const lineIds = await seedServiceLines();
  const typeIds = await seedServiceTypes(lineIds);
  const airports = await seedAirports();
  const productIds = await seedProducts(lineIds, typeIds, airports.byIata, airports.byCity);
  await seedProductPackages(productIds);
  await seedProductAddOns(productIds);
  await seedAmenities(productIds);
  await seedPriceTiers(lineIds);
  await seedAirlines();
  await seedCountries();
  await seedCurrencies();
  await seedLoyaltyLevels();

  console.log("Seeding content…");
  await seedContent(counts, lineIds);

  console.log("\nCounts (table → created / already-present):");
  for (const [table, c] of Object.entries(counts)) {
    console.log(`  ${table.padEnd(18)} +${c.created}   (had ${c.existing})`);
  }
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.close();
  });
