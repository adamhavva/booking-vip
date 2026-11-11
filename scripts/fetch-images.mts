#!/usr/bin/env node --experimental-strip-types
// Fetches real photos from Wikimedia Commons and stores them in
// `public/images/`, then points the matching database rows at the file.
//
// Run:  npm run images
//   (or node --experimental-strip-types scripts/fetch-images.mts)
//
// The script is idempotent: a row that already has an image is skipped.
// Every image keeps its author + licence in `imageCredit` and in
// `public/images/CREDITS.md`.

import "dotenv/config";
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { db } from "../src/prisma/db.ts";

const IMAGE_DIR = path.join(process.cwd(), "public", "images");
const CREDIT_FILE = path.join(IMAGE_DIR, "CREDITS.md");
const WIDTH = 1200;
const QUALITY = 72;
const API =
  "https://commons.wikimedia.org/w/api.php?action=query&generator=search" +
  `&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|extmetadata|size|mime&iiurlwidth=${WIDTH}&format=json&gsrsearch=`;

/** Files that are never a usable photo (maps, logos, documents, …). */
const REJECT =
  /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|odg|svg|tif|tiff|djvu|mid|ogg|webm|zip|rar)$|map|logo|diagram|chart|flag|coat of arms|icon|seal|plan of|locator|barnstar|user[_ ]|wikimedia|commons-|thanks|award|medal/i;

/**
 * Wikimedia asks for a descriptive User-Agent with a contact, otherwise it
 * answers 429 after a few requests.
 */
const USER_AGENT =
  "booking-vip-demo/1.0 (https://example.org/booking-vip; booking-vip@example.org)";

type Hit = {
  title: string;
  thumbUrl: string;
  pageUrl: string;
  author: string;
  license: string;
};

type Task = {
  table: "Product" | "Airport" | "Destination" | "Banner" | "Promo" | "Article" | "ServiceLine";
  id: string;
  file: string;
  query: string;
};

// ---------------------------------------------------------------------------
// Search terms per row — the Commons search is keyword based, so each row
// gets a term that actually matches photos of that thing.
// ---------------------------------------------------------------------------
const PRODUCT_QUERIES: Record<string, string> = {
  "meet-greet": "Soekarno Hatta airport terminal passengers",
  "fast-track-immigration": "airport immigration passport control queue",
  "premium-lounge-access": "airport lounge interior seating",
  "baggage-porter-assistance": "airport luggage trolley baggage",
  "vip-terminal-buggy": "airport terminal interior architecture",
  "family-vip-package": "family travelling with luggage airport",
  "executive-sedan": "chauffeur sedan car",
  "premium-suv": "SUV car vehicle exterior",
  "luxury-van": "minibus van vehicle interior",
  "first-class-limousine": "limousine car luxury",
  "city-hourly-hire": "chauffeur car city street",
  "bali-highlights": "Bali temple Indonesia",
  "komodo-island-sailing": "Komodo island Indonesia boat",
  "yogyakarta-heritage": "Borobudur temple Yogyakarta",
  "lombok-gili-escape": "Gili islands Lombok beach",
  "bromo-sunrise-tour": "Mount Bromo sunrise East Java",
  "raja-ampat-explorer": "Raja Ampat islands Indonesia",
  "tourist-evoa": "visa passport traveler Indonesia",
  "extendable-evoa": "passport and travel documents",
  "business-evoa": "businessman airport terminal",
  "express-evoa": "passport control desk airport",
  "transit-evoa": "transit hall airport passengers",
  "executive-sedan-bali": "Bali car transfer road",
  "executive-sedan-jakarta": "Jakarta city traffic street",
  "luxury-van-bali": "Bali tourist bus road",
  "luxury-van-jakarta": "minibus Jakarta street",
  "evoa-registration": "visa application form desk",
  "travel-insurance": "travel insurance passport map",
};

const AIRPORT_QUERIES: Record<string, string> = {
  "Soekarno-Hatta": "Soekarno Hatta International Airport terminal",
  "Ngurah Rai": "Ngurah Rai International Airport Bali",
  Juanda: "Juanda International Airport Surabaya",
  Kualanamu: "Kualanamu International Airport Medan",
};

