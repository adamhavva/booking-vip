"use server";

import { db } from "@/prisma/db";
import { getAdminSession } from "@/lib/admin/session";
import {
  averageDiscountPercent,
  netPriceFromPackages,
  productDiscountPercent,
} from "@/lib/discount";
import type { AdminDeleteResult, AdminSaveResult } from "./admin-crud";

/**
 * Stacked discount campaigns ("diskon akumulasi").
 *
 * A campaign bundles products of one service line; the badge it produces is
 * the **average** of the member products' discounts — a 50% product plus a
 * 60% product displays 55%, never 110%. The math lives in the pure helpers
 * of `src/lib/discount.ts`, shared with the admin live preview.
 *
 * Storage is the `Setting` key `promo.campaigns` — a JSON array of
 * `{ key, name, lineSlug, productIds, active }`. No percent is ever stored:
 * every read recomputes it from the current price cents, so the server is
 * always the source of truth. The value is an array (never a `%`/`$` string),
 * so `listTaxSettings` can never mistake it for a tax.
 *
 * NOTE: `scripts/seed-content.mts` deletes every Setting key it does not know
 * about. `promo.campaigns` must be registered in `adminManagedSettingKeys`
 * there (see scripts/seed-promo.mts for the exact line) or `npm run db:seed`
 * will wipe it.
 */

// A "use server" module may only export async functions, so the key stays private.
const CAMPAIGNS_SETTING_KEY = "promo.campaigns";

/** One campaign as stored in the Setting value. */
export type DiscountCampaign = {
  key: string;
  name: string;
  lineSlug: string;
  productIds: string[];
  active: boolean;
};

/** One campaign as the admin list shows it — percent recomputed, never stored. */
export type CampaignRow = {
  key: string;
  name: string;
  lineSlug: string;
  lineLabel: string;
  productIds: string[];
  memberCount: number;
  /** The averaged discount of the member products, in whole percent. */
  percent: number;
  active: boolean;
};

/** The reference data the campaign form needs (lines + scoped products). */
export type CampaignReference = {
  lines: { slug: string; label: string }[];
  products: {
    id: string;
    title: string;
    lineSlug: string;
    fromUsdCents: number | null;
    netUsdCents: number | null;
    /** The product's own discount, recomputed from the cents. */
    percent: number;
  }[];
};

/**
 * The admin gate — same two checks as every other admin action:
 * `ADMIN_ENABLED=1` and a valid admin session.
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

// ---------------------------------------------------------------------------
// Storage — the Setting row
// ---------------------------------------------------------------------------

/** Parse the stored JSON defensively — anything malformed is dropped. */
function parseCampaigns(value: unknown): DiscountCampaign[] {
  if (!Array.isArray(value)) return [];
  const campaigns: DiscountCampaign[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) continue;
    const record = item as Record<string, unknown>;
    const key = typeof record.key === "string" ? record.key.trim() : "";
    const name = typeof record.name === "string" ? record.name : "";
    const lineSlug = typeof record.lineSlug === "string" ? record.lineSlug : "";
    if (!key || !name || !lineSlug) continue;
    const productIds = Array.isArray(record.productIds)
      ? [...new Set(record.productIds.map((id) => String(id).trim()).filter(Boolean))]
      : [];
    campaigns.push({
      key,
      name,
      lineSlug,
      productIds,
      active: record.active === true,
    });
  }
  return campaigns;
}

async function readCampaigns(): Promise<DiscountCampaign[]> {
  const row = await db.orm.public.Setting
    .select("value")
    .where({ key: CAMPAIGNS_SETTING_KEY })
    .first();
  return parseCampaigns(row?.value);
}

async function writeCampaigns(campaigns: DiscountCampaign[]): Promise<void> {
  const existing = await db.orm.public.Setting
    .select("key")
    .where({ key: CAMPAIGNS_SETTING_KEY })
    .first();
  if (existing) {
    await db.orm.public.Setting
      .where({ key: CAMPAIGNS_SETTING_KEY })
      .update({ value: campaigns as never });
  } else {
    await db.orm.public.Setting.create({
      key: CAMPAIGNS_SETTING_KEY,
      value: campaigns as never,
    });
  }
}

// ---------------------------------------------------------------------------
// Prices — recomputed on every read
// ---------------------------------------------------------------------------

type ProductPrice = {
  id: string;
  title: string;
  lineSlug: string;
  fromUsdCents: number | null;
  netUsdCents: number | null;
  percent: number;
};

