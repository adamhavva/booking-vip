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
    { slug: "hourly-hire", name: "Hourly Hire" },
  ],
  evoa: [
    { slug: "tourist", name: "Tourist" },
    { slug: "business", name: "Business" },
    { slug: "express", name: "Express" },
    { slug: "transit", name: "Transit" },
  ],
  // Tour: the destination is the parent of the tour packages below it.
  "tour-package": [
    { slug: "bali", name: "Bali" },
    { slug: "labuan-bajo", name: "Labuan Bajo" },
    { slug: "yogyakarta", name: "Yogyakarta" },
    { slug: "lombok", name: "Lombok" },
    { slug: "east-java", name: "East Java" },
    { slug: "west-papua", name: "West Papua" },
  ],
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
      level: a.kind,
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

// ---------- Child places (area & destination) ----------
// The places form a hierarchy: a city parents the pick-up areas (transport)
// and the tourist destinations (tour packages) below it.
const childPlaces: {
  kind: "area" | "destination";
  name: string;
  city: string;
  sortOrder: number;
}[] = [
  // Areas — the pick-up / drop-off zones of the transport service.
  { kind: "area", name: "Menteng", city: "Jakarta", sortOrder: 1 },
  { kind: "area", name: "Kemang", city: "Jakarta", sortOrder: 2 },
  { kind: "area", name: "Dago", city: "Bandung", sortOrder: 1 },
  { kind: "area", name: "Riau", city: "Bandung", sortOrder: 2 },
  { kind: "area", name: "Seminyak", city: "Bali", sortOrder: 1 },
  { kind: "area", name: "Canggu", city: "Bali", sortOrder: 2 },
  { kind: "area", name: "Nusa Dua", city: "Bali", sortOrder: 3 },
  { kind: "area", name: "Gubeng", city: "Surabaya", sortOrder: 1 },
  { kind: "area", name: "Malang", city: "Malang", sortOrder: 1 },

  // Destinations — the tourist destinations of the tour packages.
  { kind: "destination", name: "Ubud", city: "Bali", sortOrder: 1 },
  { kind: "destination", name: "Nusa Penida", city: "Bali", sortOrder: 2 },
  { kind: "destination", name: "Kuta Beach", city: "Bali", sortOrder: 3 },
  { kind: "destination", name: "Komodo", city: "Labuan Bajo", sortOrder: 1 },
  { kind: "destination", name: "Pink Beach", city: "Labuan Bajo", sortOrder: 2 },
  { kind: "destination", name: "Borobudur", city: "Yogyakarta", sortOrder: 1 },
  { kind: "destination", name: "Prambanan", city: "Yogyakarta", sortOrder: 2 },
  { kind: "destination", name: "Gili Trawangan", city: "Lombok", sortOrder: 1 },
  { kind: "destination", name: "Senaru", city: "Lombok", sortOrder: 2 },
  { kind: "destination", name: "Taman Aire", city: "East Java", sortOrder: 1 },
  { kind: "destination", name: "Raja Ampat", city: "West Papua", sortOrder: 1 },
];

async function seedChildPlaces() {
  // The cities that parent the areas and the destinations.
  const cities = [...new Set(childPlaces.map((p) => p.city))];

  for (const city of cities) {
    const existing = await db.orm.public.Airport
      .select("id")
      .where((f) => f.kind.eq("city"))
      .where({ city })
      .first();
    if (existing) {
      bump("Airport", false);
      continue;
    }
    await db.orm.public.Airport.create({
      id: crypto.randomUUID(),
      kind: "city",
      level: "city",
      iataCode: null,
      name: city,
      city,
      country: "Indonesia",
      sortOrder: 100,
    });
    bump("Airport", true);
  }

  for (const place of childPlaces) {
    const parent = await db.orm.public.Airport
      .select("id")
      .where((f) => f.kind.eq("city"))
      .where({ city: place.city })
      .first();
    if (!parent) continue;

    const existing = await db.orm.public.Airport
      .select("id")
      .where((f) => f.kind.eq(place.kind))
      .where({ name: place.name })
      .first();
    if (existing) {
      bump("Airport", false);
      continue;
    }
    await db.orm.public.Airport.create({
      id: crypto.randomUUID(),
      kind: place.kind,
      level: place.kind,
      iataCode: null,
      name: place.name,
      city: place.city,
      country: "Indonesia",
      parentId: parent.id,
      sortOrder: place.sortOrder,
    });
    bump("Airport", true);
  }
}

// ---------- Place hierarchy (region → country → province → city → …) ----------
// Only the famous Indonesian tourist destinations are seeded here — the rest
// of the administrative divisions are added later through the admin area.
// Idempotent: rows are looked up by (kind, name) and only inserted when
// missing; parent links are repaired when they point somewhere else.

