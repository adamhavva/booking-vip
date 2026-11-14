"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BadgePercent,
  ChevronDown,
  Luggage,
  Search,
  SlidersHorizontal,
  Users,
  Zap,
} from "lucide-react";
import Popover from "@/components/ui/Popover";
import Thumb from "@/components/ui/Thumb";
import { useLocale } from "@/components/providers/LocaleProvider";
import {
  searchTransport,
  type TransportResultItem,
  type TransportSort,
} from "@/app/actions/transport";
import { stringifyPickedPoint, type PickedPoint } from "@/lib/picked-point";
import type { DictKey } from "@/i18n";

export type TransportFleetSearch = {
  from?: string;
  to?: string;
  date?: string;
  time?: string;
  returnDate?: string;
  returnTime?: string;
  totalDays?: string;
  driverOption?: string;
  type?: string;
  pickup?: PickedPoint | null;
  dropoff?: PickedPoint | null;
};

const PAGE_SIZE = 8;

/**
 * The transport results — the summary bar, the filter chips and the
 * infinite-scrolling fleet list.
 *
 * Every filter lives in the query string, so a filtered list can be shared
 * and reloaded. Pages come from `searchTransport` (cursor + limit); an
 * IntersectionObserver sentinel loads the next page as the customer scrolls.
 */
