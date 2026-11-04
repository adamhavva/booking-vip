"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Container from "@/components/ui/Container";
import Thumb from "@/components/ui/Thumb";
import { ArrowRightIcon, SearchIcon } from "@/components/icons";
import { searchAll } from "@/data/search";
import { useLocale } from "@/components/providers/LocaleProvider";

export default function SearchResults() {
  const params = useSearchParams();
  const router = useRouter();
  const q = params.get("q") ?? "";
  const [query, setQuery] = useState(q);
  const { formatMoney, t } = useLocale();

  const results = useMemo(() => searchAll(q), [q]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search");
  };

  return (
    <Container as="section" className="py-8">
      <h1 className="text-xl font-extrabold text-ink md:text-2xl">
        {t("search.title")}
      </h1>

      <form onSubmit={submit} className="relative mt-4 max-w-lg">
        <SearchIcon
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          width={18}
          height={18}
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search.placeholder")}
          aria-label={t("search.ariaLabel")}
          className="h-11 w-full rounded-full border border-line bg-white pl-11 pr-4 text-sm text-ink outline-none focus:border-brand"
        />
      </form>

      {q && (
        <p className="mt-4 text-sm text-muted">
          {t("search.resultsCount", { n: results.length, plural: results.length === 1 ? "" : "s" })}{" "}
          <span className="font-semibold text-ink">&ldquo;{q}&rdquo;</span>
        </p>
      )}

      {!q && (
        <p className="mt-6 text-sm text-muted">
          {t("search.emptyHint")}
        </p>
      )}

      <ul className="mt-4 space-y-3">
        {results.map((r) => (
          <li key={`${r.kind}-${r.title}`}>
            <Link
              href={r.href}
              className="flex items-center gap-4 rounded-xl border border-line bg-white p-3 transition-shadow hover:shadow-md"
            >
              <Thumb tone={r.tone} className="h-14 w-20 shrink-0 rounded-lg" />
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-brand">
                  {r.kind}
                </span>
                <span className="block truncate text-sm font-semibold text-ink">
                  {r.title}
                </span>
                <span className="flex items-center gap-2">
                  <span className="truncate text-xs text-muted">
                    {r.subtitle}
                  </span>
                  {typeof r.priceUsd === "number" && (
                    <span className="shrink-0 text-xs font-semibold text-danger">
                      {formatMoney(r.priceUsd)}
                    </span>
                  )}
                </span>
              </span>
              <ArrowRightIcon
                width={18}
                height={18}
                className="shrink-0 text-muted"
              />
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