type PlaceSpec = {
  kind: "region" | "country" | "province" | "city" | "district" | "village" | "destination";
  name: string;
  /** The city label stored on the row (defaults to the name). */
  city?: string;
  parent?: string;
  sortOrder?: number;
};

const hierarchyPlaces: PlaceSpec[] = [
  // Region → country.
  { kind: "region", name: "Asia Tenggara", sortOrder: 1 },
  { kind: "country", name: "Indonesia", parent: "Asia Tenggara", sortOrder: 1 },

  // Provinces — only the ones that host a famous destination.
  { kind: "province", name: "DKI Jakarta", parent: "Indonesia", sortOrder: 1 },
  { kind: "province", name: "Jawa Barat", parent: "Indonesia", sortOrder: 2 },
  { kind: "province", name: "Jawa Timur", parent: "Indonesia", sortOrder: 3 },
  { kind: "province", name: "DI Yogyakarta", parent: "Indonesia", sortOrder: 4 },
  { kind: "province", name: "Bali", parent: "Indonesia", sortOrder: 5 },
  { kind: "province", name: "Nusa Tenggara Barat", parent: "Indonesia", sortOrder: 6 },
  { kind: "province", name: "Nusa Tenggara Timur", parent: "Indonesia", sortOrder: 7 },
  { kind: "province", name: "Sumatera Utara", parent: "Indonesia", sortOrder: 8 },
  { kind: "province", name: "Papua Barat Daya", parent: "Indonesia", sortOrder: 9 },

  // Kabupaten / kota of the famous spots.
  { kind: "city", name: "Kab. Badung", parent: "Bali", sortOrder: 1 },
  { kind: "city", name: "Kab. Gianyar", parent: "Bali", sortOrder: 2 },
  { kind: "city", name: "Kab. Klungkung", parent: "Bali", sortOrder: 3 },
  { kind: "city", name: "Kab. Karangasem", parent: "Bali", sortOrder: 4 },
  { kind: "city", name: "Kab. Magelang", parent: "DI Yogyakarta", sortOrder: 1 },
  { kind: "city", name: "Kab. Lombok Utara", parent: "Nusa Tenggara Barat", sortOrder: 1 },
  { kind: "city", name: "Kab. Manggarai Barat", parent: "Nusa Tenggara Timur", sortOrder: 1 },
  { kind: "city", name: "Kab. Probolinggo", parent: "Jawa Timur", sortOrder: 1 },
  { kind: "city", name: "Kab. Samosir", parent: "Sumatera Utara", sortOrder: 1 },
  { kind: "city", name: "Kab. Raja Ampat", parent: "Papua Barat Daya", sortOrder: 1 },

  // Kecamatan (districts).
  { kind: "district", name: "Kuta Selatan", parent: "Kab. Badung", sortOrder: 1 },
  { kind: "district", name: "Ubud", parent: "Kab. Gianyar", sortOrder: 1 },
  { kind: "district", name: "Nusa Penida", parent: "Kab. Klungkung", sortOrder: 1 },
  { kind: "district", name: "Borobudur", parent: "Kab. Magelang", sortOrder: 1 },
  { kind: "district", name: "Komodo", parent: "Kab. Manggarai Barat", sortOrder: 1 },
  { kind: "district", name: "Sukapura", parent: "Kab. Probolinggo", sortOrder: 1 },
  { kind: "district", name: "Pangururan", parent: "Kab. Samosir", sortOrder: 1 },

  // Desa / kelurahan — a few famous ones, as the deepest level.
  { kind: "village", name: "Peliatan", parent: "Ubud", sortOrder: 1 },
  { kind: "village", name: "Wanurejo", parent: "Borobudur", sortOrder: 1 },
  { kind: "village", name: "Cemoro Lawang", parent: "Sukapura", sortOrder: 1 },

  // Famous destinations that are not in the base seed yet.
  { kind: "destination", name: "Tanah Lot", parent: "Kab. Badung", sortOrder: 10 },
  { kind: "destination", name: "Pura Uluwatu", parent: "Kuta Selatan", sortOrder: 10 },
  { kind: "destination", name: "Pura Besakih", parent: "Kab. Karangasem", sortOrder: 10 },
  { kind: "destination", name: "Gunung Rinjani", parent: "Kab. Lombok Utara", sortOrder: 10 },
  { kind: "destination", name: "Gunung Bromo", parent: "Kab. Probolinggo", sortOrder: 10 },
  { kind: "destination", name: "Danau Toba", parent: "Kab. Samosir", sortOrder: 10 },
];

/**
 * Existing rows that move under a new parent in the hierarchy. The label
 * (the submitted search value) never changes — only the grouping does.
 */
