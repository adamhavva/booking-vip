#!/usr/bin/env node --experimental-strip-types
// Idempotent seed of the transport rental fleet.
//
// Run:  node --experimental-strip-types scripts/seed-transport.mts
//   (or `npm run db:seed-transport` from repo root)
//
// Re-running is safe: products / packages / reviews / media are looked up by
// their natural key (or a deterministic id) and only inserted when missing.
// Photos are fetched from Wikimedia Commons into public/images/transport/;
// when the network is unavailable the car simply keeps its gradient Thumb.
//
// This script does NOT touch scripts/seed-content.mts or its Setting keys.

import "dotenv/config";
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { db } from "../src/prisma/db.ts";

const IMAGE_DIR = path.join(process.cwd(), "public", "images", "transport");
const USER_AGENT =
  "booking-vip-demo/1.0 (https://example.org/booking-vip; booking-vip@example.org)";
const COMMONS_API =
  "https://commons.wikimedia.org/w/api.php?action=query&generator=search" +
  "&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url|extmetadata|mime" +
  "&iiurlwidth=1200&format=json&gsrsearch=";

type PackageSeed = {
  label: string;
  unitUsdCents: number;
  fromUsdCents: number | null;
  description: string;
  info: { key: string; name: string; excluded?: boolean }[];
  durationHours: number;
};

type CarSeed = {
  slug: string;
  title: string;
  vendor: string;
  typeSlug: string;
  seats: number;
  luggage: number;
  driverOption: "with_driver" | "without_driver";
  transmission: string;
  year: number;
  electric?: boolean;
  tone: string;
  netUsdCents: number;
  imageQuery: string;
  description: string;
  reviews: { user: number; rating: number; body: string }[];
};

const EXCLUDED_BASE = [
  { key: "fuel", name: "Bensin untuk penggunaan mobil", excluded: true },
  { key: "driver_meal", name: "Uang makan sopir senilai IDR 75.000", excluded: true },
];

const INCLUDED_ALLIN = [
  { key: "fuel", name: "Bensin termasuk selama sewa" },
  { key: "driver_meal", name: "Uang makan sopir termasuk" },
  { key: "toll", name: "Tol dan parkir termasuk" },
];

/** The three rental packages of one car — base, all-in area 0, all-in area 2. */
function packagesFor(car: CarSeed): PackageSeed[] {
  const net = car.netUsdCents;
  const withDriver = car.driverOption === "with_driver";
  return [
    {
      label: withDriver ? "Mobil & Sopir Saja" : "Lepas Kunci",
      unitUsdCents: net,
      fromUsdCents: net * 2,
      description: withDriver
        ? "Mobil plus sopir berpengalaman; bensin dan makan sopir dibayar langsung."
        : "Ambil mobilnya sendiri, kembalikan sendiri — tanpa sopir.",
      info: withDriver ? EXCLUDED_BASE : [{ key: "fuel", name: "Bensin untuk penggunaan mobil", excluded: true }],
      durationHours: 12,
    },
    {
      label: "All-in Area 0",
      unitUsdCents: Math.round(net * 1.8),
      fromUsdCents: net * 4,
      description: "Dalam kota: bensin, tol, parkir, dan makan sopir sudah termasuk.",
      info: INCLUDED_ALLIN,
      durationHours: 12,
    },
    {
      label: "All-in Area 2",
      unitUsdCents: Math.round(net * 2.6),
      fromUsdCents: Math.round(net * 3.4),
      description: "Luar kota / area jauh: semua biaya perjalanan sudah termasuk.",
      info: INCLUDED_ALLIN,
      durationHours: 12,
    },
  ];
}