const DESTINATION_QUERIES: Record<string, string> = {
  bali: "Bali Indonesia landscape temple",
  "labuan-bajo": "Labuan Bajo Komodo harbour",
  yogyakarta: "Yogyakarta Indonesia temple",
  lombok: "Lombok Indonesia beach",
  "raja-ampat": "Raja Ampat Indonesia islands",
  bromo: "Mount Bromo Java volcano",
  jakarta: "Jakarta Indonesia skyline",
  bandung: "Bandung Indonesia city",
};

const BANNER_QUERIES: Record<string, string> = {
  "fast-track": "airport departure terminal travellers",
  "evoa-apply": "passport visa travel documents",
  corporate: "business people airport meeting",
};

const PROMO_QUERIES: Record<string, string> = {
  "vip-welcome-offer": "airport greeter welcome staff",
  "transfer-bundle": "airport transfer vehicle car",
  "tour-early-bird": "Bali sunrise temple travel",
  "evoa-express-deal": "visa passport travel",
  "family-vip-cashback": "family holidays airport",
};

const ARTICLE_QUERIES: Record<string, string> = {
  "what-to-expect-from-an-airport-meet-greet": "airport greeter meet and greet host",
  "a-guide-to-indonesia-s-evoa-for-first-timers": "electronic visa passport Indonesia",
  "choosing-the-right-private-transfer": "chauffeur driving car",
  "five-tours-worth-taking-this-year": "tourists temple Indonesia travel",
  "fast-track-vs-standard-immigration": "airport immigration queue",
};

const SERVICE_LINE_QUERIES: Record<string, string> = {
  "vip-service": "airport lounge waiting area",
  transport: "chauffeur car airport transfer",
  "tour-package": "tour group travelling Indonesia",
  evoa: "visa passport travel documents",
};

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

async function fileExists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function searchCommons(
  query: string,
  exclude: Set<string> = new Set()
): Promise<Hit | null> {
  const url = API + encodeURIComponent(query);

  let res: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        signal: AbortSignal.timeout(20_000),
      });
    } catch {
      res = null;
    }
    if (res && res.ok) break;
    // Back off — the API throttles bursts.
    await pause(2000 * (attempt + 1));
  }
  if (!res || !res.ok) return null;

  const data = (await res.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          title: string;
          imageinfo?: {
            url: string;
            thumburl?: string;
            descriptionurl: string;
            mime?: string;
            width?: number;
            height?: number;
            extmetadata?: Record<string, { value?: string }>;
          };
        }
      >;
    };
  };

  // The API returns `imageinfo` as an array (one entry per file).
  const pages = Object.values(data.query?.pages ?? {}).map((p) => {
    const info = Array.isArray(p.imageinfo)
      ? p.imageinfo[0]
      : (p.imageinfo as never);
    return { title: p.title, info };
  });

  // Prefer wide, photo-like files that are not used yet.
  const usable = pages.filter(
    (p) =>
      p.info &&
      !REJECT.test(p.title) &&
      (p.info.mime ?? "").startsWith("image/") &&
      !exclude.has(p.title)
  );
  const candidates = usable
    .filter((p) => (p.info?.width ?? 0) >= 1200)
    .sort((a, b) => (b.info?.width ?? 0) - (a.info?.width ?? 0));

  const pick = candidates[0] ?? usable[0];
  if (!pick?.info) return null;

  const meta = pick.info.extmetadata ?? {};
  return {
    title: pick.title,
    thumbUrl: pick.info.thumburl ?? pick.info.url,
    pageUrl: pick.info.descriptionurl,
    author: stripHtml(meta.Artist?.value ?? meta.Credit?.value ?? "Unknown author"),
    license: stripHtml(meta.LicenseShortName?.value ?? "See Wikimedia Commons"),
  };
}

async function download(url: string, file: string): Promise<boolean> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) return false;
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.byteLength < 10_000) return false; // too small to be a usable photo

  // Downscale + re-encode so the public folder stays light.
  try {
    const optimized = await sharp(buffer)
      .rotate()
      .resize({ width: WIDTH, withoutEnlargement: true })
      .jpeg({ quality: QUALITY, progressive: true })
      .toBuffer();
    await writeFile(file, optimized);
  } catch {
    await writeFile(file, buffer);
  }
  return true;
}

