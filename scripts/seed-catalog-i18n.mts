#!/usr/bin/env node --experimental-strip-types
// Idempotent Indonesian copy seed for the catalog tables (catalog_i18n).
//
// Fills the nullable `*Id` columns added by the catalog_i18n migration on
// Product / ServiceType / Airport / ProductPackage. Rows are matched by
// their natural key (slug / iataCode / name / label) and ONLY columns that
// are still null are written — operator edits in the admin area survive
// re-runs. English columns are never touched.
//
// Run:  npm run db:seed-i18n

import "dotenv/config";
import { db } from "../src/prisma/db.ts";

const counts: Record<string, { updated: number; skipped: number }> = {};
function bump(table: string, updated: boolean) {
  counts[table] ??= { updated: 0, skipped: 0 };
  if (updated) counts[table].updated++;
  else counts[table].skipped++;
}

// ---------- shared vocabulary ----------

/** Ribbon copy (EN → ID). */
const RIBBON_ID: Record<string, string> = {
  "Best seller": "Terlaris",
  Popular: "Populer",
  New: "Baru",
  VIP: "VIP",
  "Most popular": "Terpopuler",
  Fastest: "Tercepat",
};

/** Place labels that differ between EN and ID. Proper nouns stay as-is. */
const PLACE_ID: Record<string, string> = {
  "East Java": "Jawa Timur",
  "West Papua": "Papua Barat",
  "Kuta Beach": "Pantai Kuta",
  "Pink Beach": "Pantai Pink",
};

/** "3D2N" → "3H2M" (hari / malam). */
function durationId(label: string): string {
  return label.replace(/(\d+)D(\d+)N/g, "$1H$2M");
}

/** "30 days" → "30 hari", "30 + 30 days" → "30 + 30 hari". */
function daysId(label: string): string {
  return label.replace(/(\d+) days/g, "$1 hari");
}

/** Token-level translation of the short transport spec descriptions. */
function specDescriptionId(desc: string): string {
  return desc
    .replace(/Private Transfer/g, "Transfer Privat")
    .replace(/Group Transfer/g, "Transfer Grup")
    .replace(/Chauffeur Service/g, "Layanan Sopir")
    .replace(/By the Hour/g, "Per Jam")
    .replace(/(\d+) seats/g, "$1 kursi")
    .replace(/(\d+) bags/g, "$1 bagasi")
    .replace(/(\d+) hours processing/g, "proses $1 jam")
    .replace(/East Java/g, "Jawa Timur")
    .replace(/West Papua/g, "Papua Barat");
}

// ---------- ServiceType ----------

/** ServiceType.nameId keyed by slug. Terms used verbatim in Indonesian
 *  airport / travel vocabulary (Meet & Greet, Fast Track, Lounge, …) keep
 *  their form — the ID column simply marks them as valid Indonesian. */
const SERVICE_TYPE_ID: Record<string, string> = {
  "meet-greet": "Meet & Greet",
  "fast-track": "Fast Track",
  lounge: "Lounge",
  porter: "Porter",
  sedan: "Sedan",
  suv: "SUV",
  van: "Van",
  limousine: "Limusin",
  "hourly-hire": "Sewa Per Jam",
  mpv: "MPV",
  electric: "Mobil Listrik",
  hatchback: "Hatchback",
  luxury: "Mewah",
  tourist: "Turis",
  business: "Bisnis",
  express: "Ekspres",
  transit: "Transit",
  bali: "Bali",
  "labuan-bajo": "Labuan Bajo",
  yogyakarta: "Yogyakarta",
  lombok: "Lombok",
  "east-java": "Jawa Timur",
  "west-papua": "Papua Barat",
};

async function seedServiceTypes() {
  const rows = await db.orm.public.ServiceType
    .select("id", "slug", "name", "nameId")
    .all();
  for (const row of rows) {
    if (row.nameId != null) {
      bump("ServiceType", false);
      continue;
    }
    const nameId = SERVICE_TYPE_ID[row.slug] ?? row.name;
    await db.orm.public.ServiceType.where({ id: row.id }).update({ nameId });
    bump("ServiceType", true);
  }
}

// ---------- Airport (places) ----------