const CARS: CarSeed[] = [
  {
    slug: "toyota-grand-new-avanza",
    title: "Toyota Grand New Avanza",
    vendor: "LBV Transport",
    typeSlug: "mpv",
    seats: 6,
    luggage: 2,
    driverOption: "with_driver",
    transmission: "Manual",
    year: 2021,
    tone: "from-slate-300 to-slate-500",
    netUsdCents: 1350,
    imageQuery: "Toyota Avanza",
    description:
      "<p>MPV sejuta umat yang nyaman untuk keluarga maupun perjalanan bisnis. Kabin lega, AC dingin, dan sopir yang hafal jalan.</p><ul><li>AC double blower</li><li>Audio Bluetooth</li><li>Bagasi untuk 2 koper besar</li></ul>",
    reviews: [
      { user: 1, rating: 5, body: "Mobil bersih, sopirnya ramah dan tau jalan tercepat." },
      { user: 2, rating: 4, body: "AC dingin, mobil wangi. Recommended untuk keluarga." },
    ],
  },
  {
    slug: "toyota-all-new-avanza-2022",
    title: "Toyota All New Avanza 2022",
    vendor: "LBV Transport",
    typeSlug: "mpv",
    seats: 6,
    luggage: 2,
    driverOption: "with_driver",
    transmission: "Matic",
    year: 2022,
    tone: "from-zinc-300 to-zinc-500",
    netUsdCents: 1400,
    imageQuery: "Toyota Avanza 2022 white",
    description:
      "<p>Generasi terbaru Avanza dengan penggerak roda depan dan fitur keselamatan Toyota Safety Sense.</p><ul><li>6 airbags</li><li>Cruise control</li><li>Head unit touchscreen</li></ul>",
    reviews: [{ user: 3, rating: 5, body: "Very good experience with excellent driving and punctuality." }],
  },
  {
    slug: "daihatsu-all-new-xenia-2022",
    title: "Daihatsu All New Xenia 2022",
    vendor: "Raya Rent Car",
    typeSlug: "mpv",
    seats: 6,
    luggage: 2,
    driverOption: "with_driver",
    transmission: "Matic",
    year: 2022,
    tone: "from-gray-300 to-gray-500",
    netUsdCents: 1400,
    imageQuery: "Daihatsu Xenia silver",
    description:
      "<p>S kembar Avanza dengan suspensi nyaman dan kabin kedap. Cocok untuk perjalanan jauh antar kota.</p>",
    reviews: [{ user: 1, rating: 5, body: "Bagusss sesuai ekspektasi......." }],
  },
  {
    slug: "daihatsu-sigra",
    title: "Daihatsu Sigra",
    vendor: "Raya Rent Car",
    typeSlug: "mpv",
    seats: 5,
    luggage: 2,
    driverOption: "with_driver",
    transmission: "Manual",
    year: 2021,
    tone: "from-slate-200 to-slate-400",
    netUsdCents: 1500,
    imageQuery: "Daihatsu Sigra white car",
    description: "<p>MPV ringkas yang irit dan lincah untuk dalam kota. Harga bersahabat, muat 5 penumpang.</p>",
    reviews: [],
  },
  {
    slug: "suzuki-xl7",
    title: "Suzuki XL7",
    vendor: "Bali Prima Trans",
    typeSlug: "suv",
    seats: 6,
    luggage: 2,
    driverOption: "with_driver",
    transmission: "Matic",
    year: 2022,
    tone: "from-orange-400 to-red-600",
    netUsdCents: 1550,
    imageQuery: "Suzuki XL7",
    description: "<p>SUV 6 penumpang dengan ground clearance tinggi — siap untuk rute menanjak dan jalan pedesaan.</p>",
    reviews: [{ user: 2, rating: 4, body: "Mobil terawat, sopir sabar menunggu." }],
  },
  {
    slug: "mitsubishi-xpander",
    title: "Mitsubishi Xpander",
    vendor: "Bali Prima Trans",
    typeSlug: "mpv",
    seats: 6,
    luggage: 2,
    driverOption: "with_driver",
    transmission: "Matic",
    year: 2022,
    tone: "from-red-300 to-red-500",
    netUsdCents: 1600,
    imageQuery: "Mitsubishi Xpander silver",
    description: "<p>MPV modern dengan kabin paling lega di kelasnya dan fitur keselamatan aktif.</p>",
    reviews: [],
  },
  {
    slug: "daihatsu-terios",
    title: "Daihatsu Terios",
    vendor: "Raya Rent Car",
    typeSlug: "suv",
    seats: 7,
    luggage: 2,
    driverOption: "without_driver",
    transmission: "Matic",
    year: 2022,
    tone: "from-stone-300 to-stone-500",
    netUsdCents: 1700,
    imageQuery: "Daihatsu Terios white SUV",
    description: "<p>SUV 7 penumpang lepas kunci. Cocok untuk yang ingin menyetir sendiri menjelajah pulau.</p>",
    reviews: [],
  },
  {
    slug: "toyota-kijang-innova-reborn",
    title: "Toyota Kijang Innova Reborn",
    vendor: "LBV Transport",
    typeSlug: "mpv",
    seats: 7,
    luggage: 3,
    driverOption: "with_driver",
    transmission: "Matic",
    year: 2023,
    tone: "from-neutral-400 to-neutral-600",
    netUsdCents: 2600,
    imageQuery: "Toyota Kijang Innova",
    description: "<p>MPV premium untuk perjalanan bisnis dan keluarga besar. Captain seat di baris kedua.</p>",
    reviews: [
      { user: 3, rating: 5, body: "Innova bersih dan sopir profesional. Akan pesan lagi." },
    ],
  },
  {
    slug: "toyota-camry",
    title: "Toyota Camry",
    vendor: "Elite Chauffeur",
    typeSlug: "sedan",
    seats: 4,
    luggage: 2,
    driverOption: "with_driver",
    transmission: "Matic",
    year: 2022,
    tone: "from-slate-500 to-slate-700",
    netUsdCents: 3500,
    imageQuery: "Toyota Camry black sedan",
    description: "<p>Sedan eksekutif untuk penjemputan tamu penting. Kabin senyap dan sopir berjas.</p>",
    reviews: [],
  },
  {
    slug: "honda-cr-v",
    title: "Honda CR-V",
    vendor: "Bali Prima Trans",
    typeSlug: "suv",
    seats: 5,
    luggage: 3,
    driverOption: "with_driver",
    transmission: "Matic",
    year: 2023,
    tone: "from-zinc-400 to-zinc-600",
    netUsdCents: 3200,
    imageQuery: "Honda CR-V silver SUV",
    description: "<p>SUV premium dengan Honda Sensing dan kabin mewah untuk 5 penumpang.</p>",
    reviews: [],
  },
  {
    slug: "toyota-fortuner",
    title: "Toyota Fortuner",
    vendor: "Elite Chauffeur",
    typeSlug: "suv",
    seats: 7,
    luggage: 3,
    driverOption: "with_driver",
    transmission: "Matic",
    year: 2023,
    tone: "from-gray-500 to-gray-700",
    netUsdCents: 4200,
    imageQuery: "Toyota Fortuner black SUV",
    description: "<p>SUV gagah untuk perjalanan jauh dan medan berat, tetap nyaman untuk keluarga.</p>",
    reviews: [],
  },
  {
    slug: "hyundai-ioniq-5",
    title: "Hyundai Ioniq 5",
    vendor: "Green Motion EV",
    typeSlug: "electric",
    seats: 5,
    luggage: 3,
    driverOption: "with_driver",
    transmission: "Matic",
    year: 2023,
    electric: true,
    tone: "from-teal-300 to-cyan-600",
    netUsdCents: 3800,
    imageQuery: "Hyundai Ioniq 5 electric car",
    description: "<p>Mobil listrik futuristik dengan pengisian cepat dan kabin lounge. Nol emisi selama sewa.</p>",
    reviews: [{ user: 1, rating: 5, body: "Mobil listriknya senyap dan nyaman, sopir paham charging station." }],
  },
  {
    slug: "wuling-air-ev",
    title: "Wuling Air ev",
    vendor: "Green Motion EV",
    typeSlug: "electric",
    seats: 4,
    luggage: 1,
    driverOption: "without_driver",
    transmission: "Matic",
    year: 2023,
    electric: true,
    tone: "from-sky-300 to-blue-500",
    netUsdCents: 950,
    imageQuery: "Wuling Air EV",
    description: "<p>Mobil listrik mungil untuk keliling kota. Parkir gampang, biaya hemat.</p>",
    reviews: [],
  },
  {
    slug: "honda-brio",
    title: "Honda Brio",
    vendor: "Raya Rent Car",
    typeSlug: "hatchback",
    seats: 4,
    luggage: 1,
    driverOption: "without_driver",
    transmission: "Matic",
    year: 2022,
    tone: "from-yellow-300 to-amber-500",
    netUsdCents: 1100,
    imageQuery: "Honda Brio yellow hatchback",
    description: "<p>Hatchback lincah lepas kunci untuk perjalanan solo atau berdua dalam kota.</p>",
    reviews: [],
  },
  {
    slug: "toyota-alphard",
    title: "Toyota Alphard",
    vendor: "Elite Chauffeur",
    typeSlug: "luxury",
    seats: 6,
    luggage: 4,
    driverOption: "with_driver",
    transmission: "Matic",
    year: 2023,
    tone: "from-neutral-700 to-neutral-900",
    netUsdCents: 9000,
    imageQuery: "Toyota Alphard black van",
    description: "<p>MPV mewah kelas bisnis: captain seat, pintu elektrik, dan privasi penuh.</p>",
    reviews: [{ user: 2, rating: 5, body: "Alphard bersih seperti baru, layanan VIP sungguhan." }],
  },
  {
    slug: "toyota-hiace-premio",
    title: "Toyota Hiace Premio",
    vendor: "Bali Prima Trans",
    typeSlug: "van",
    seats: 12,
    luggage: 6,
    driverOption: "with_driver",
    transmission: "Manual",
    year: 2022,
    tone: "from-slate-400 to-slate-600",
    netUsdCents: 5500,
    imageQuery: "Toyota Hiace",
    description: "<p>Van 12 penumpang untuk rombongan wisata dan acara kantor. Bagasi luas untuk 6 koper.</p>",
    reviews: [],
  },
];