/**
 * Every product with its current "from" price, its net price (the cheapest
 * active package) and the resulting percent. One loader for all readers so
 * the list, the form preview and the public badge always agree.
 */
async function loadProductPrices(): Promise<Map<string, ProductPrice>> {
  const [products, packages, lines] = await Promise.all([
    db.orm.public.Product
      .select("id", "title", "lineId", "fromPriceUsdCents")
      .all(),
    db.orm.public.ProductPackage
      .select("productId", "unitKind", "adultUsdCents", "unitUsdCents", "active")
      .all(),
    db.orm.public.ServiceLine.select("id", "slug").all(),
  ]);

  const lineSlugs = new Map(lines.map((l) => [l.id, l.slug]));
  const packagesByProduct = new Map<string, typeof packages>();
  for (const pkg of packages) {
    const list = packagesByProduct.get(pkg.productId) ?? [];
    list.push(pkg);
    packagesByProduct.set(pkg.productId, list);
  }

  const result = new Map<string, ProductPrice>();
  for (const product of products) {
    const netUsdCents = netPriceFromPackages(
      packagesByProduct.get(product.id) ?? [],
    );
    result.set(product.id, {
      id: product.id,
      title: product.title,
      lineSlug: lineSlugs.get(product.lineId) ?? "",
      fromUsdCents: product.fromPriceUsdCents,
      netUsdCents,
      percent: productDiscountPercent(product.fromPriceUsdCents, netUsdCents),
    });
  }
  return result;
}

/** The averaged percent of a campaign's members — unknown products count as 0. */
function campaignPercent(
  campaign: DiscountCampaign,
  prices: Map<string, ProductPrice>,
): number {
  return averageDiscountPercent(
    campaign.productIds.map((id) => prices.get(id)?.percent ?? 0),
  );
}

// ---------------------------------------------------------------------------
// Admin readers
// ---------------------------------------------------------------------------

/** All campaigns with their recomputed averaged percent. */
export async function listCampaigns(): Promise<CampaignRow[]> {
  await assertAdmin();

  const [campaigns, prices, lines] = await Promise.all([
    readCampaigns(),
    loadProductPrices(),
    db.orm.public.ServiceLine.select("slug", "label").all(),
  ]);
  const lineLabels = new Map(lines.map((l) => [l.slug, l.label]));

  return campaigns.map((campaign) => ({
    key: campaign.key,
    name: campaign.name,
    lineSlug: campaign.lineSlug,
    lineLabel: lineLabels.get(campaign.lineSlug) ?? campaign.lineSlug,
    productIds: campaign.productIds,
    memberCount: campaign.productIds.length,
    percent: campaignPercent(campaign, prices),
    active: campaign.active,
  }));
}

/**
 * The form's reference data: the service lines and every active, non-add-on
 * product with its price cents and percent, so the client preview can run
 * the exact same pure helpers as the server.
 */
export async function getCampaignReference(): Promise<CampaignReference> {
  await assertAdmin();

  const [lines, products, prices] = await Promise.all([
    db.orm.public.ServiceLine
      .select("slug", "label")
      .where((f) => f.active.eq(true))
      .orderBy((f) => f.sortOrder.asc())
      .all(),
    db.orm.public.Product
      .select("id")
      .where((f) => f.active.eq(true))
      .where((f) => f.isAddOn.eq(false))
      .orderBy((f) => f.title.asc())
      .all(),
    loadProductPrices(),
  ]);

  return {
    lines: lines.map((l) => ({ slug: l.slug, label: l.label })),
    products: products
      .map((p) => prices.get(p.id))
      .filter((p): p is ProductPrice => p != null)
      .map((p) => ({
        id: p.id,
        title: p.title,
        lineSlug: p.lineSlug,
        fromUsdCents: p.fromUsdCents,
        netUsdCents: p.netUsdCents,
        percent: p.percent,
      })),
  };
}

// ---------------------------------------------------------------------------
// Admin mutations — structured results, friendly Indonesian messages
// ---------------------------------------------------------------------------

function fail(field: string, error: string): AdminSaveResult {
  return { ok: false, error, field };
}

/** "Diskon Akumulasi VIP" → "diskon-akumulasi-vip" */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Create or update a campaign.
 *
 * `key` is absent for a create and present for an update. The answer is a
 * structured result so a validation failure lands on the field that caused
 * it. Only the membership is stored — the percent is always recomputed.
 */
