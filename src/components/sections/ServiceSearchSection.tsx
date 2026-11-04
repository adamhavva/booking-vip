"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import BookingPanel from "@/components/sections/BookingPanel";
import { serviceSearchFields } from "@/data/services";
import { loadDraft } from "@/lib/searchDraft";
import type { ServicePage } from "@/types";
import { useLocale } from "@/components/providers/LocaleProvider";

/**
 * Reads the search the user submitted on the home page (query string), with
 * the locally saved draft as fallback, then shows a summary of it above the
 * booking form.
 */
export default function ServiceSearchSection({
  service,
}: {
  service: ServicePage;
}) {
  const params = useSearchParams();
  const { t } = useLocale();
  const [saved, setSaved] = useState<Record<string, string> | null>(null);

  const fields = serviceSearchFields[service.eyebrow] ?? [];

  // Fallback: the last search saved on this device.
  useEffect(() => {
    const draft = loadDraft();
    if (draft && draft.service === service.eyebrow) {
      setSaved(draft.values);
    }
  }, [service.eyebrow]);

  const values = useMemo(() => {
    const fromUrl: Record<string, string> = {};
    for (const f of fields) {
      const v = params.get(f.key);
      if (v) fromUrl[f.key] = v;
    }
    if (Object.keys(fromUrl).length > 0) return { values: fromUrl, source: "url" as const };
    if (saved && Object.keys(saved).length > 0)
      return { values: saved, source: "saved" as const };
    return { values: {} as Record<string, string>, source: "none" as const };
  }, [fields, params, saved]);

  const entries = fields
    .map((f) => [f.label, values.values[f.key]] as const)
    .filter(([, v]) => Boolean(v));

  return (
    <div className="space-y-4">
      {entries.length > 0 && (
        <div className="rounded-2xl border border-brand/20 bg-brand-soft p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-ink">
              {values.source === "url" ? t("serviceSearch.yourSearch") : t("serviceSearch.lastSaved")}
            </h3>
            <Link
              href="/"
              className="text-xs font-semibold text-brand hover:underline"
            >
              {t("serviceSearch.editSearch")}
            </Link>
          </div>

          <dl className="mt-3 space-y-1.5">
            {entries.map(([label, value]) => (
              <div key={label} className="flex items-baseline gap-2 text-xs">
                <dt className="w-24 shrink-0 text-muted">{label}</dt>
                <dd className="font-semibold text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          {values.source === "saved" && (
            <p className="mt-3 text-[11px] text-muted">
              {t("serviceSearch.savedNote")}
            </p>
          )}
        </div>
      )}

      <BookingPanel service={service} initial={values.values} />
    </div>
  );
}
