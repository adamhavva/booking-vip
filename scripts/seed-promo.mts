#!/usr/bin/env node --experimental-strip-types
// Idempotent seed for the stacked-discount campaigns ("diskon akumulasi").
//
// Storage is the Setting key `promo.campaigns` — a JSON array of
// `{ key, name, lineSlug, productIds, active }`. No percent is stored; the
// readers recompute the averaged discount from the price cents on every read.
//
// Run:  node --experimental-strip-types scripts/seed-promo.mts
//   (or `npm run db:seed-promo` from repo root)
//
// Like scripts/seed.mts, this only inserts missing rows — an existing
// campaign (or an operator-edited Setting value) is never overwritten.
//
// ⚠ SEED REGISTRATION — scripts/seed-content.mts deletes every Setting key
// it does not know about. For `promo.campaigns` to survive `npm run db:seed`,
// its `adminManagedSettingKeys` list (scripts/seed-content.mts, currently
// line 598) must include "promo.campaigns", e.g.:
//
//   const adminManagedSettingKeys = ["home.popup", "loyalty.rewards", "promo.campaigns"];
//
// That file is owned by another change; until the key is registered there,
// running `npm run db:seed` will wipe this key (re-run this script afterwards).

import "dotenv/config";
import { db } from "../src/prisma/db.ts";
import {
  netPriceFromPackages,
  productDiscountPercent,
} from "../src/lib/discount.ts";

const SETTING_KEY = "promo.campaigns";
const CAMPAIGN_KEY = "diskon-akumulasi-vip";

type Campaign = {
  key: string;
  name: string;
  lineSlug: string;
  productIds: string[];
  active: boolean;
};

function parseCampaigns(value: unknown): Campaign[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Campaign =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as Campaign).key === "string" &&
      typeof (item as Campaign).name === "string" &&
      typeof (item as Campaign).lineSlug === "string" &&
      Array.isArray((item as Campaign).productIds),
  );
}

async function main() {
  const row = await db.orm.public.Setting
    .select("value")
    .where({ key: SETTING_KEY })
    .first();
  const campaigns = parseCampaigns(row?.value);

  if (campaigns.some((c) => c.key === CAMPAIGN_KEY)) {
    console.log(`[seed-promo] campaign "${CAMPAIGN_KEY}" already exists — nothing to do.`);
    return;
  }

  // Prefer the VIP line; fall back to the first active line.
  const lines = await db.orm.public.ServiceLine
    .select("id", "slug", "label")
    .where((f) => f.active.eq(true))
    .orderBy((f) => f.sortOrder.asc())
    .all();
  const line = lines.find((l) => l.slug === "vip-service") ?? lines[0];
  if (!line) {
    console.log("[seed-promo] no service line found — run `npm run db:seed` first.");
    return;
  }

  const products = await db.orm.public.Product
    .select("id", "title", "fromPriceUsdCents")
    .where((f) => f.lineId.eq(line.id))
    .where((f) => f.active.eq(true))
    .where((f) => f.isAddOn.eq(false))
    .orderBy((f) => f.title.asc())
    .all();
  if (products.length === 0) {
    console.log(`[seed-promo] no products in line "${line.slug}" — nothing to seed.`);
    return;
  }

  const packages = await db.orm.public.ProductPackage
    .select("productId", "unitKind", "adultUsdCents", "unitUsdCents", "active")
    .where((f) => f.productId.in(products.map((p) => p.id)))
    .all();

  // Rank by the product's own discount so the demo campaign shows a
  // meaningful averaged percent; products without a discount count as 0.
  const ranked = products
    .map((p) => {
      const net = netPriceFromPackages(
        packages.filter((pkg) => pkg.productId === p.id),
      );
      return { ...p, percent: productDiscountPercent(p.fromPriceUsdCents, net) };
    })
    .sort((a, b) => b.percent - a.percent);
  const members = ranked.slice(0, 2);

  campaigns.push({
    key: CAMPAIGN_KEY,
    name: "Diskon Akumulasi VIP",
    lineSlug: line.slug,
    productIds: members.map((p) => p.id),
    active: true,
  });

  if (row) {
    await db.orm.public.Setting
      .where({ key: SETTING_KEY })
      .update({ value: campaigns as never });
  } else {
    await db.orm.public.Setting.create({
      key: SETTING_KEY,
      value: campaigns as never,
    });
  }

  const avg =
    members.length > 0
      ? Math.round(members.reduce((sum, p) => sum + p.percent, 0) / members.length)
      : 0;
  console.log(
    `[seed-promo] created campaign "${CAMPAIGN_KEY}" on line "${line.slug}" ` +
      `with ${members.length} product(s): ${members.map((p) => `${p.title} (${p.percent}%)`).join(", ")} ` +
      `→ averaged ${avg}%.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[seed-promo] failed:", err);
    process.exit(1);
  });