const REVIEW_USERS = [
  { id: "seed-transport-user-1", email: "transport.reviewer1@seed.bookingvip.local", name: "Andi Rahmawan" },
  { id: "seed-transport-user-2", email: "transport.reviewer2@seed.bookingvip.local", name: "Intan Maharani" },
  { id: "seed-transport-user-3", email: "transport.reviewer3@seed.bookingvip.local", name: "Taufik Akbar" },
];

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fileExists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

type CommonsHit = { thumbUrl: string; author: string; license: string };

/** Search Wikimedia Commons for a usable photo of the car. */
async function searchCommons(query: string): Promise<CommonsHit | null> {
  let res: Response | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      res = await fetch(COMMONS_API + encodeURIComponent(query), {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      res = null;
    }
    if (res && res.ok) break;
    await pause(1500 * (attempt + 1));
  }
  if (!res || !res.ok) return null;

  const data = (await res.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          title: string;
          imageinfo?: {
            thumburl?: string;
            mime?: string;
            extmetadata?: Record<string, { value?: string }>;
          }[];
        }
      >;
    };
  };

  const pages = Object.values(data.query?.pages ?? {});
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info?.thumburl || info.mime !== "image/jpeg") continue;
    if (/\.(svg|png|tif|tiff|gif|webm|pdf)$/i.test(page.title)) continue;
    const meta = info.extmetadata ?? {};
    const strip = (value?: string) =>
      (value ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 120);
    return {
      thumbUrl: info.thumburl,
      author: strip(meta.Artist?.value) || "Wikimedia Commons",
      license: strip(meta.LicenseShortName?.value) || "CC",
    };
  }
  return null;
}