const hierarchyReparents: { kind: string; name: string; parent: string }[] = [
  // Cities under their province.
  { kind: "city", name: "Jakarta", parent: "DKI Jakarta" },
  { kind: "city", name: "Bandung", parent: "Jawa Barat" },
  { kind: "city", name: "Surabaya", parent: "Jawa Timur" },
  { kind: "city", name: "Malang", parent: "Jawa Timur" },
  { kind: "city", name: "East Java", parent: "Jawa Timur" },
  { kind: "city", name: "Yogyakarta", parent: "DI Yogyakarta" },
  { kind: "city", name: "Bali", parent: "Bali" },
  { kind: "city", name: "Lombok", parent: "Nusa Tenggara Barat" },
  { kind: "city", name: "Labuan Bajo", parent: "Nusa Tenggara Timur" },
  { kind: "city", name: "Medan", parent: "Sumatera Utara" },
  { kind: "city", name: "West Papua", parent: "Papua Barat Daya" },
  // Airports are leaves under their city.
  { kind: "airport", name: "Soekarno-Hatta", parent: "Jakarta" },
  { kind: "airport", name: "Ngurah Rai", parent: "Bali" },
  { kind: "airport", name: "Juanda", parent: "Surabaya" },
  { kind: "airport", name: "Kualanamu", parent: "Medan" },
  // Famous destinations deeper into the tree.
  { kind: "destination", name: "Ubud", parent: "Ubud" },
  { kind: "destination", name: "Nusa Penida", parent: "Nusa Penida" },
  { kind: "destination", name: "Borobudur", parent: "Borobudur" },
  { kind: "destination", name: "Komodo", parent: "Komodo" },
  { kind: "destination", name: "Pink Beach", parent: "Komodo" },
  { kind: "destination", name: "Gili Trawangan", parent: "Kab. Lombok Utara" },
  { kind: "destination", name: "Senaru", parent: "Kab. Lombok Utara" },
  { kind: "destination", name: "Raja Ampat", parent: "Kab. Raja Ampat" },
];

async function seedPlaceHierarchy() {
  const idOf = new Map<string, string>();

  const findPlace = async (kind: string, name: string) =>
    db.orm.public.Airport
      .select("id", "parentId")
      .where((f) => f.kind.eq(kind))
      .where({ name })
      .first();

  // Insert the missing hierarchy rows, parents first (the list is ordered).
  for (const spec of hierarchyPlaces) {
    const existing = await findPlace(spec.kind, spec.name);
    const parentId = spec.parent ? (idOf.get(spec.parent) ?? null) : null;
    if (existing) {
      idOf.set(spec.name, existing.id);
      // Repair the parent link when it points somewhere else.
      if (parentId && existing.parentId !== parentId) {
        await db.orm.public.Airport
          .where({ id: existing.id })
          .update({ parentId });
      }
      bump("Airport", false);
      continue;
    }
    const created = await db.orm.public.Airport.create({
      id: crypto.randomUUID(),
      kind: spec.kind,
      level: spec.kind,
      iataCode: null,
      name: spec.name,
      city: spec.city ?? spec.name,
      country: "Indonesia",
      parentId,
      sortOrder: spec.sortOrder ?? 0,
    });
    idOf.set(spec.name, created.id);
    bump("Airport", true);
  }

  // Re-parent the existing rows (cities, airports, destinations) under the
  // hierarchy. The label never changes, so search / booking keep working.
  for (const move of hierarchyReparents) {
    const row = await findPlace(move.kind, move.name);
    const parentId = idOf.get(move.parent);
    if (!row || !parentId) continue;
    if (row.parentId !== parentId) {
      await db.orm.public.Airport.where({ id: row.id }).update({ parentId });
    }
    bump("Airport", false);
  }

  // Repair the level of rows created before the `level` column existed —
  // they still carry the column default ("city"). The migration backfill
  // covers fresh databases; this covers everything else. Idempotent.
  const stale = await db.orm.public.Airport
    .select("id", "kind")
    .where((f) => f.level.eq("city"))
    .all();
  for (const row of stale) {
    if (row.kind !== "city") {
      await db.orm.public.Airport.where({ id: row.id }).update({ level: row.kind });
    }
  }
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
  // "By the Hour" (City Hourly Hire) — its own parent type.
  if (m.includes("hourly") || category.toLowerCase().includes("by the hour")) {
    return "hourly-hire";
  }
  return null;
}

/**
 * The parent type of a tour package: its destination.
 *
 * The destination is the parent of the tour packages below it — the same
 * parent → child shape the other service lines use.
 */
function matchTourServiceType(location: string): string | null {
  const l = location.toLowerCase().trim();
  const slug = l
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug) return null;
  return tourDestinationSlugs.has(slug) ? slug : null;
}