export default function TransportFleetClient({
  search,
}: {
  search: TransportFleetSearch;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const { formatMoney, lang, t } = useLocale();

  const sort = (params.get("sort") as TransportSort | null) ?? "recommended";
  const discountOnly = params.get("disc") === "1";
  const minPassengers = Number(params.get("pax") ?? "0") || 0;
  const electricOnly = params.get("ev") === "1";

  const [items, setItems] = useState<TransportResultItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  const days = Number(search.totalDays ?? "1") || 1;
  const withDriver = search.driverOption !== "without_driver";

  /** The filter values the server action understands. */
  const filters = useMemo(
    () => ({
      sort,
      discountOnly,
      minPassengers: minPassengers > 0 ? minPassengers : undefined,
      electricOnly,
      driverOption: search.driverOption,
      type: search.type,
    }),
    [sort, discountOnly, minPassengers, electricOnly, search.driverOption, search.type],
  );

  /** The query string carried into the detail page (the search context). */
  const detailQuery = useMemo(() => {
    const next = new URLSearchParams();
    if (search.date) next.set("date", search.date);
    if (search.time) next.set("time", search.time);
    if (search.returnDate) next.set("returnDate", search.returnDate);
    if (search.returnTime) next.set("returnTime", search.returnTime);
    next.set("totalDays", String(days));
    next.set("driverOption", withDriver ? "with_driver" : "without_driver");
    if (search.from) next.set("from", search.from);
    if (search.to) next.set("to", search.to);
    if (search.pickup) next.set("pickup", stringifyPickedPoint(search.pickup));
    if (search.dropoff) next.set("dropoff", stringifyPickedPoint(search.dropoff));
    return next.toString();
  }, [search, days, withDriver]);

  // Load the first page whenever the filters (query string) change.
  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    setItems([]);
    setNextCursor(null);
    searchTransport({ ...filters, limit: PAGE_SIZE }).then((result) => {
      if (id !== requestId.current) return;
      setItems(result.items);
      setNextCursor(result.nextCursor);
      setTotal(result.total);
      setLoading(false);
    });
  }, [filters]);

  /** Append the next page — called by the scroll sentinel. */
  const loadMore = useCallback(() => {
    if (!nextCursor || loadingMore || loading) return;
    const id = requestId.current;
    setLoadingMore(true);
    searchTransport({ ...filters, cursor: nextCursor, limit: PAGE_SIZE }).then(
      (result) => {
        if (id !== requestId.current) return;
        setItems((current) => [...current, ...result.items]);
        setNextCursor(result.nextCursor);
        setLoadingMore(false);
      },
    );
  }, [nextCursor, loadingMore, loading, filters]);

  // Infinite scroll — the sentinel sits under the list.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  /** Write a filter into the query string (keeping the search context). */
  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value == null || value === "") next.delete(key);
    else next.set(key, value);
    router.replace(`/transport/armada?${next.toString()}`, { scroll: false });
  };

  const formatDate = (value?: string) => {
    if (!value) return "—";
    const date = new Date(`${value}T00:00:00`);
    if (!Number.isFinite(date.getTime())) return value;
    return date.toLocaleDateString(lang === "id" ? "id-ID" : "en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
  };

  const chipClass = (active: boolean) =>
    `inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[12px] font-semibold transition-colors ${
      active
        ? "border-brand bg-brand-soft text-brand"
        : "border-line bg-white text-ink hover:bg-canvas"
    }`;

  return (
    <div className="space-y-5">
      {/* The summary bar — echoes the live search inputs. */}
      <section className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-line bg-white px-4 py-3 shadow-sm">
        <Search width={18} height={18} className="shrink-0 text-muted" />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-[13px] font-semibold text-ink">
          <span>{withDriver ? t("transport.withDriver") : t("transport.withoutDriver")}</span>
          <span className="hidden h-4 w-px bg-line sm:block" aria-hidden />
          <span className="max-w-[16rem] truncate">{search.from ?? t("transport.anywhere")}</span>
          <span className="hidden h-4 w-px bg-line sm:block" aria-hidden />
          <span>
            {formatDate(search.date)}
            {search.time ? ` · ${search.time}` : ""}
          </span>
          <span className="hidden h-4 w-px bg-line sm:block" aria-hidden />
          <span>{t("transport.daysSummary", { n: days })}</span>
        </div>
        <button
          type="button"
          onClick={() => {
            const id = ++requestId.current;
            setLoading(true);
            searchTransport({ ...filters, limit: PAGE_SIZE }).then((result) => {
              if (id !== requestId.current) return;
              setItems(result.items);
              setNextCursor(result.nextCursor);
              setTotal(result.total);
              setLoading(false);
            });
          }}
          className="inline-flex h-9 shrink-0 items-center rounded-lg bg-brand-soft px-6 text-[13px] font-semibold text-brand transition-colors hover:bg-brand hover:text-white"
        >
          {t("transport.search")}
        </button>
      </section>

      {/* Filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <div className="shrink-0">
        <Popover
          ariaLabel={t("transport.filterSort")}
          panelClassName="w-[min(20rem,calc(100vw-2rem))]"
          trigger={
            <span className={chipClass(false)}>
              <SlidersHorizontal width={14} height={14} />
              {t("transport.filterSort")}
              <ChevronDown width={14} height={14} />
            </span>
          }
        >
          {({ close }) => (
            <FilterPanel
              sort={sort}
              discountOnly={discountOnly}
              minPassengers={minPassengers}
              electricOnly={electricOnly}
              onApply={(next) => {
                const query = new URLSearchParams(params.toString());
                if (next.sort === "recommended") query.delete("sort");
                else query.set("sort", next.sort);
                if (next.discountOnly) query.set("disc", "1");
                else query.delete("disc");
                if (next.minPassengers > 0) query.set("pax", String(next.minPassengers));
                else query.delete("pax");
                if (next.electricOnly) query.set("ev", "1");
                else query.delete("ev");
                router.replace(`/transport/armada?${query.toString()}`, { scroll: false });
                close();
              }}
            />
          )}
        </Popover>
        </div>

        <span className="h-6 w-px shrink-0 bg-line" aria-hidden />

        <button
          type="button"
          onClick={() => setParam("disc", discountOnly ? null : "1")}
          className={chipClass(discountOnly)}
        >
          <BadgePercent width={14} height={14} />
          {t("transport.chipDiscount")}
        </button>
        <button
          type="button"
          onClick={() => setParam("pax", minPassengers === 6 ? null : "6")}
          className={chipClass(minPassengers === 6)}
        >
          <Users width={14} height={14} />
          {t("transport.chipPassengers")}
        </button>
        <button
          type="button"
          onClick={() => setParam("ev", electricOnly ? null : "1")}
          className={chipClass(electricOnly)}
        >
          <Zap width={14} height={14} />
          {t("transport.chipElectric")}
        </button>
      </div>

      {/* The fleet */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-10 text-center">
          <h2 className="text-[16px] font-bold text-ink">{t("transport.emptyTitle")}</h2>
          <p className="mt-1.5 text-[13px] text-muted">{t("transport.emptyBody")}</p>
        </div>
      ) : (
        <>
          <p className="text-[12px] text-muted">
            {t("transport.resultCount", { n: total })}
          </p>
          <div className="space-y-4">
            {items.map((item) => (
              <VehicleCard
                key={item.slug}
                item={item}
                href={`/transport/${item.slug}?${detailQuery}`}
                formatMoney={formatMoney}
                t={t}
              />
            ))}
          </div>

          {/* Infinite scroll sentinel + skeletons + end note */}
          <div ref={sentinelRef} aria-hidden className="h-px" />
          {loadingMore ? (
            <div className="space-y-4">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : null}
          {!nextCursor && items.length > 0 ? (
            <p className="py-4 text-center text-[12px] text-muted">
              {t("transport.endOfList")}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

/** One horizontal vehicle card — image left, specs middle, price right. */
function VehicleCard({
  item,
  href,
  formatMoney,
  t,
}: {
  item: TransportResultItem;
  href: string;
  formatMoney: (usd: number) => string;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
}) {
  const luggage = item.specs.find((spec) => spec.key === "luggage")?.name;
  const passengers =
    item.specs.find((spec) => spec.key === "passengers")?.name ??
    (item.seats != null ? `${item.seats}` : null);
  const discounted = item.fromUsdCents != null && item.fromUsdCents > item.netUsdCents;

  return (
    <Link
      href={href}
      className="flex flex-wrap gap-4 rounded-2xl border border-line bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-nowrap sm:gap-5 sm:p-5"
    >
      {/* Image — Media photo, else the gradient placeholder. */}
      <div className="flex h-24 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white sm:h-28 sm:w-44">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-full w-full object-contain"
            loading="lazy"
          />
        ) : (
          <Thumb tone={item.tone} className="h-full w-full" />
        )}
      </div>

      {/* Name + specs */}
      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] font-bold tracking-[-0.01em] text-ink">
          {item.title}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-muted">
          {luggage ? (
            <span className="inline-flex items-center gap-1.5">
              <Luggage width={15} height={15} />
              {luggage}
            </span>
          ) : null}
          {passengers ? (
            <span className="inline-flex items-center gap-1.5">
              <Users width={15} height={15} />
              {passengers}
            </span>
          ) : null}
        </div>
        {item.vendor ? (
          <p className="mt-2 truncate text-[11px] text-muted">{item.vendor}</p>
        ) : null}
      </div>

      {/* Price — a full-width row under the image on phones, a column on desktop. */}
      <div className="flex w-full shrink-0 items-end justify-between gap-3 text-right sm:w-auto sm:flex-col sm:items-end sm:justify-center sm:gap-1">
        {discounted ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-danger px-2 py-0.5 text-[11px] font-bold text-white">
            <BadgePercent width={12} height={12} />
            {t("transport.discountBadge", { n: item.discountPercent })}
          </span>
        ) : null}
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[11px] text-muted">{t("transport.fromPrice")}</span>
          {discounted ? (
            <span className="text-[11px] text-muted line-through">
              {formatMoney(item.fromUsdCents! / 100)}
            </span>
          ) : null}
          <span
            className={`text-[17px] font-extrabold tracking-[-0.01em] ${
              discounted ? "text-danger" : "text-ink"
            }`}
          >
            {formatMoney(item.netUsdCents / 100)}
            <span className="text-[11px] font-medium text-muted">
              {t("transport.perDay")}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}

/** The loading placeholder of one card. */
function CardSkeleton() {
  return (
    <div className="flex animate-pulse gap-5 rounded-2xl border border-line bg-white p-5">
      <div className="h-28 w-44 shrink-0 rounded-xl bg-canvas" />
      <div className="flex-1 space-y-3 py-2">
        <div className="h-4 w-2/5 rounded bg-canvas" />
        <div className="h-3 w-3/5 rounded bg-canvas" />
        <div className="h-3 w-1/4 rounded bg-canvas" />
      </div>
      <div className="hidden w-32 space-y-2 py-2 sm:block">
        <div className="h-4 w-full rounded bg-canvas" />
        <div className="h-6 w-4/5 rounded bg-canvas" />
      </div>
    </div>
  );
}

/** The "Filter & Urutkan" panel — sort, discount, passengers, electric. */
function FilterPanel({
  sort,
  discountOnly,
  minPassengers,
  electricOnly,
  onApply,
}: {
  sort: TransportSort;
  discountOnly: boolean;
  minPassengers: number;
  electricOnly: boolean;
  onApply: (next: {
    sort: TransportSort;
    discountOnly: boolean;
    minPassengers: number;
    electricOnly: boolean;
  }) => void;
}) {
  const { t } = useLocale();
  const [draftSort, setDraftSort] = useState<TransportSort>(sort);
  const [draftDiscount, setDraftDiscount] = useState(discountOnly);
  const [draftPassengers, setDraftPassengers] = useState(minPassengers);
  const [draftElectric, setDraftElectric] = useState(electricOnly);

  const sorts: { value: TransportSort; label: string }[] = [
    { value: "recommended", label: t("transport.sortRecommended") },
    { value: "price_asc", label: t("transport.sortPriceAsc") },
    { value: "price_desc", label: t("transport.sortPriceDesc") },
    { value: "discount", label: t("transport.sortDiscount") },
  ];

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-[12px] font-bold text-ink">{t("transport.sortLabel")}</p>
        <div className="space-y-1">
          {sorts.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-ink hover:bg-canvas"
            >
              <input
                type="radio"
                name="transport-sort"
                checked={draftSort === option.value}
                onChange={() => setDraftSort(option.value)}
                className="h-4 w-4 accent-[var(--color-brand)]"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2 border-t border-line pt-3">
        <label className="flex cursor-pointer items-center justify-between gap-2 text-[13px] font-medium text-ink">
          {t("transport.filterDiscount")}
          <input
            type="checkbox"
            checked={draftDiscount}
            onChange={(e) => setDraftDiscount(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-brand)]"
          />
        </label>
        <label className="flex cursor-pointer items-center justify-between gap-2 text-[13px] font-medium text-ink">
          {t("transport.filterElectric")}
          <input
            type="checkbox"
            checked={draftElectric}
            onChange={(e) => setDraftElectric(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-brand)]"
          />
        </label>
        <div className="flex items-center justify-between gap-2 text-[13px] font-medium text-ink">
          <span>{t("transport.filterPassengers")}</span>
          <select
            value={draftPassengers}
            onChange={(e) => setDraftPassengers(Number(e.target.value))}
            className="h-8 rounded-lg border border-line bg-white px-2 text-[12px] outline-none focus:border-brand"
          >
            <option value={0}>{t("transport.anyPassengers")}</option>
            <option value={2}>{"> 2"}</option>
            <option value={4}>{"> 4"}</option>
            <option value={6}>{"> 6"}</option>
            <option value={8}>{"> 8"}</option>
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          onApply({
            sort: draftSort,
            discountOnly: draftDiscount,
            minPassengers: draftPassengers,
            electricOnly: draftElectric,
          })
        }
        className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-brand text-[13px] font-semibold text-white transition-colors hover:bg-brand-dark"
      >
        {t("transport.applyFilters")}
      </button>
    </div>
  );
}