/** Download + resize the photo; returns the public URL or null. */
async function fetchPhoto(car: CarSeed): Promise<{ url: string; credit: string } | null> {
  const file = path.join(IMAGE_DIR, `${car.slug}.jpg`);
  const url = `/images/transport/${car.slug}.jpg`;

  if (await fileExists(file)) {
    return { url, credit: "Wikimedia Commons" };
  }

  const hit = await searchCommons(car.imageQuery);
  if (!hit) return null;

  try {
    const res = await fetch(hit.thumbUrl, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const resized = await sharp(buffer).resize({ width: 1200 }).jpeg({ quality: 74 }).toBuffer();
    await mkdir(IMAGE_DIR, { recursive: true });
    await writeFile(file, resized);
    return { url, credit: `${hit.author} · ${hit.license} · Wikimedia Commons` };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function main() {
  const lines = await db.orm.public.ServiceLine.select("id").where({ slug: "transport" }).first();
  if (!lines) {
    console.error("The transport service line is missing — run `npm run db:seed` first.");
    process.exit(1);
  }
  const lineId = lines.id;

  // Vehicle classes — add the ones the fleet needs, keep the existing ones.
  const typeSlugs = [...new Set(CARS.map((car) => car.typeSlug))];
  const typeIds = new Map<string, string>();
  for (const slug of typeSlugs) {
    const existing = await db.orm.public.ServiceType
      .select("id")
      .where({ lineId, slug })
      .first();
    if (existing) {
      typeIds.set(slug, existing.id);
    } else {
      const id = crypto.randomUUID();
      const name =
        slug === "mpv" ? "MPV" :
        slug === "electric" ? "Mobil Listrik" :
        slug === "hatchback" ? "Hatchback" :
        slug === "luxury" ? "Luxury" :
        slug.charAt(0).toUpperCase() + slug.slice(1);
      await db.orm.public.ServiceType.create({
        id,
        lineId,
        slug,
        name,
        sortOrder: typeSlugs.indexOf(slug),
        active: true,
      });
      typeIds.set(slug, id);
      console.log(`+ ServiceType ${slug}`);
    }
  }

  // Review authors.
  for (const user of REVIEW_USERS) {
    const existing = await db.orm.public.User.select("id").where({ id: user.id }).first();
    if (!existing) {
      await db.orm.public.User.create({
        id: user.id,
        email: user.email,
        name: user.name,
        role: "USER",
        emailVerified: true,
      });
      console.log(`+ User ${user.email}`);
    }
  }

  let created = 0;
  let skipped = 0;

  for (const car of CARS) {
    const existing = await db.orm.public.Product.select("id").where({ slug: car.slug }).first();
    let productId: string;

    const specs = [
      { key: "luggage", name: `${car.luggage} koper` },
      { key: "passengers", name: `${car.seats} penumpang` },
      { key: "transmission", name: car.transmission },
      { key: "year", name: `Tahun ${car.year}` },
      { key: "clean", name: "BV Clean" },
      ...(car.driverOption === "with_driver"
        ? [{ key: "driver_language", name: "Sopir bisa bahasa Inggris" }]
        : []),
      ...(car.electric ? [{ key: "electric", name: "Mobil Listrik" }] : []),
    ];

    if (existing) {
      productId = existing.id;
      skipped++;
    } else {
      productId = crypto.randomUUID();
      await db.orm.public.Product.create({
        id: productId,
        slug: car.slug,
        lineId,
        serviceTypeId: typeIds.get(car.typeSlug) ?? null,
        title: car.title,
        description: car.description,
        vendor: car.vendor,
        seats: car.seats,
        transmission: car.transmission.toLowerCase(),
        driverOption: car.driverOption,
        specs: specs as unknown as [],
        tone: car.tone,
        fromPriceUsdCents: car.netUsdCents * 2,
        leadTimeHours: 2,
        leadTimeDays: 0,
        isAddOn: false,
        active: true,
      });
      created++;
      console.log(`+ Product ${car.slug}`);
    }

    // Packages — inserted when the (product, label) pair is missing.
    for (const [index, pkg] of packagesFor(car).entries()) {
      const existingPkg = await db.orm.public.ProductPackage
        .select("id")
        .where({ productId, label: pkg.label })
        .first();
      if (existingPkg) continue;
      await db.orm.public.ProductPackage.create({
        id: crypto.randomUUID(),
        productId,
        label: pkg.label,
        unitKind: "per_day",
        unitUsdCents: pkg.unitUsdCents,
        fromUsdCents: pkg.fromUsdCents,
        description: pkg.description,
        info: pkg.info as unknown as [],
        durationHours: pkg.durationHours,
        sortOrder: index,
        active: true,
      });
      console.log(`  + Package ${car.slug} / ${pkg.label}`);
    }

    // Reviews — deterministic ids keep re-runs idempotent.
    for (const [index, review] of car.reviews.entries()) {
      const id = `seed-transport-review-${car.slug}-${index}`;
      const existingReview = await db.orm.public.Review.select("id").where({ id }).first();
      if (existingReview) continue;
      const user = REVIEW_USERS[review.user - 1]!;
      await db.orm.public.Review.create({
        id,
        userId: user.id,
        subjectType: "product",
        subjectId: productId,
        rating: review.rating,
        body: review.body,
        createdAt: new Date(Date.now() - (index + 1) * 86_400_000 * 3),
      });
      console.log(`  + Review ${car.slug} #${index + 1}`);
    }

    // Keep the rating summary in sync with the stored reviews.
    const reviewRows = await db.orm.public.Review
      .select("rating")
      .where({ subjectType: "product", subjectId: productId })
      .all();
    const count = reviewRows.length;
    const average =
      count > 0
        ? Math.round((reviewRows.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10
        : null;
    await db.orm.public.Product
      .where({ id: productId })
      .update({ rating: average, reviews: count } as never);

    // Photo + Media row (skipped when the network is unavailable).
    const mediaId = `seed-transport-media-${car.slug}`;
    const existingMedia = await db.orm.public.Media.select("id").where({ id: mediaId }).first();
    if (!existingMedia) {
      const photo = await fetchPhoto(car);
      if (photo) {
        await db.orm.public.Media.create({
          id: mediaId,
          ownerType: "Product",
          ownerId: productId,
          key: `transport/${car.slug}.jpg`,
          url: photo.url,
          alt: car.title,
          credit: photo.credit,
          sortOrder: 0,
          active: true,
        });
        await db.orm.public.Product
          .where({ id: productId })
          .update({ imageUrl: photo.url } as never);
        console.log(`  + Photo ${car.slug}`);
      } else {
        console.log(`  · Photo skipped (offline?) ${car.slug}`);
      }
      await pause(800);
    }
  }

  console.log(`\nTransport seed done: ${created} created, ${skipped} already present.`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});