"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import Container from "@/components/ui/Container";
import Popover from "@/components/ui/Popover";
import FieldShell from "@/components/ui/FieldShell";
import PaxPopover, {
  DEFAULT_PAX,
  formatPaxSummary,
  type PaxCounts,
} from "@/components/ui/PaxPopover";
import DateTimePopover from "@/components/ui/DateTimePopover";
import {
  CalendarIcon,
  ChevronDown,
  PinIcon,
  PlaneIcon,
  SearchIcon,
  StarIcon,
  UsersIcon,
} from "@/components/icons";
import { serviceNav, serviceSearchFields } from "@/data/services";
import { loadDraft, rememberSearch } from "@/lib/searchDraft";
import { logSearch } from "@/app/actions/search";
import { getOptions, getPlaceOptions } from "@/app/actions/catalog";
import PlaceOptionList from "@/components/ui/PlaceOptionList";
import { hasPlaceMatch, type PlaceNode } from "@/lib/places";
import { useHomeContent, useSearchFields, useServiceLines, useTimeSlots } from "@/lib/useContent";
import { copyText } from "@/lib/content";
import type { Category, OptionDTO, SearchFieldIcon, ServiceSearchField } from "@/types";
import { useLocale } from "@/components/providers/LocaleProvider";

const ICONS: Record<SearchFieldIcon, ReactNode> = {
  plane: <PlaneIcon width={18} height={18} />,
  pin: <PinIcon width={18} height={18} />,
  cal: <CalendarIcon width={18} height={18} />,
  users: <UsersIcon width={18} height={18} />,
  star: <StarIcon width={18} height={18} />,
};

const SERVICE_ROUTES = Object.fromEntries(
  serviceNav.map((s) => [s.label, s.href])
);

/** A search field with its copy already resolved to the active language. */
type ResolvedField = {
  key: string;
  label: string;
  placeholder?: string;
  icon: SearchFieldIcon;
  kind: ServiceSearchField["kind"];
};

/** Values of one service — a flat map of query-string keys. */
type Values = Record<string, Record<string, string>>;

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
 * A dropdown field — a trigger that opens a searchable list of options.
 */
