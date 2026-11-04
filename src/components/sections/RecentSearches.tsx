"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import { getRecentSearches, type StoredSearch } from "@/app/actions/search";
import { serviceSearchFields } from "@/data/services";
import { loadRecent } from "@/lib/searchDraft";

type Entry = {
  key: string;
  service: string;
  href: string;
  values: Record<string, string>;
};

/** Build the target URL for a stored search, carrying its values along. */
function searchHref(service: string, href: string, values: Record<string, string>) {
  const params = new URLSearchParams();
  for (const field of serviceSearchFields[service] ?? []) {
    const v = values[field.key];
    if (v) params.set(field.key, v);
  }
  params.set("service", service);
  return `${href}?${params.toString()}`;
}

function summarize(service: string, values: Record<string, string>) {
  const fields = serviceSearchFields[service] ?? [];
  const parts = fields
    .map((f) => values[f.key])
    .filter(Boolean)
    .slice(0, 3);
  return parts.length > 0 ? parts.join(" · ") : service;
}

/**
 * Recent searches, read from the database (cross-device). Falls back to the
 * searches stored in this browser when the database has nothing (or is
 * unreachable).
 */
export default function RecentSearches() {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    let active = true;

    getRecentSearches(5).then((rows: StoredSearch[]) => {
      if (!active) return;
      if (rows.length > 0) {
        setEntries(
          rows.map((r) => ({
            key: r.id,
            service: r.service,
            href: r.href,
            values: r.values,
          }))
        );
        return;
      }
      // No rows in the database — use the local history.
      setEntries(
        loadRecent().map((d, i) => ({
          key: `local-${i}`,
          service: d.service,
          href: d.href,
          values: d.values,
        }))
      );
    });

    return () => {
      active = false;
    };
  }, []);

  if (entries.length === 0) return null;

  return (
    <Container as="section" className="pb-2 pt-6">
      <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-muted">
        Pencarian terakhir 🕘
      </h2>
      <ul className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {entries.map((e) => (
          <li key={e.key} className="shrink-0">
            <Link
              href={searchHref(e.service, e.href, e.values)}
              className="flex w-[240px] flex-col rounded-xl border border-line bg-white p-3 transition-shadow hover:shadow-md"
            >
              <span className="text-[11px] font-semibold uppercase tracking-wide text-brand">
                {e.service}
              </span>
              <span className="mt-1 line-clamp-2 text-xs text-muted">
                {summarize(e.service, e.values)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
