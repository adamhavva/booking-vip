"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import BookingPanel from "@/components/sections/BookingPanel";
import { loadDraft } from "@/lib/searchDraft";
import { formatDateLabel, localeFor } from "@/lib/format";
import { copyText } from "@/lib/content";
import { useSearchFields } from "@/lib/useContent";
import type { ServicePage } from "@/types";
import { useLocale } from "@/components/providers/LocaleProvider";

/**
 * Reads the search the user submitted on the home page (query string), with
 * the locally saved draft as fallback, then shows a summary of it above the
 * booking form.
 *
 * The fields come from the database through `useSearchFields`, the same
 * source the home form renders from, so a field added there shows up here
 * too. (They used to be looked up in the static map by `service.eyebrow`,
 * which is the short code — "VIP" — while the map is keyed by the display
 * label, so the summary never rendered.)
 */
export default function ServiceSearchSection({
  service,
}: {
  service: ServicePage;
}) {
  const params = useSearchParams();
  const { t, lang } = useLocale();
  const [saved, setSaved] = useState<Record<string, string> | null>(null);

  const dbFields = useSearchFields(service.slug);

  /** The fields with their copy resolved for the active language. */
  const fields = useMemo(
    () =>
      dbFields.map((f) => ({
        key: f.key,
        kind: f.kind,
        label: copyText(f.label, lang),
      })),
    [dbFields, lang]
  );

  // Fallback: the last search saved on this device. The draft records the
  // display label of the line, which is `title`, not the short `eyebrow`.
  useEffect(() => {
    const draft = loadDraft();
    if (draft && draft.service === service.title) {
      setSaved(draft.values);
    }
  }, [service.title]);

  const values = useMemo(() => {
    const fromUrl: Record<string, string> = {};
    for (const f of fields) {
      const v = params.get(f.key);
      if (v) fromUrl[f.key] = v;
      // A date field keeps its hour in a sibling key (`date` → `dateTime`).
      if (f.kind === "datetime") {
        const time = params.get(`${f.key}Time`);
        if (time) fromUrl[`${f.key}Time`] = time;
      }
    }
    if (Object.keys(fromUrl).length > 0) return { values: fromUrl, source: "url" as const };
    if (saved && Object.keys(saved).length > 0)
      return { values: saved, source: "saved" as const };
    return { values: {} as Record<string, string>, source: "none" as const };
  }, [fields, params, saved]);

  const entries = fields
    .map((f) => {
      // A date field carries its hour in a sibling key — show them together.
      if (f.kind === "datetime") {
        const date = values.values[f.key];
        const time = values.values[`${f.key}Time`];
        if (!date && !time) return null;
        return [
          f.label,
          [formatDateLabel(date, localeFor(lang)), time].filter(Boolean).join(", "),
        ] as const;
      }

      const value = values.values[f.key];
      if (!value) return null;
      if (f.kind === "date") return [f.label, formatDateLabel(value, localeFor(lang))] as const;
      return [f.label, value] as const;
    })
    .filter((entry): entry is readonly [string, string] => entry !== null);

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