export async function saveCampaign(input: {
  key?: string;
  values: Record<string, unknown>;
}): Promise<AdminSaveResult> {
  await assertAdmin();

  try {
    const values = input.values ?? {};
    const name = typeof values.name === "string" ? values.name.trim() : "";
    const lineSlug =
      typeof values.lineSlug === "string" ? values.lineSlug.trim() : "";
    const productIds = Array.isArray(values.productIds)
      ? [...new Set(values.productIds.map((id) => String(id).trim()).filter(Boolean))]
      : [];
    const active = values.active === true;

    if (!name) return fail("name", "Nama kampanye wajib diisi.");
    if (!lineSlug) return fail("lineSlug", "Service line wajib dipilih.");

    const line = await db.orm.public.ServiceLine
      .select("id", "slug")
      .where({ slug: lineSlug })
      .first();
    if (!line) return fail("lineSlug", "Service line tidak ditemukan.");

    if (productIds.length === 0) {
      return fail("productIds", "Pilih minimal satu produk untuk kampanye ini.");
    }

    // Every member must exist and belong to the chosen line.
    const members = await db.orm.public.Product
      .select("id", "lineId")
      .where((f) => f.id.in(productIds))
      .all();
    if (members.length !== productIds.length) {
      return fail("productIds", "Ada produk yang tidak ditemukan. Muat ulang halaman dan coba lagi.");
    }
    if (members.some((m) => m.lineId !== line.id)) {
      return fail("productIds", "Semua produk harus berasal dari service line yang dipilih.");
    }

    const campaigns = await readCampaigns();

    if (input.key) {
      const index = campaigns.findIndex((c) => c.key === input.key);
      if (index === -1) {
        return { ok: false, error: "Kampanye tidak ditemukan. Mungkin sudah dihapus." };
      }
      campaigns[index] = { key: input.key, name, lineSlug, productIds, active };
    } else {
      // A readable, unique key derived from the name.
      const base = slugify(name) || "kampanye";
      let key = base;
      for (let n = 2; campaigns.some((c) => c.key === key); n++) {
        key = `${base}-${n}`;
      }
      campaigns.push({ key, name, lineSlug, productIds, active });
    }

    await writeCampaigns(campaigns);
    return { ok: true, message: "Kampanye diskon berhasil disimpan." };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menyimpan kampanye";
    return { ok: false, error: message };
  }
}

/**
 * Delete a campaign — but only when the operator typed its exact name.
 *
 * The comparison is character-for-character (no trimming, no case folding),
 * the same rule as `deleteAdminEntity`.
 */
export async function deleteCampaign(input: {
  key: string;
  confirmName: string;
}): Promise<AdminDeleteResult> {
  await assertAdmin();

  if (!input.key) {
    return { ok: false, error: "Data tidak ditemukan." };
  }

  const campaigns = await readCampaigns();
  const campaign = campaigns.find((c) => c.key === input.key);
  if (!campaign) {
    return { ok: false, error: "Data tidak ditemukan." };
  }

  if (input.confirmName !== campaign.name) {
    return {
      ok: false,
      error: "Nama yang diketik tidak cocok dengan nama data. Penghapusan dibatalkan.",
    };
  }

  try {
    await writeCampaigns(campaigns.filter((c) => c.key !== input.key));
    return { ok: true, message: "Kampanye diskon berhasil dihapus." };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus kampanye";
    return { ok: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Public reader
// ---------------------------------------------------------------------------

/**
 * The averaged discount per service line, for the public badges.
 *
 * Only active campaigns with at least one member contribute; every percent
 * is recomputed from the current price cents (a product whose "from" price
 * is missing or not above its net price contributes 0). When several
 * campaigns share a line, their member percents are averaged together —
 * again averaged, never summed. Returns `{}` on any error so the UI can
 * fall back, like the other public readers.
 */
export async function getCampaignDiscounts(): Promise<Record<string, number>> {
  try {
    const campaigns = await readCampaigns();
    const relevant = campaigns.filter(
      (c) => c.active && c.productIds.length > 0,
    );
    if (relevant.length === 0) return {};

    const prices = await loadProductPrices();
    const percentsByLine = new Map<string, number[]>();
    for (const campaign of relevant) {
      const list = percentsByLine.get(campaign.lineSlug) ?? [];
      for (const id of campaign.productIds) {
        list.push(prices.get(id)?.percent ?? 0);
      }
      percentsByLine.set(campaign.lineSlug, list);
    }

    const result: Record<string, number> = {};
    for (const [lineSlug, percents] of percentsByLine) {
      if (percents.length === 0) continue;
      result[lineSlug] = averageDiscountPercent(percents);
    }
    return result;
  } catch (error) {
    console.error("[promo] could not load campaign discounts", error);
    return {};
  }
}