async function seedPlaces() {
  const rows = await db.orm.public.Airport
    .select("id", "name", "nameId", "city", "cityId")
    .all();
  for (const row of rows) {
    const patch: { nameId?: string; cityId?: string } = {};
    // Airport / area / destination names are proper nouns — the Indonesian
    // label is the name itself, except the few translated spots.
    if (row.nameId == null) patch.nameId = PLACE_ID[row.name] ?? row.name;
    if (row.cityId == null) patch.cityId = PLACE_ID[row.city] ?? row.city;
    if (Object.keys(patch).length === 0) {
      bump("Airport", false);
      continue;
    }
    await db.orm.public.Airport.where({ id: row.id }).update(patch);
    bump("Airport", true);
  }
}

// ---------- Product ----------

/** Explicit title / description translations, keyed by product slug. */
const PRODUCT_ID: Record<string, { titleId: string; descriptionId?: string }> = {
  // VIP service line
  "meet-greet": {
    titleId: "Meet & Greet",
    descriptionId: "Pendamping pribadi menemani kamu dari pintu kedatangan hingga ke gate.",
  },
  "fast-track-immigration": {
    titleId: "Fast Track Imigrasi",
    descriptionId: "Lewati antrean di imigrasi dan bea cukai.",
  },
  "premium-lounge-access": {
    titleId: "Akses Lounge Premium",
    descriptionId: "Bersantai di lounge privat sebelum keberangkatan.",
  },
  "baggage-porter-assistance": {
    titleId: "Bantuan Bagasi & Porter",
    descriptionId: "Bepergian tanpa repot dengan bantuan porter khusus.",
  },
  "vip-terminal-buggy": {
    titleId: "Terminal VIP & Buggy",
    descriptionId: "Transfer buggy privat di dalam terminal.",
  },
  "family-vip-package": {
    titleId: "Paket VIP Keluarga",
    descriptionId: "Meet & greet plus lounge untuk seluruh keluarga.",
  },
  // Transport line
  "executive-sedan": {
    titleId: "Sedan Eksekutif",
    descriptionId: "Transfer Privat · 3 kursi · 2 bagasi",
  },
  "premium-suv": {
    titleId: "SUV Premium",
    descriptionId: "Transfer Privat · 5 kursi · 4 bagasi",
  },
  "luxury-van": {
    titleId: "Van Mewah",
    descriptionId: "Transfer Grup · 9 kursi · 8 bagasi",
  },
  "first-class-limousine": {
    titleId: "Limusin Kelas Satu",
    descriptionId: "Layanan Sopir · 3 kursi · 3 bagasi",
  },
  "city-hourly-hire": {
    titleId: "Sewa Mobil Per Jam Kota",
    descriptionId: "Per Jam · 4 kursi · 2 bagasi",
  },
  "executive-sedan-bali": {
    titleId: "Sedan Eksekutif · Bali",
    descriptionId: "Transfer Privat · Bali · 3 kursi",
  },
  "executive-sedan-jakarta": {
    titleId: "Sedan Eksekutif · Jakarta",
    descriptionId: "Transfer Privat · Jakarta · 3 kursi",
  },
  "luxury-van-bali": {
    titleId: "Van Mewah · Bali",
    descriptionId: "Transfer Grup · Bali · 9 kursi",
  },
  "luxury-van-jakarta": {
    titleId: "Van Mewah · Jakarta",
    descriptionId: "Transfer Grup · Jakarta · 9 kursi",
  },
  // Tour line
  "bali-highlights": {
    titleId: "Jelajah Bali",
    descriptionId: "Bali · 3H2M",
  },
  "komodo-island-sailing": {
    titleId: "Berlayar ke Pulau Komodo",
    descriptionId: "Labuan Bajo · 4H3M",
  },
  "yogyakarta-heritage": {
    titleId: "Warisan Budaya Yogyakarta",
    descriptionId: "Yogyakarta · 3H2M",
  },
  "lombok-gili-escape": {
    titleId: "Liburan Lombok & Gili",
    descriptionId: "Lombok · 4H3M",
  },
  "bromo-sunrise-tour": {
    titleId: "Tur Sunrise Bromo",
    descriptionId: "Jawa Timur · 2H1M",
  },
  "raja-ampat-explorer": {
    titleId: "Jelajah Raja Ampat",
    descriptionId: "Papua Barat · 5H4M",
  },
  // eVOA line
  "tourist-evoa": {
    titleId: "eVOA Turis",
    descriptionId: "30 hari · proses 24 jam",
  },
  "extendable-evoa": {
    titleId: "eVOA Perpanjangan",
    descriptionId: "30 + 30 hari · proses 24 jam",
  },
  "business-evoa": {
    titleId: "eVOA Bisnis",
    descriptionId: "60 hari · proses 48 jam",
  },
  "express-evoa": {
    titleId: "eVOA Ekspres",
    descriptionId: "30 hari · proses 4 jam",
  },
  "transit-evoa": {
    titleId: "eVOA Transit",
    descriptionId: "7 hari · proses 24 jam",
  },
  // Add-ons
  "evoa-registration": { titleId: "Bantuan Pendaftaran eVOA" },
  "travel-insurance": { titleId: "Asuransi Perjalanan" },
};

