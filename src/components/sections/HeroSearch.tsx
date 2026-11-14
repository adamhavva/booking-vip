"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import Container from "@/components/ui/Container";
import Popover from "@/components/ui/Popover";
import PaxPopover, {
  DEFAULT_PAX,
  formatPaxSummary,
  type PaxCounts,
} from "@/components/ui/PaxPopover";
import DateTimePopover from "@/components/ui/DateTimePopover";
import {
  ChevronDown,
  SearchIcon,
  SwapIcon,
  TicketIcon,
} from "@/components/icons";
import CategoryRail from "@/components/sections/hero/CategoryRail";
import { serviceNav, serviceSearchFields } from "@/data/services";
import { loadDraft, rememberSearch } from "@/lib/searchDraft";
import { SERVICE_LABEL_KEYS } from "@/lib/serviceLabels";
import { logSearch } from "@/app/actions/search";
import { getOptions, getPlaceOptions } from "@/app/actions/catalog";
import PlaceOptionList from "@/components/ui/PlaceOptionList";
import { hasPlaceMatch, type PlaceNode } from "@/lib/places";
import { useHomeContent, useSearchFields, useTimeSlots } from "@/lib/useContent";
import type { OptionDTO, ServiceSearchField } from "@/types";
import { useLocale } from "@/components/providers/LocaleProvider";
import { en } from "@/i18n/en";
import type { DictKey } from "@/i18n";

/** Values of one service — a flat map of query-string keys. */
type Values = Record<string, Record<string, string>>;

/** A search field with its copy already resolved to the active language. */
type ResolvedField = {
  key: string;
  label: string;
  placeholder?: string;
  kind: ServiceSearchField["kind"];
};

/**
 * Dictionary overrides for the static field copy, keyed by
 * `hero.field.<prefix>.<field key>` (+ `.ph` for the placeholder). The DB copy
 * wins whenever it carries the active language; these keep the static
 * fallback fully translated instead of leaking English into the ID locale.
 */
const FIELD_COPY_PREFIX: Record<string, string> = {
  "vip-service": "vip",
  transport: "transport",
  "tour-package": "tour",
  evoa: "evoa",
};

const EN_DICT = en as Record<string, string>;

/** The shared look of a field tile — muted label on top, bold value below. */
const TILE =
  "flex min-h-[64px] min-w-0 flex-1 basis-full flex-col justify-center gap-1 rounded-xl bg-canvas px-4 py-2.5 transition-shadow focus-within:ring-2 focus-within:ring-brand/25 sm:basis-[calc(50%-0.375rem)] lg:basis-0";

/**
 * DateTimePopover / PaxPopover render the shared FieldShell (icon + label on
 * the left). These scoped overrides restyle that shell into the hero tile
 * without touching the shared widget: hide the icon slot, 12px label,
 * 15px bold value, focus-within ring.
 */
const WIDGET_TILE = [
  "min-w-0 flex-1 basis-full sm:basis-[calc(50%-0.375rem)] lg:basis-0",
  "[&>div]:h-full [&>div]:min-h-[64px] [&>div]:rounded-xl [&>div]:bg-canvas [&>div]:px-4 [&>div]:py-2.5",
  "[&>div]:transition-shadow [&>div]:focus-within:ring-2 [&>div]:focus-within:ring-brand/25",
  "[&>div>span:first-child]:hidden",
  "[&>div>span:last-child>span:first-child]:text-xs",
  "[&>div>span:last-child>div>button>span]:text-[15px] [&>div>span:last-child>div>button>span]:font-bold",
].join(" ");

/** The draft keys that hold the passenger counts of a `pax` field. */
function paxKeys(key: string) {
  return {
    adults: `${key}Adults`,
    children: `${key}Children`,
    infants: `${key}Infants`,
  };
}