/** Wait a moment — the Commons API is not meant to be hammered. */
function pause(ms = 1200): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Collect every row that could use a photo. */
async function collectTasks(): Promise<Task[]> {
  const tasks: Task[] = [];

  const products = await db.orm.public.Product
    .select("id", "slug", "imageUrl")
    .where((f) => f.isAddOn.eq(false))
    .all();
  for (const p of products) {
    tasks.push({
      table: "Product",
      id: p.id,
      file: `product-${p.slug}.jpg`,
      query: PRODUCT_QUERIES[p.slug] ?? p.slug.replace(/-/g, " "),
    });
  }

  const airports = await db.orm.public.Airport
    .select("id", "name", "city", "kind", "iataCode", "imageUrl")
    .all();
  for (const a of airports) {
    const key = a.kind === "city" ? a.city : a.name;
    // Airports use their IATA code, cities their name — so the two never
    // collide on the same file name.
    const slug =
      a.kind === "city"
        ? a.city
        : (a.iataCode ?? a.name);
    tasks.push({
      table: "Airport",
      id: a.id,
      file: `airport-${slug.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.jpg`,
      query: AIRPORT_QUERIES[a.name] ?? `${a.name} ${a.city} Indonesia`,
    });
  }

  const destinations = await db.orm.public.Destination
    .select("id", "slug", "nameEn", "imageUrl")
    .all();
  for (const d of destinations) {
    tasks.push({
      table: "Destination",
      id: d.id,
      file: `destination-${d.slug}.jpg`,
      query: DESTINATION_QUERIES[d.slug] ?? `${d.nameEn} Indonesia`,
    });
  }

  const banners = await db.orm.public.Banner.select("id", "slug", "imageUrl").all();
  for (const b of banners) {
    tasks.push({
      table: "Banner",
      id: b.id,
      file: `banner-${b.slug}.jpg`,
      query: BANNER_QUERIES[b.slug] ?? `${b.slug} travel`,
    });
  }

  const promos = await db.orm.public.Promo.select("id", "slug", "imageUrl").all();
  for (const p of promos) {
    tasks.push({
      table: "Promo",
      id: p.id,
      file: `promo-${p.slug}.jpg`,
      query: PROMO_QUERIES[p.slug] ?? `${p.slug} travel`,
    });
  }

  const articles = await db.orm.public.Article.select("id", "slug", "imageUrl").all();
  for (const a of articles) {
    tasks.push({
      table: "Article",
      id: a.id,
      file: `article-${a.slug}.jpg`,
      query: ARTICLE_QUERIES[a.slug] ?? `${a.slug} travel`,
    });
  }

  const lines = await db.orm.public.ServiceLine
    .select("id", "slug", "imageUrl")
    .all();
  for (const l of lines) {
    tasks.push({
      table: "ServiceLine",
      id: l.id,
      file: `line-${l.slug}.jpg`,
      query: SERVICE_LINE_QUERIES[l.slug] ?? `${l.slug} travel`,
    });
  }

  return tasks;
}

/** Read the current imageUrl of a row (used for the skip check). */
async function currentImageUrl(task: Task): Promise<string | null> {
  switch (task.table) {
    case "Product":
      return (
        await db.orm.public.Product.select("imageUrl").where({ id: task.id }).first()
      )?.imageUrl ?? null;
    case "Airport":
      return (
        await db.orm.public.Airport.select("imageUrl").where({ id: task.id }).first()
      )?.imageUrl ?? null;
    case "Destination":
      return (
        await db.orm.public.Destination
          .select("imageUrl")
          .where({ id: task.id })
          .first()
      )?.imageUrl ?? null;
    case "Banner":
      return (
        await db.orm.public.Banner.select("imageUrl").where({ id: task.id }).first()
      )?.imageUrl ?? null;
    case "Promo":
      return (
        await db.orm.public.Promo.select("imageUrl").where({ id: task.id }).first()
      )?.imageUrl ?? null;
    case "Article":
      return (
        await db.orm.public.Article.select("imageUrl").where({ id: task.id }).first()
      )?.imageUrl ?? null;
    case "ServiceLine":
      return (
        await db.orm.public.ServiceLine
          .select("imageUrl")
          .where({ id: task.id })
          .first()
      )?.imageUrl ?? null;
  }
}