async function seedProducts() {
  const rows = await db.orm.public.Product
    .select(
      "id",
      "slug",
      "title",
      "titleId",
      "description",
      "descriptionId",
      "ribbon",
      "ribbonId",
      "durationLabel",
      "durationLabelId"
    )
    .all();
  for (const row of rows) {
    const known = PRODUCT_ID[row.slug];
    const patch: {
      titleId?: string;
      descriptionId?: string;
      ribbonId?: string;
      durationLabelId?: string;
    } = {};
    if (row.titleId == null) {
      patch.titleId = known?.titleId ?? row.title;
    }
    if (row.descriptionId == null && row.description) {
      // The rental-car seed already writes Indonesian HTML copy into the
      // base column — carry it over verbatim; short spec strings get the
      // token translation.
      patch.descriptionId =
        known?.descriptionId ??
        (row.description.includes("<")
          ? row.description
          : daysId(durationId(specDescriptionId(row.description))));
    }
    if (row.ribbonId == null && row.ribbon) {
      patch.ribbonId = RIBBON_ID[row.ribbon] ?? row.ribbon;
    }
    if (row.durationLabelId == null && row.durationLabel) {
      patch.durationLabelId = daysId(durationId(row.durationLabel));
    }
    if (Object.keys(patch).length === 0) {
      bump("Product", false);
      continue;
    }
    await db.orm.public.Product.where({ id: row.id }).update(patch);
    bump("Product", true);
  }
}

// ---------- ProductPackage ----------

/** Package labels (EN → ID). Labels already written in Indonesian by the
 *  transport seed (Mobil & Sopir Saja, Lepas Kunci, All-in Area …) pass
 *  through unchanged. */
const PACKAGE_LABEL_ID: Record<string, string> = {
  Standard: "Standar",
  "Point-to-point · with driver": "Antar-jemput · dengan sopir",
  "6 hours": "6 jam",
  "10 hours": "10 jam",
  "Per applicant": "Per pemohon",
  "Per policy": "Per polis",
};

async function seedPackages() {
  const rows = await db.orm.public.ProductPackage
    .select("id", "label", "labelId", "description", "descriptionId")
    .all();
  for (const row of rows) {
    const patch: { labelId?: string; descriptionId?: string } = {};
    if (row.labelId == null) {
      patch.labelId =
        PACKAGE_LABEL_ID[row.label] ?? daysId(durationId(row.label));
    }
    if (row.descriptionId == null && row.description) {
      // The package descriptions in the database are Indonesian already.
      patch.descriptionId = row.description;
    }
    if (Object.keys(patch).length === 0) {
      bump("ProductPackage", false);
      continue;
    }
    await db.orm.public.ProductPackage.where({ id: row.id }).update(patch);
    bump("ProductPackage", true);
  }
}

// ---------- main ----------

async function main() {
  console.log("Seeding Indonesian catalog copy (null ID columns only)…");
  await seedServiceTypes();
  await seedPlaces();
  await seedProducts();
  await seedPackages();

  console.log("\nCounts (table → filled / already had ID copy):");
  for (const [table, c] of Object.entries(counts)) {
    console.log(`  ${table.padEnd(18)} +${c.updated}   (had ${c.skipped})`);
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
