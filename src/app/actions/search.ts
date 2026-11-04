"use server";

import { db } from "@/prisma/db";

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