/** The destinations that exist as a tour parent type. */
const tourDestinationSlugs = new Set([
  "bali",
  "labuan-bajo",
  "yogyakarta",
  "lombok",
  "east-java",
  "west-papua",
]);

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
    const typeSlug = matchTransportServiceType(t.category, t.model);
    const serviceTypeId = typeSlug ? typeIds[`transport:${typeSlug}`] ?? null : null;
    const existing = await db.orm.public.Product.select("id", "serviceTypeId").where({ slug }).first();
    if (existing) {
      // The parent type may have been added later (hourly-hire) — keep the
      // product in sync without touching anything else.
      if (existing.serviceTypeId !== serviceTypeId) {
        await db.orm.public.Product
          .where({ id: existing.id })
          .update({ serviceTypeId });
      }
      map[slug] = existing.id;
      bump("Product", false);
      continue;
    }
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
    const typeSlug = matchTourServiceType(t.location);
    const serviceTypeId = typeSlug ? typeIds[`tour-package:${typeSlug}`] ?? null : null;
    const existing = await db.orm.public.Product.select("id", "serviceTypeId").where({ slug }).first();
    if (existing) {
      if (existing.serviceTypeId !== serviceTypeId) {
        await db.orm.public.Product
          .where({ id: existing.id })
          .update({ serviceTypeId });
      }
      map[slug] = existing.id;
      bump("Product", false);
      continue;
    }
    const airportId = airportByCity[t.location] ?? null;
    const created = await db.orm.public.Product.create({
      id: crypto.randomUUID(),
      slug,
      lineId: tourLineId,
      serviceTypeId,
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

// ---------- Payment methods ----------
// The methods the customer can pick on the payment page. They are grouped by
// the gateway method code, exactly like the marketplace does it — the guest
// picks the concrete option on the gateway page.
const paymentMethods: {
  code: string;
  label: string;
  providerMethodCode: string;
  sortOrder: number;
}[] = [
  {
    code: "BANK_TRANSFER",
    label: "Transfer Bank (Virtual Account) — BCA, Mandiri, BNI, BRI, BSI, Permata",
    providerMethodCode: "BANK_TRANSFER",
    sortOrder: 10,
  },
  {
    code: "CREDIT_CARD",
    label: "Kartu Kredit / Debit — Visa, Mastercard, JCB",
    providerMethodCode: "CREDIT_CARD",
    sortOrder: 20,
  },
  {
    code: "EWALLET",
    label: "E-Wallet — DANA, GoPay, ShopeePay, LinkAja, OVO",
    providerMethodCode: "EWALLET",
    sortOrder: 30,
  },
  {
    code: "QRIS",
    label: "QRIS — scan dengan aplikasi apa pun",
    providerMethodCode: "QRIS",
    sortOrder: 40,
  },
  {
    code: "DIRECT_DEBIT",
    label: "Pembayaran Instan — KlikBCA, OCTO, blu",
    providerMethodCode: "DIRECT_DEBIT",
    sortOrder: 50,
  },
  {
    code: "RETAIL_OUTLET",
    label: "Gerai Retail — Indomaret, Alfamart",
    providerMethodCode: "RETAIL_OUTLET",
    sortOrder: 60,
  },
  {
    code: "PAYLATER",
    label: "Paylater / Cicilan Tanpa Kartu — Kredivo, Akulaku",
    providerMethodCode: "PAYLATER",
    sortOrder: 70,
  },
];

async function seedPaymentMethods() {
  for (const method of paymentMethods) {
    const existing = await db.orm.public.PaymentMethod
      .select("id")
      .where({ code: method.code })
      .first();

    if (existing) {
      await db.orm.public.PaymentMethod.where({ id: existing.id }).update({
        label: method.label,
        provider: "xendit",
        providerMethodCode: method.providerMethodCode,
        providerCurrency: "IDR",
        sortOrder: method.sortOrder,
        active: true,
      });
      bump("PaymentMethod", false);
      continue;
    }

    await db.orm.public.PaymentMethod.create({
      id: crypto.randomUUID(),
      code: method.code,
      label: method.label,
      provider: "xendit",
      providerMethodCode: method.providerMethodCode,
      providerCurrency: "IDR",
      sortOrder: method.sortOrder,
      active: true,
    });
    bump("PaymentMethod", true);
  }
}

// ---------- main ----------
async function main() {
  console.log("Seeding booking domain…");
  const lineIds = await seedServiceLines();
  const typeIds = await seedServiceTypes(lineIds);
  const airports = await seedAirports();
  await seedChildPlaces();
  await seedPlaceHierarchy();
  const productIds = await seedProducts(lineIds, typeIds, airports.byIata, airports.byCity);
  await seedProductPackages(productIds);
  await seedProductAddOns(productIds);
  await seedAmenities(productIds);
  await seedPriceTiers(lineIds);
  await seedAirlines();
  await seedCountries();
  await seedCurrencies();
  await seedLoyaltyLevels();
  await seedPaymentMethods();

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