async function saveImage(task: Task, hit: Hit): Promise<void> {
  const publicPath = `/images/${task.file}`;
  const credit = `${hit.author} — ${hit.license} · ${hit.pageUrl}`;

  switch (task.table) {
    case "Product":
      await db.orm.public.Product
        .where({ id: task.id })
        .update({ imageUrl: publicPath, imageCredit: credit });
      break;
    case "Airport":
      await db.orm.public.Airport
        .where({ id: task.id })
        .update({ imageUrl: publicPath, imageCredit: credit });
      break;
    case "Destination":
      await db.orm.public.Destination
        .where({ id: task.id })
        .update({ imageUrl: publicPath, imageCredit: credit });
      break;
    case "Banner":
      await db.orm.public.Banner
        .where({ id: task.id })
        .update({ imageUrl: publicPath, imageCredit: credit });
      break;
    case "Promo":
      await db.orm.public.Promo
        .where({ id: task.id })
        .update({ imageUrl: publicPath, imageCredit: credit });
      break;
    case "Article":
      await db.orm.public.Article
        .where({ id: task.id })
        .update({ imageUrl: publicPath, imageCredit: credit });
      break;
    case "ServiceLine":
      await db.orm.public.ServiceLine
        .where({ id: task.id })
        .update({ imageUrl: publicPath, imageCredit: credit });
      break;
  }
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  console.log("Fetching photos from Wikimedia Commons…");
  await mkdir(IMAGE_DIR, { recursive: true });

  const tasks = await collectTasks();
  const credits: string[] = [];
  const used = new Set<string>();

  for (const task of tasks) {
    const target = path.join(IMAGE_DIR, task.file);

    // Skip rows that already have a file on disk.
    const existing = await currentImageUrl(task);
    if (existing && (await fileExists(target))) {
      console.log(`  · ${task.table}/${task.file} — already there`);
      continue;
    }

    const hit = await searchCommons(task.query, used).catch(() => null);
    if (!hit) {
      console.log(`  ! ${task.table}/${task.file} — no match for "${task.query}"`);
      continue;
    }
    used.add(hit.title);

    const ok = await download(hit.thumbUrl, target).catch(() => false);
    if (!ok) {
      console.log(`  ! ${task.table}/${task.file} — download failed`);
      continue;
    }

    await saveImage(task, hit);
    credits.push(
      `| ${task.file} | ${hit.title.replace(/^File:/, "")} | ${hit.author} | ${hit.license} | ${hit.pageUrl} |`
    );
    console.log(`  ✓ ${task.table}/${task.file} ← ${hit.title}`);
    await pause();
  }

  // Keep the credits file in sync with what is on disk.
  if (credits.length > 0) {
    const header = [
      "# Image credits",
      "",
      "All photos come from Wikimedia Commons and keep their original",
      "free licence. The list is regenerated by `npm run images`.",
      "",
      "| File | Source | Author | Licence | Page |",
      "| --- | --- | --- | --- | --- |",
      "",
    ];
    const previous = (await fileExists(CREDIT_FILE))
      ? (await import("node:fs/promises")).readFile(CREDIT_FILE, "utf8")
      : "";
    await writeFile(CREDIT_FILE, header.join("\n") + credits.join("\n") + "\n", "utf8");
    if (previous) {
      // Keep previously recorded rows that are not part of this run.
      const oldRows = previous
        .split("\n")
        .filter((l) => l.startsWith("| ") && !l.startsWith("| File") && !l.startsWith("| ---"));
      const seen = new Set(credits.map((c) => c.split("|")[1]?.trim()));
      const extra = oldRows.filter((r) => !seen.has(r.split("|")[1]?.trim()));
      if (extra.length > 0) {
        await writeFile(
          CREDIT_FILE,
          header.join("\n") + [...credits, ...extra].join("\n") + "\n",
          "utf8"
        );
      }
    }
  }

  console.log("\nDone.");
}

main()
  .catch((err) => {
    console.error("Image fetch failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.close();
  });