function SelectField({
  field,
  icon,
  value,
  options,
  tree,
  onChange,
  searchable,
}: {
  field: ResolvedField;
  icon: ReactNode;
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
    <FieldShell icon={icon} label={field.label}>
      <Popover
        ariaLabel={field.label}
        panelClassName="w-[min(20rem,calc(100vw-2rem))]"
        trigger={
          <span
            className={`flex items-center gap-1 text-sm font-semibold ${
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
    </FieldShell>
  );
}

/**
 * The home hero only searches flights / airports.
 *
 * Every other service has its own page (Transport, Tour Package, e-VOA), so
 * the form here never changes shape — the service cards below the card point
 * at those pages.
 */
const HOME_SERVICE = "Airport VIP Service";

export default function HeroSearch() {
  const router = useRouter();
  const { t, lang } = useLocale();
  const service = HOME_SERVICE;
  const [values, setValues] = useState<Values>({});
  const [resume, setResume] = useState<{ href: string; label: string } | null>(
    null
  );
  const [options, setOptions] = useState<Record<string, OptionDTO[]>>({});
  // The place hierarchies (airport / city) — grouped dropdowns.
  const [placeTrees, setPlaceTrees] = useState<Record<string, PlaceNode[]>>({});

  // The service tabs and the fields come from the database; the static copy
  // is the fallback while it loads.
  const lines = useServiceLines();
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

  // The slug of the selected line — the search fields are scoped to it.
  const lineSlug = useMemo(
    () => (SERVICE_ROUTES[service] ?? "/").replace(/^\//, ""),
    [service]
  );

  const dbFields = useSearchFields(lineSlug);

  /** The fields of the selected service, with their copy resolved. */
  const fields = useMemo<ResolvedField[]>(
    () =>
      dbFields.map((f) => ({
        key: f.key,
        label: copyText(f.label, lang),
        placeholder: f.placeholder ? copyText(f.placeholder, lang) : undefined,
        icon: f.icon,
        kind: f.kind,
      })),
    [dbFields, lang]
  );

  /**
   * The country chosen in the search form, when the service has that field.
   *
   * It scopes the airport dropdown, so it has to be known before the options
   * are fetched.
   */
  const countryKey = useMemo(
    () => fields.find((f) => f.kind === "select-place-country")?.key ?? "",
    [fields]
  );
  const placeCountry = countryKey ? (values[service]?.[countryKey] ?? "") : "";

  // Fetch options for select fields
  useEffect(() => {
    const kinds = new Set<string>();
    for (const f of fields) {
      if (f.kind === "select-airport") kinds.add("airport");
      else if (f.kind === "select-city") kinds.add("city");
      else if (f.kind === "select-service-type") kinds.add("serviceType");
      else if (f.kind === "select-country") kinds.add("country");
      else if (f.kind === "select-place-country") kinds.add("placeCountry");
    }

    for (const kind of kinds) {
      const key = kind as
        | "airport"
        | "city"
        | "serviceType"
        | "country"
        | "placeCountry";
      // Create a unique cache key that includes lineSlug for serviceType
      const cacheKey = key === "serviceType" ? `serviceType:${lineSlug}` : key;
      if (!options[cacheKey]) {
        // Pass lineSlug for serviceType to scope the options
        const opts = key === "serviceType" ? lineSlug : undefined;
        getOptions(key, opts).then((opts) => {
          setOptions((prev) => ({ ...prev, [cacheKey]: opts }));
        });
      }
    }
  }, [fields, lineSlug]);

  // Fetch the place hierarchy for the grouped airport / city dropdowns.
  //
  // The airport tree is scoped by the country field when the form has one, so
  // the cache key carries the country — switching country fetches that
  // country's airports instead of reusing the previous list.
  useEffect(() => {
    const kinds = new Set<"airport" | "city">();
    for (const f of fields) {
      if (f.kind === "select-airport") kinds.add("airport");
      else if (f.kind === "select-city") kinds.add("city");
    }

    for (const kind of kinds) {
      const country = kind === "airport" ? placeCountry : "";
      const cacheKey = country ? `${kind}:${country}` : kind;
      if (placeTrees[cacheKey]) continue;
      getPlaceOptions(kind, country || undefined).then((tree) => {
        setPlaceTrees((prev) => ({ ...prev, [cacheKey]: tree }));
      });
    }
  }, [fields, placeTrees, placeCountry]);

  // Restore the last submitted search (persisted on this device).
  useEffect(() => {
    const draft = loadDraft();
    if (!draft) return;
    setResume({ href: draft.href, label: draft.service });
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

  /**
   * Choose the country.
   *
   * The airport belongs to the previous country, so it is cleared — keeping
   * it would submit a pair that does not go together.
   */
  const setCountry = (key: string, value: string) => {
    const airportKey = fields.find((f) => f.kind === "select-airport")?.key;
    setValues((v) => ({
      ...v,
      [service]: {
        ...currentValues,
        [key]: value,
        ...(airportKey ? { [airportKey]: "" } : {}),
      },
    }));
  };

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

  const submit = () => {
    const href = SERVICE_ROUTES[service] ?? "/";
    const params = new URLSearchParams();

    // Every value the user filled in travels to the service page.
    for (const [key, value] of Object.entries(currentValues)) {
      if (value) params.set(key, value);
    }
    params.set("service", service);

    rememberSearch({
      service,
      href,
      values: currentValues,
      savedAt: Date.now(),
    });

    // Also store it in the database (cross-device history). Failures are
    // ignored on purpose — the local copy above is enough to keep going.
    logSearch({ service, href, values: currentValues });

    router.push(`${href}?${params.toString()}`);
  };

  const renderField = (f: ResolvedField) => {
    const icon = ICONS[f.icon];
    const value = currentValues[f.key] ?? "";

    switch (f.kind) {
      case "select-airport":
      case "select-city":
      case "select-service-type":
      case "select-country":
      case "select-place-country": {
        let fieldOptions: OptionDTO[] = [];
        let tree: PlaceNode[] | undefined;
        if (f.kind === "select-airport") {
          tree = placeTrees[placeCountry ? `airport:${placeCountry}` : "airport"];
          // While the country's list is still loading, show nothing rather
          // than the unscoped list of every country's airports.
          fieldOptions = placeCountry && !tree ? [] : (options.airport ?? []);
        } else if (f.kind === "select-city") {
          fieldOptions = options.city ?? [];
          tree = placeTrees.city;
        } else if (f.kind === "select-country") fieldOptions = options.country ?? [];
        else if (f.kind === "select-place-country") {
          fieldOptions = options.placeCountry ?? [];
        } else {
          fieldOptions = options[`serviceType:${lineSlug}`] ?? [];
        }

        return (
          <SelectField
            key={f.key}
            field={f}
            icon={icon}
            value={value}
            options={fieldOptions}
            tree={tree}
            onChange={(v) =>
              f.kind === "select-place-country"
                ? setCountry(f.key, v)
                : setField(f.key, v)
            }
            searchable={f.kind === "select-airport"}
          />
        );
      }

      case "datetime":
        return (
          <DateTimePopover
            key={f.key}
            label={f.label}
            placeholder={f.placeholder}
            icon={icon}
            date={value}
            time={currentValues[`${f.key}Time`] ?? ""}
            onDate={(v) => setField(f.key, v)}
            onTime={(v) => setField(`${f.key}Time`, v)}
            timeSlots={timeSlots}
          />
        );

      case "pax":
        return (
          <PaxPopover
            key={f.key}
            label={f.label}
            placeholder={f.placeholder}
            value={readPax(currentValues, f.key)}
            onChange={(counts) => setPax(f.key, counts)}
            align="right"
          />
        );

      default:
        return (
          <FieldShell key={f.key} icon={icon} label={f.label}>
            <input
              value={value}
              onChange={(e) => setField(f.key, e.target.value)}
              placeholder={f.placeholder}
              aria-label={f.label}
              className="w-full bg-transparent text-sm font-semibold text-ink outline-none placeholder:text-muted"
            />
          </FieldShell>
        );
    }
  };

  return (
    <section className="relative bg-gradient-to-b from-hero-from via-hero-via to-hero-to pb-10 pt-44 md:pt-44">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/20 to-transparent" />
      <Container className="relative">
        {/* Heading */}
        <div className="hidden py-6 text-center md:block">
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

        {/* Search card with a centered tab rail straddling its top edge */}
        <div className="relative mx-auto max-w-[1120px]">
          {/* Search card */}
          <div className="relative rounded-2xl bg-white p-4 shadow-xl md:p-6 md:pt-10">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
              <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {fields.map(renderField)}
              </div>
              <button
                onClick={submit}
                className="shrink-0 rounded-xl bg-brand px-8 py-3 text-base font-bold text-white shadow-sm hover:bg-brand-dark lg:self-stretch"
              >
                {t("hero.search")}
              </button>
            </div>

            {/* Resume the last search saved on this device */}
            {resume && (
              <p className="mt-4 flex flex-wrap items-center gap-1 border-t border-line pt-4 text-sm text-ink">
                <span className="mr-1">🕘</span>
                {t("hero.resume")}
                <Link
                  href={resume.href}
                  className="font-semibold text-brand hover:underline"
                >
                  {resume.label}
                </Link>
                <span className="text-muted">{t("hero.resumeDevice")}</span>
              </p>
            )}

            {/* The other services live on their own pages */}
            <div className="mt-4 grid gap-2 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-3">
              {lines
                .filter((l) => l.slug !== "vip-service")
                .map((l) => (
                  <Link
                    key={l.slug}
                    href={SERVICE_ROUTES[l.label] ?? `/${l.slug}`}
                    className="flex items-center gap-3 rounded-xl border border-line bg-white px-3 py-2.5 transition-colors hover:bg-canvas"
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${l.tone} text-[11px] font-bold text-white`}
                    >
                      {l.short}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">
                      {l.label}
                    </span>
                    <ChevronDown
                      width={16}
                      height={16}
                      className="shrink-0 -rotate-90 text-muted"
                    />
                  </Link>
                ))}
            </div>

            {/* Promo strip */}
            <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-line pt-4 text-sm text-ink">
              <span className="mr-1">🏷️</span>
              {heroCopy.promo ?? t("hero.promo")}
              <a href="#" className="font-semibold text-brand">
                {heroCopy.promoCta ?? t("hero.promoCta")}
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
