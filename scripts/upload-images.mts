#!/usr/bin/env node --experimental-strip-types
// Moves the images from `public/images/` into the Cloudflare R2 bucket and
// re-points the database at the public URLs.
//
//   npm run images:upload   → upload objects + upsert `Media` rows (+ DB sync
//                             once R2_PUBLIC_BASE_URL is configured)
//   npm run images:prune    → after a successful upload, delete
//                             `public/images/` and the bucket probe object
//
// The script is idempotent: objects already in the bucket are skipped,
// `Media` rows are upserted by key and URLs are rewritten to the current
// `R2_PUBLIC_BASE_URL` on every run.

import "dotenv/config";
import { readdir, readFile, rm, stat, copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { db } from "../src/prisma/db.ts";
import {
  R2_BUCKET,
  publicBaseUrl,
  mediaUrl,
  objectExists,
  putObject,
  deleteObject,
} from "../src/lib/storage.ts";

const IMAGE_DIR = path.join(process.cwd(), "public", "images");
const ROOT_CREDITS = path.join(process.cwd(), "CREDITS.md");

const JPEG = "image/jpeg";

/** Filename prefix → (owner model, bucket folder). */
const KINDS: Record<string, { table: string; folder: string; altColumn: string }> = {
  "product-": { table: "Product", folder: "products", altColumn: "title" },
  "airport-": { table: "Airport", folder: "airports", altColumn: "name" },
  "destination-": { table: "Destination", folder: "destinations", altColumn: "nameEn" },
  "banner-": { table: "Banner", folder: "banners", altColumn: "titleEn" },
  "promo-": { table: "Promo", folder: "promos", altColumn: "titleEn" },
  "article-": { table: "Article", folder: "articles", altColumn: "titleEn" },
  "line-": { table: "ServiceLine", folder: "lines", altColumn: "label" },
};

type Job = {
  file: string;      // original file name, e.g. "product-meet-greet.jpg" ("" when pruned)
  table: string;     // owning model
  folder: string;    // bucket folder
  key: string;       // object key, e.g. "products/meet-greet.jpg"
  ownerId: string;
  alt: string | null;
  credit: string | null;
  width?: number | null;   // from the existing Media row (media-derived jobs)
  height?: number | null;
};

/** Read the owning row of a file — matched through its current imageUrl
 * (local `/images/…` before the sync, public URL after it) or, failing that,
 * through an existing `Media` row with the same key. */
async function ownerOf(
  table: string,
  file: string,
  folder: string,
  altColumn: string
): Promise<{ id: string; alt: string | null; credit: string | null } | null> {
  const localUrl = `/images/${file}`;
  const publicUrl = mediaUrl(`${folder}/${file.slice(file.indexOf("-") + 1)}`);
  const rows = await db.orm.public[table]
    .select("id", "imageUrl", "imageCredit", altColumn)
    .all();
  const hit = rows.find(
    (r: Record<string, unknown>) => r.imageUrl === localUrl || r.imageUrl === publicUrl
  );
  if (hit) {
    return {
      id: hit.id as string,
      alt: (hit[altColumn] as string | null) ?? null,
      credit: (hit.imageCredit as string | null) ?? null,
    };
  }

  // Fall back to the Media row created on a previous run.
  const media = await db.orm.public.Media
    .select("ownerId", "alt", "credit")
    .where({ key: `${folder}/${file.slice(file.indexOf("-") + 1)}`, ownerType: table })
    .first();
  if (media) {
    return { id: media.ownerId, alt: media.alt, credit: media.credit };
  }
  return null;
}

/** Files under `public/images/`, or — once pruned — nothing. */
async function localFiles(): Promise<string[]> {
  try {
    const entries = await readdir(IMAGE_DIR, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.endsWith(".jpg"))
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}

/** Keys of every `Media` row, as a fallback job list for re-runs. */
async function mediaJobs(): Promise<Job[]> {
  const rows = await db.orm.public.Media
    .select("key", "ownerType", "ownerId", "alt", "credit", "width", "height")
    .all();
  return rows.map((r) => {
    const folder = r.key.slice(0, r.key.indexOf("/"));
    return {
      file: "",            // local file no longer exists
      table: r.ownerType,
      folder,
      key: r.key,
      ownerId: r.ownerId,
      alt: r.alt,
      credit: r.credit,
      width: r.width,
      height: r.height,
    };
  });
}

async function collectJobs(): Promise<Job[]> {
  const jobs: Job[] = [];

  for (const file of await localFiles()) {
    const kind = Object.keys(KINDS).find((p) => file.startsWith(p));
    if (!kind) {
      console.log(`  ! ${file} — unknown name pattern, skipped`);
      continue;
    }
    const { table, folder, altColumn } = KINDS[kind]!;
    const owner = await ownerOf(table, file, folder, altColumn);
    if (!owner) {
      console.log(`  ! ${file} — no ${table} row or Media row points at it, skipped`);
      continue;
    }
    jobs.push({
      file,
      table,
      folder,
      key: `${folder}/${file.slice(kind.length)}`,
      ownerId: owner.id,
      alt: owner.alt,
      credit: owner.credit,
    });
  }
  return jobs;
}

async function uploadJobs(jobs: Job[]) {
  let uploaded = 0;
  let skipped = 0;
  for (const job of jobs) {
    // Media-derived re-runs have no local copy — verify the object exists
    // and refresh its row only.
    let bytes: Buffer | null = null;
    if (job.file) {
      bytes = await readFile(path.join(IMAGE_DIR, job.file));
      if (!(await objectExists(job.key))) {
        await putObject(job.key, bytes, JPEG);
        uploaded++;
        console.log(`  ✓ ${R2_BUCKET}/${job.key} (${(bytes.length / 1024).toFixed(0)} KB)`);
      } else {
        skipped++;
      }
    } else {
      if (!(await objectExists(job.key))) {
        console.log(`  ! ${job.key} — missing from the bucket and no local copy`);
        continue;
      }
      skipped++;
    }

    // Pixel size for the layout — measured from the bytes when available,
    // otherwise kept from the existing Media row.
    let width: number | null = job.width ?? null;
    let height: number | null = job.height ?? null;
    if (bytes) {
      try {
        const meta = await sharp(bytes).metadata();
        width = meta.width ?? width;
        height = meta.height ?? height;
      } catch {
        // decorative fallback — leave the size unknown
      }
    }

    const url = mediaUrl(job.key);
    const payload = {
      ownerType: job.table,
      ownerId: job.ownerId,
      key: job.key,
      url,
      alt: job.alt,
      credit: job.credit,
      width,
      height,
      sortOrder: 0,
      active: true,
    } as never;

    const existing = await db.orm.public.Media.select("id").where({ key: job.key }).first();
    if (existing) {
      await db.orm.public.Media.where({ id: existing.id }).update(payload);
    } else {
      await db.orm.public.Media.create({ id: crypto.randomUUID(), ...payload });
    }
  }
  console.log(`\nUpload: ${uploaded} new, ${skipped} already present (${jobs.length} total).`);
}

/** Point the content rows at the current URLs — the public base when it is
 * configured, otherwise the app's own `/media/<key>` proxy. */
async function syncRowUrls(jobs: Job[]) {
  const base = publicBaseUrl();
  for (const job of jobs) {
    await db.orm.public[job.table]
      .where({ id: job.ownerId })
      .update({ imageUrl: mediaUrl(job.key) });
  }
  console.log(
    `DB sync: ${jobs.length} imageUrl values now point at ${
      base ? `${base}/…` : "the /media/<key> proxy"
    }.`
  );
}

/** Fail unless every image made it to the bucket. */
async function assertAllUploaded(jobs: Job[]) {
  for (const job of jobs) {
    if (!(await objectExists(job.key))) {
      throw new Error(`${job.key} is not in the bucket — aborting prune`);
    }
  }
  console.log(`Verified all ${jobs.length} objects exist in ${R2_BUCKET}.`);
}

async function prune(jobs: Job[]) {
  await assertAllUploaded(jobs);

  const base = publicBaseUrl();
  if (base) {
    const unsynced: string[] = [];
    for (const job of jobs) {
      const row = await db.orm.public[job.table]
        .select("imageUrl")
        .where({ id: job.ownerId })
        .first();
      if (row?.imageUrl && row.imageUrl !== mediaUrl(job.key)) unsynced.push(job.key);
    }
    if (unsynced.length > 0) {
      throw new Error(
        `${unsynced.length} rows still point at the old paths — run "npm run images:upload" first`
      );
    }
  } else {
    console.log("Note: pruning without a public base URL — DB rows point at the /media proxy.");
  }

  // Keep the attribution record next to the source.
  try {
    await copyFile(path.join(IMAGE_DIR, "CREDITS.md"), ROOT_CREDITS);
    console.log("Credits moved to ./CREDITS.md");
  } catch {
    // no credits file — nothing to keep
  }

  // Remove the bucket probe object from the connectivity test.
  try {
    if (await objectExists("__probe__/hello.txt")) {
      await deleteObject("__probe__/hello.txt");
      console.log("Deleted bucket probe object __probe__/hello.txt");
    }
  } catch {
    // probe object already gone
  }

  try {
    const info = await stat(IMAGE_DIR);
    if (info.isDirectory()) {
      await rm(IMAGE_DIR, { recursive: true, force: true });
      console.log("Deleted public/images/ — images now live only in R2.");
    }
  } catch {
    // already pruned — nothing to delete
  }
}

async function main() {
  const mode = process.argv[2] ?? "upload";
  const local = await collectJobs();
  console.log(`${local.length} images matched to content rows.\n`);

  // Once the local copies are pruned, the `Media` rows are the source of truth.
  const jobs = local.length > 0 ? local : await mediaJobs();

  if (mode === "prune") {
    await prune(jobs);
  } else {
    await uploadJobs(jobs);
    await syncRowUrls(jobs);
  }

  const counts = await db.orm.public.Media.select("key").all();
  console.log(`\nMedia rows: ${counts.length}`);
}

main()
  .catch((err) => {
    console.error("R2 image migration failed:", err);
    process.exit(1);
  })
  .finally(() => db.close());