/** Read the passenger counts of a `pax` field out of the value map. */
function readPax(values: Record<string, string>, key: string): PaxCounts {
  const k = paxKeys(key);
  const num = (raw?: string) => {
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  return {
    adults: num(values[k.adults]) || DEFAULT_PAX.adults,
    children: num(values[k.children]),
    infants: num(values[k.infants]),
  };
}

/**
 * A dropdown field — a tile whose trigger opens a searchable list of options.
 */
function SelectField({
  field,
  value,
  options,
  tree,
  onChange,
  searchable,
}: {
  field: ResolvedField;
  value: string;
  options: OptionDTO[];
  /** The place hierarchy — when present the list is rendered in groups. */
  tree?: PlaceNode[];
  onChange: (v: string) => void;
  /** Show a search box above the list (used for the long airport list). */
  searchable?: boolean;
}) {
  const { t } = useLocale();
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q)
    );
  }, [options, query]);

  // The grouped list is used for the place dropdowns (airport / city).
  const hasTree = Boolean(tree && tree.length > 0);
  const treeEmpty = hasTree && !hasPlaceMatch(tree ?? [], query);

  return (
    <div className={TILE}>
      <span className="text-xs text-muted">{field.label}</span>
      <Popover
        ariaLabel={field.label}
        panelClassName="w-[min(20rem,calc(100vw-2rem))]"
        trigger={
          <span
            className={`flex items-center gap-1 text-[15px] font-bold ${
              value ? "text-ink" : "text-muted"
            }`}
          >
            <span className="truncate">
              {value || field.placeholder || field.label}
            </span>
            <ChevronDown width={16} height={16} className="shrink-0 text-muted" />
          </span>
        }
      >
        {({ close }) => (
          <div>
            {searchable && (
              <div className="relative mb-2">
                <SearchIcon
                  width={16}
                  height={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("search.airportSearch")}
                  className="w-full rounded-xl border border-line bg-canvas py-2 pl-9 pr-3 text-sm text-ink outline-none focus:border-brand"
                />
              </div>
            )}

            {hasTree ? (
              <>
                <PlaceOptionList
                  nodes={tree ?? []}
                  query={query}
                  selected={value}
                  onSelect={(v) => {
                    onChange(v);
                    close();
                  }}
                />
                {treeEmpty && (
                  <p className="px-3 py-6 text-center text-xs text-muted">
                    {t("search.noResults")}
                  </p>
                )}
              </>
            ) : (
              <ul className="max-h-60 overflow-y-auto">
                {list.map((opt) => (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(opt.label);
                        close();
                      }}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-canvas ${
                        value === opt.label
                          ? "bg-brand-soft font-semibold text-brand"
                          : "text-ink"
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {value === opt.label && (
                        <span className="text-xs font-bold text-brand">✓</span>
                      )}
                    </button>
                  </li>
                ))}
                {list.length === 0 && (
                  <li className="px-3 py-6 text-center text-xs text-muted">
                    {t("search.noResults")}
                  </li>
                )}
              </ul>
            )}
          </div>
        )}
      </Popover>
    </div>
  );
}

/**
 * The home hero search card — a floating white card with a category rail
 * straddling its top edge. Picking a category switches the field set; the
 * submit still navigates to the service page with the same query-string
 * keys, and every search is persisted locally and in the database.
 */
