"use server";

import { db } from "@/prisma/db";
import type { SearchResult } from "@/types";

export type StoredSearch = {
  id: string;
  service: string;
  href: string;
  values: Record<string, string>;
  createdAt: string;
};

export type SearchInput = {
  service: string;
  href: string;
  values: Record<string, string>;
};

/** Rows older than this are pruned on write. */
const RETENTION_DAYS = 30;

function sameValues(
  a: Record<string, string>,
  b: Record<string, string>
): boolean {
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((k) => a[k] === b[k]);
}

/** Delete rows older than the retention window. */
async function pruneOldSearches(): Promise<void> {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  await db.orm.public.SearchLog
    .where((f) => f.createdAt.lt(cutoff))
    .deleteAll();
}

/**
 * Persists a submitted search. Failures are swallowed so the browsing
 * experience never depends on the database being reachable — the client
 * keeps its own local copy of the search either way.
 *
 * An identical search (same service and same field values) is not stored
 * twice: the existing row is refreshed so it counts as recent.
 */
export async function logSearch(
  input: SearchInput
): Promise<{ ok: boolean; deduped?: boolean }> {
  try {
    const existing = await db.orm.public.SearchLog
      .select("id", "values", "createdAt")
      .where((f) => f.service.eq(input.service))
      .where((f) => f.href.eq(input.href))
      .orderBy((f) => f.createdAt.desc())
      .limit(1)
      .all();

    const latest = existing[0];
    if (
      latest &&
      sameValues(
        (latest.values ?? {}) as Record<string, string>,
        input.values
      )
    ) {
      await db.orm.public.SearchLog
        .where({ id: latest.id })
        .update({ createdAt: new Date() });
      return { ok: true, deduped: true };
    }

    await db.orm.public.SearchLog.create({
      id: crypto.randomUUID(),
      service: input.service,
      href: input.href,
      values: input.values,
    });

    await pruneOldSearches();

    return { ok: true, deduped: false };
  } catch (error) {
    console.error("[search] could not store search", error);
    return { ok: false };
  }
}

/** The most recent searches, newest first. */
export async function getRecentSearches(
  limit = 5
): Promise<StoredSearch[]> {
  try {
    const rows = await db.orm.public.SearchLog
      .select("id", "service", "href", "values", "createdAt")
      .orderBy((f) => f.createdAt.desc())
      .limit(limit)
      .all();

    return rows.map((row) => ({
      id: row.id,
      service: row.service,
      href: row.href,
      values: (row.values ?? {}) as Record<string, string>,
      createdAt: new Date(row.createdAt).toISOString(),
    }));
  } catch (error) {
    console.error("[search] could not load recent searches", error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Catalog search
// ---------------------------------------------------------------------------

/**
 * Free-text search across the catalog.
 *
 * Matches products on title/description and promos on their copy, then builds
 * the result links from the service line each row belongs to. Returns an
 * empty list on any error so the search page keeps rendering.
 */
export async function searchCatalog(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  try {
    const lines = await db.orm.public.ServiceLine
      .select("id", "slug", "label")
      .all();
    const lineById = new Map(lines.map((l) => [l.id, l]));

    const products = await db.orm.public.Product
      .select(
        "slug",
        "title",
        "description",
        "tone",
        "lineId",
        "serviceTypeId",
        "airportId",
        "fromPriceUsdCents",
      )
      .where((f) => f.active.eq(true))
      .where((f) => f.isAddOn.eq(false))
      .all();

    const needle = q.toLowerCase();

    const matched = products.filter((p) => {
      const line = lineById.get(p.lineId);
      return (
        p.title.toLowerCase().includes(needle) ||
        p.description.toLowerCase().includes(needle) ||
        (line?.label ?? "").toLowerCase().includes(needle)
      );
    });

    // The place of each match, for the subtitle.
    const placeIds = [
      ...new Set(matched.map((p) => p.airportId).filter((id): id is string => id != null)),
    ];
    const placeById = new Map<string, string>();
    if (placeIds.length > 0) {
      const places = await db.orm.public.Airport
        .select("id", "name", "city")
        .where((f) => f.id.in(placeIds))
        .all();
      for (const place of places) {
        placeById.set(place.id, place.city || place.name);
      }
    }

    const results: SearchResult[] = matched.flatMap((p) => {
      const line = lineById.get(p.lineId);
      if (!line) return [];
      return [
        {
          kind: line.label,
          title: p.title,
          subtitle: p.airportId ? (placeById.get(p.airportId) ?? "") : p.description,
          href: `/${line.slug}/${p.slug}`,
          tone: p.tone,
          priceUsd:
            p.fromPriceUsdCents != null ? p.fromPriceUsdCents / 100 : undefined,
        },
      ];
    });

    // Promos matching the query, linking to the line they belong to.
    const promos = await db.orm.public.Promo
      .select("slug", "titleEn", "subtitleEn", "tone", "lineId")
      .where((f) => f.active.eq(true))
      .all();

    for (const promo of promos) {
      const haystack = `${promo.titleEn} ${promo.subtitleEn ?? ""}`.toLowerCase();
      if (!haystack.includes(needle)) continue;
      const line = promo.lineId ? lineById.get(promo.lineId) : null;
      results.push({
        kind: "Promo",
        title: promo.titleEn,
        subtitle: promo.subtitleEn ?? "",
        href: line ? `/${line.slug}` : "/",
        tone: promo.tone,
      });
    }

    return results;
  } catch (error) {
    console.error("[search] could not search the catalog", error);
    return [];
  }
}