export default function HeroSearch() {
  const router = useRouter();
  const { t, lang } = useLocale();
  // The selected category, by line slug. The query-string / draft identity
  // stays the canonical service label derived from it.
  const [slug, setSlug] = useState("vip-service");
  const [values, setValues] = useState<Values>({});
  const [resume, setResume] = useState<{ href: string; label: string } | null>(
    null
  );
  const [options, setOptions] = useState<Record<string, OptionDTO[]>>({});
  // The place hierarchies (airport / city) — grouped dropdowns.
  const [placeTrees, setPlaceTrees] = useState<Record<string, PlaceNode[]>>({});
  const [swapSpin, setSwapSpin] = useState(0);
  const [pending, setPending] = useState(false);

  // The service tabs and the fields come from the database; the static copy
  // is the fallback while it loads.
  const timeSlots = useTimeSlots();
  const home = useHomeContent();

  // The hero copy lives in the database as well.
  const heroCopy = useMemo(() => {
    const raw = home?.settings["hero.copy"];
    const picked =
      raw && typeof raw === "object" && !Array.isArray(raw)
        ? ((raw as Record<string, unknown>)[lang === "id" ? "id" : "en"] ??
          (raw as Record<string, unknown>).en)
        : null;
    return (picked ?? {}) as Record<string, string>;
  }, [home, lang]);

  // The canonical service label of the selected category — the identity used
  // by the query string, the draft store and the static field fallback.
  const service = useMemo(
    () => serviceNav.find((s) => s.href === `/${slug}`)?.label ?? slug,
    [slug]
  );

  const dbFields = useSearchFields(slug);

  /** The fields of the selected service, with their copy resolved. */
  const fields = useMemo<ResolvedField[]>(() => {
    const prefix = FIELD_COPY_PREFIX[slug];
    const resolve = (copy: { en: string; id: string | null }, key: string) => {
      if (lang !== "id") return copy.en;
      if (copy.id) return copy.id;
      const dictKey = prefix ? `hero.field.${prefix}.${key}` : null;
      return dictKey && EN_DICT[dictKey] !== undefined
        ? t(dictKey as DictKey)
        : copy.en;
    };
    return dbFields.map((f) => ({
      key: f.key,
      label: resolve(f.label, f.key),
      placeholder: f.placeholder
        ? resolve(f.placeholder, `${f.key}.ph`)
        : undefined,
      kind: f.kind,
    }));
  }, [dbFields, lang, slug, t]);

  // Fetch options for select fields
  useEffect(() => {
    const kinds = new Set<string>();
    for (const f of fields) {
      if (f.kind === "select-airport") kinds.add("airport");
      else if (f.kind === "select-city") kinds.add("city");
      else if (f.kind === "select-service-type") kinds.add("serviceType");
      else if (f.kind === "select-country") kinds.add("country");
    }

    for (const kind of kinds) {
      const key = kind as "airport" | "city" | "serviceType" | "country";
      // Create a unique cache key that includes slug for serviceType
      const cacheKey = key === "serviceType" ? `serviceType:${slug}` : key;
      if (!options[cacheKey]) {
        // Pass slug for serviceType to scope the options
        const opts = key === "serviceType" ? slug : undefined;
        getOptions(key, opts).then((opts) => {
          setOptions((prev) => ({ ...prev, [cacheKey]: opts }));
        });
      }
    }
  }, [fields, slug]);

  // Fetch the place hierarchy for the grouped airport / city dropdowns.
  useEffect(() => {
    const kinds = new Set<"airport" | "city">();
    for (const f of fields) {
      if (f.kind === "select-airport") kinds.add("airport");
      else if (f.kind === "select-city") kinds.add("city");
    }

    for (const kind of kinds) {
      if (placeTrees[kind]) continue;
      getPlaceOptions(kind).then((tree) => {
        setPlaceTrees((prev) => ({ ...prev, [kind]: tree }));
      });
    }
  }, [fields, placeTrees]);

  // Restore the last submitted search (persisted on this device).
  useEffect(() => {
    const draft = loadDraft();
    if (!draft) return;
    setResume({ href: draft.href, label: draft.service });
    const nav = serviceNav.find((s) => s.label === draft.service);
    if (nav) setSlug(nav.href.replace(/^\//, ""));
    if (draft.values && serviceSearchFields[draft.service]) {
      setValues((v) => ({ ...v, [draft.service]: draft.values }));
    }
  }, []);

  const currentValues = useMemo(() => values[service] ?? {}, [service, values]);

  const setField = (key: string, value: string) =>
    setValues((v) => ({
      ...v,
      [service]: { ...currentValues, [key]: value },
    }));

  /** Store the passenger counts plus the readable summary of a `pax` field. */
  const setPax = (key: string, counts: PaxCounts) => {
    const k = paxKeys(key);
    setValues((v) => ({
      ...v,
      [service]: {
        ...currentValues,
        [key]: formatPaxSummary(counts, t),
        [k.adults]: String(counts.adults),
        [k.children]: String(counts.children),
        [k.infants]: String(counts.infants),
      },
    }));
  };

  // The swap button only exists when the active service has two place fields.
  const placeKeys = useMemo(
    () =>
      fields
        .filter((f) => f.kind === "select-airport" || f.kind === "select-city")
        .map((f) => f.key),
    [fields]
  );
  const swapEnabled = placeKeys.length === 2;

  const swap = () => {
    const [a, b] = placeKeys;
    setValues((v) => ({
      ...v,
      [service]: {
        ...currentValues,
        [a]: currentValues[b] ?? "",
        [b]: currentValues[a] ?? "",
      },
    }));
    setSwapSpin((n) => n + 1);
  };

  const submit = () => {
    if (pending) return;
    const href = serviceNav.find((s) => s.label === service)?.href ?? `/${slug}`;
    const params = new URLSearchParams();

    // Only the keys of the fields this form actually has. A restored draft can
    // still carry a field that was since renamed or removed, and without this
    // the stale key would ride along in the URL forever.
    const liveKeys = new Set<string>();
    for (const f of fields) {
      liveKeys.add(f.key);
      if (f.kind === "datetime") liveKeys.add(`${f.key}Time`);
      if (f.kind === "pax") for (const k of Object.values(paxKeys(f.key))) liveKeys.add(k);
    }

    const submitted: Record<string, string> = {};
    for (const [key, value] of Object.entries(currentValues)) {
      if (!value || !liveKeys.has(key)) continue;
      submitted[key] = value;
      params.set(key, value);
    }
    params.set("service", service);

    rememberSearch({
      service,
      href,
      values: submitted,
      savedAt: Date.now(),
    });

    // Also store it in the database (cross-device history). Failures are
    // ignored on purpose — the local copy above is enough to keep going.
    logSearch({ service, href, values: submitted });

    setPending(true);
    // Safety net in case the navigation is interrupted — never leave the
    // button stuck in its pending state.
    setTimeout(() => setPending(false), 1500);
    router.push(`${href}?${params.toString()}`);
  };

  const renderField = (f: ResolvedField) => {
    const value = currentValues[f.key] ?? "";

    switch (f.kind) {
      case "select-airport":
      case "select-city":
      case "select-service-type":
      case "select-country": {
        let fieldOptions: OptionDTO[] = [];
        let tree: PlaceNode[] | undefined;
        if (f.kind === "select-airport") {
          fieldOptions = options.airport ?? [];
          tree = placeTrees.airport;
        } else if (f.kind === "select-city") {
          fieldOptions = options.city ?? [];
          tree = placeTrees.city;
        } else if (f.kind === "select-country") fieldOptions = options.country ?? [];
        else {
          fieldOptions = options[`serviceType:${slug}`] ?? [];
        }

        return (
          <SelectField
            key={f.key}
            field={f}
            value={value}
            options={fieldOptions}
            tree={tree}
            onChange={(v) => setField(f.key, v)}
            searchable={f.kind === "select-airport" || f.kind === "select-city"}
          />
        );
      }

      case "datetime":
        return (
          <div key={f.key} className={WIDGET_TILE}>
            <DateTimePopover
              label={f.label}
              placeholder={f.placeholder}
              date={value}
              time={currentValues[`${f.key}Time`] ?? ""}
              onDate={(v) => setField(f.key, v)}
              onTime={(v) => setField(`${f.key}Time`, v)}
              timeSlots={timeSlots}
            />
          </div>
        );

      case "pax":
        return (
          <div key={f.key} className={WIDGET_TILE}>
            <PaxPopover
              label={f.label}
              placeholder={f.placeholder}
              value={readPax(currentValues, f.key)}
              onChange={(counts) => setPax(f.key, counts)}
              align="right"
            />
          </div>
        );

      default:
        return (
          <div key={f.key} className={TILE}>
            <span className="text-xs text-muted">{f.label}</span>
            <input
              value={value}
              onChange={(e) => setField(f.key, e.target.value)}
              placeholder={f.placeholder}
              aria-label={f.label}
              className="w-full bg-transparent text-[15px] font-bold text-ink outline-none placeholder:font-semibold placeholder:text-muted"
            />
          </div>
        );
    }
  };

  // Field tiles, with the swap button inserted between the two place tiles.
  const tiles: ReactNode[] = [];
  for (const f of fields) {
    if (swapEnabled && f.key === placeKeys[1]) {
      tiles.push(
        <button
          key="swap"
          type="button"
          aria-label={t("hero.swap")}
          title={t("hero.swap")}
          onClick={swap}
          className="flex h-12 w-12 shrink-0 items-center justify-center self-center rounded-lg border border-line bg-white text-ink shadow-sm transition hover:border-brand/50 hover:text-brand active:scale-90"
        >
          <span
            className="flex transition-transform duration-300"
            style={{ transform: `rotate(${swapSpin * 180}deg)` }}
          >
            <SwapIcon width={18} height={18} />
          </span>
        </button>
      );
    }
    tiles.push(renderField(f));
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-hero-from via-hero-via to-hero-to pb-12 pt-40 md:pt-44">
      {/* Layered sky-to-sea backdrop: soft glows + grain, no image assets. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70rem_32rem_at_85%_-12%,rgba(56,189,248,0.30),transparent_65%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(55rem_28rem_at_8%_115%,rgba(45,212,191,0.20),transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='160'%20height='160'%3E%3Cfilter%20id='n'%3E%3CfeTurbulence%20type='fractalNoise'%20baseFrequency='0.9'%20numOctaves='2'/%3E%3C/filter%3E%3Crect%20width='160'%20height='160'%20filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/20 to-transparent" />

      {/* Entrance motion — skipped entirely under prefers-reduced-motion. */}
      <style>{`
        @keyframes heroRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        @keyframes heroTab { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .hero-card { animation: heroRise .55s cubic-bezier(.22,1,.36,1) both; }
        .hero-tab { animation: heroTab .4s ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .hero-card, .hero-tab { animation: none; }
        }
      `}</style>

      <Container className="relative">
        {/* Heading */}
        <div className="hidden pb-12 pt-6 text-center md:block">
          <h1 className="text-[34px] font-normal text-white">
            {heroCopy.heading1 ?? t("hero.heading1")}
            <span className="font-extrabold">
              {heroCopy.heading2 ?? t("hero.heading2")}
            </span>
          </h1>
          <p className="mt-2 text-sm text-white/85">
            {heroCopy.subtitle ?? t("hero.subtitle")}
          </p>
        </div>

        {/* Search card with the floating category rail straddling its top edge */}
        <div className="relative mx-auto max-w-[1120px]">
          <div
            className="hero-card absolute inset-x-3 -top-7 z-20 sm:inset-x-10 md:-top-8"
            style={{ animationDelay: "80ms" }}
          >
            <CategoryRail activeSlug={slug} onSelect={setSlug} />
          </div>

          <div className="hero-card relative rounded-2xl bg-white px-4 pb-4 pt-12 shadow-xl shadow-slate-900/25 md:px-6 md:pb-5 md:pt-14">
            {/* Field row + search CTA */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
              <div className="flex flex-1 flex-wrap gap-3">{tiles}</div>
              <button
                onClick={submit}
                disabled={pending}
                aria-busy={pending}
                className="h-14 w-full shrink-0 rounded-xl bg-brand px-8 text-base font-bold text-white shadow-sm transition hover:bg-brand-dark active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 lg:w-auto lg:self-stretch"
              >
                {pending ? t("common.loading") : t("hero.search")}
              </button>
            </div>

            {/* Resume the last search saved on this device */}
            {resume && (
              <p className="mt-4 flex flex-wrap items-center gap-1 border-t border-line pt-4 text-sm text-muted">
                {t("hero.resume")}
                <Link
                  href={resume.href}
                  className="font-semibold text-brand hover:underline"
                >
                  {/* The draft stores the canonical EN service label —
                      resolve it through the shared dictionary so the strip
                      switches with the active language. */}
                  {SERVICE_LABEL_KEYS[resume.label]
                    ? t(SERVICE_LABEL_KEYS[resume.label])
                    : resume.label}
                </Link>
                <span>{t("hero.resumeDevice")}</span>
              </p>
            )}

            {/* Promo strip */}
            <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <TicketIcon width={20} height={20} />
              </span>
              <p className="min-w-0 flex-1 text-sm text-muted">
                {heroCopy.promo ?? t("hero.promo")}
                <Link
                  href="/search?q=promo"
                  className="font-bold text-brand hover:underline"
                >
                  {heroCopy.promoCta ?? t("hero.promoCta")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}