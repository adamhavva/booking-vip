"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import DOMPurify from "dompurify";
import {
  BadgeCheck,
  Calendar,
  Car,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  Fuel,
  Luggage,
  MessageCircle,
  RefreshCcw,
  Settings2,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Thumb from "@/components/ui/Thumb";
import { useLocale } from "@/components/providers/LocaleProvider";
import type {
  TransportDetailDTO,
  TransportSpec,
} from "@/app/actions/transport";
import { stringifyPickedPoint, type PickedPoint } from "@/lib/picked-point";
import TransportPackages from "./TransportPackages";

export type TransportDetailSearch = {
  date?: string;
  time?: string;
  returnDate?: string;
  returnTime?: string;
  totalDays?: string;
  driverOption?: string;
  from?: string;
  to?: string;
  pickup?: PickedPoint | null;
  dropoff?: PickedPoint | null;
};

/** The icon of one spec, by its stable key. */
function SpecIcon({ specKey }: { specKey: string }) {
  const props = { width: 16, height: 16, className: "shrink-0 text-muted" };
  switch (specKey) {
    case "luggage":
      return <Luggage {...props} />;
    case "passengers":
      return <Users {...props} />;
    case "clean":
      return <BadgeCheck {...props} />;
    case "driver_language":
      return <MessageCircle {...props} />;
    case "transmission":
      return <Settings2 {...props} />;
    case "fuel":
      return <Fuel {...props} />;
    case "electric":
      return <Zap {...props} />;
    case "year":
      return <Calendar {...props} />;
    default:
      return <BadgeCheck {...props} />;
  }
}

/**
 * The vehicle detail — photo carousel, vendor card, sanitized description,
 * reviews, booking rules, the selectable rental packages and the sticky
 * total bar that carries the chosen package into the booking wizard.
 */
export default function TransportDetailClient({
  detail,
  search,
}: {
  detail: TransportDetailDTO;
  search: TransportDetailSearch;
}) {
  const { formatMoney, lang, t } = useLocale();

  const days = Math.max(1, Number(search.totalDays ?? "1") || 1);
  const [selectedId, setSelectedId] = useState<string>(
    detail.packages[0]?.id ?? "",
  );
  const selected =
    detail.packages.find((pkg) => pkg.id === selectedId) ?? detail.packages[0];

  const totalUsdCents = (selected?.unitUsdCents ?? 0) * days;
  const points = Math.max(0, Math.floor(totalUsdCents / 100));

  /** The wizard link — carries the selected package and the search context. */
  const bookingHref = useMemo(() => {
    if (!selected) return "#";
    const params = new URLSearchParams();
    params.set("pkg", selected.id);
    if (search.date) params.set("date", search.date);
    if (search.time) params.set("time", search.time);
    params.set("days", String(days));
    params.set("driverOption", search.driverOption ?? detail.driverOption);
    if (search.from) params.set("from", search.from);
    if (search.to) params.set("to", search.to);
    if (search.pickup) params.set("pickup", stringifyPickedPoint(search.pickup));
    if (search.dropoff) params.set("dropoff", stringifyPickedPoint(search.dropoff));
    return `/booking/${detail.slug}?${params.toString()}`;
  }, [selected, search, days, detail.slug, detail.driverOption]);

  // DOMPurify needs a DOM, so sanitizing during SSR throws and forces a
  // client-render fallback. Render a tag-stripped plain-text version on the
  // server and on the first client render (hydration matches), then swap in
  // the sanitized HTML once mounted.
  const plainDescription = useMemo(
    () => detail.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
    [detail.description],
  );
  const [safeDescription, setSafeDescription] = useState<string | null>(null);
  useEffect(() => {
    setSafeDescription(DOMPurify.sanitize(detail.description));
  }, [detail.description]);

  const withDriver = detail.driverOption !== "without_driver";

  return (
    <div className="pb-36 lg:pb-28">
      <Container className="space-y-10 py-6 md:py-8">
        {/* Photo carousel */}
        <PhotoCarousel photos={detail.photos} title={detail.title} tone={detail.tone} />

        {/* Vehicle + vendor */}
        <section>
          <h2 className="text-[20px] font-bold tracking-[-0.01em] text-ink">
            {t("transport.detailHeading")}
          </h2>
          <div className="mt-4 rounded-2xl border border-line bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-col gap-5 sm:flex-row">
              <div className="flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white sm:h-36 sm:w-52">
                {detail.photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={detail.photos[0].url}
                    alt={detail.photos[0].alt ?? detail.title}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <Thumb tone={detail.tone} className="h-full w-full" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] text-muted">
                  {withDriver ? t("transport.withDriver") : t("transport.withoutDriver")}
                </p>
                <h3 className="mt-0.5 text-[17px] font-bold text-ink">{detail.title}</h3>
                {detail.vendor ? (
                  <p className="mt-1 inline-flex items-center gap-1.5 text-[12px] text-muted">
                    <Car width={14} height={14} className="text-brand" />
                    {detail.vendor}
                  </p>
                ) : null}

                {/* Spec grid */}
                <div className="mt-4 grid gap-x-8 sm:grid-cols-2">
                  {detail.specs.map((spec: TransportSpec) => (
                    <div
                      key={spec.key}
                      className="flex items-center gap-2.5 border-b border-dashed border-line py-2.5 text-[13px] text-ink"
                    >
                      <SpecIcon specKey={spec.key} />
                      {spec.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sanitized HTML description (plain text until mounted) */}
            {safeDescription === null ? (
              plainDescription ? (
                <div className="transport-description mt-5 border-t border-line pt-4 text-[13px] leading-relaxed text-muted">
                  {plainDescription}
                </div>
              ) : null
            ) : safeDescription.trim() ? (
              <div
                className="transport-description mt-5 border-t border-line pt-4 text-[13px] leading-relaxed text-muted"
                dangerouslySetInnerHTML={{ __html: safeDescription }}
              />
            ) : null}
          </div>
        </section>

        {/* Reviews */}
        <ReviewSection detail={detail} />

        {/* Important notes */}
        <section>
          <h2 className="text-[20px] font-bold tracking-[-0.01em] text-ink">
            {t("transport.importantHeading")}
          </h2>
          <div className="mt-4 rounded-2xl border border-line bg-white p-5 shadow-sm md:p-6">
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-[13px] text-ink">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-canvas text-muted">
                  <Clock width={15} height={15} />
                </span>
                <span>
                  <strong>
                    {t("transport.ruleUsage", {
                      n: detail.packages[0]?.durationHours ?? 12,
                    })}
                  </strong>{" "}
                  {t("transport.ruleUsageNote")}
                </span>
              </li>
              <li className="flex items-start gap-3 text-[13px] text-ink">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-canvas text-muted">
                  <UserCheck width={15} height={15} />
                </span>
                <span>
                  {t("transport.ruleConfirm", { n: detail.rules.minLeadHours })}
                </span>
              </li>
              <li className="flex items-start gap-3 text-[13px] text-ink">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-canvas text-muted">
                  <RefreshCcw width={15} height={15} />
                </span>
                <span>{t("transport.ruleRefund")}</span>
              </li>
            </ul>
            <Link
              href="/transport/terms"
              className="mt-5 flex items-center justify-between border-t border-line pt-4 text-[13px] font-semibold text-brand hover:underline"
            >
              {t("transport.termsLink")}
              <ChevronRight width={16} height={16} />
            </Link>
          </div>
        </section>

        {/* Packages + excluded costs */}
        <TransportPackages
          packages={detail.packages}
          selectedId={selected?.id ?? ""}
          onSelect={setSelectedId}
          formatMoney={formatMoney}
        />
      </Container>

      {/* Sticky total bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(15,23,42,0.06)]">
        <Container className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[20px] font-extrabold tracking-[-0.01em] text-danger">
              {formatMoney(totalUsdCents / 100)}
            </p>
            <p className="mt-0.5 inline-flex items-center gap-1.5 text-[12px] text-muted">
              <Coins width={14} height={14} className="text-brand" />
              {t("transport.earnPoints", { n: points.toLocaleString(lang === "id" ? "id-ID" : "en-US") })}
            </p>
          </div>
          <Link
            href={bookingHref}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-brand px-8 text-[14px] font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            {t("transport.continueToBooking")}
          </Link>
        </Container>
      </div>
    </div>
  );
}

/** The photo gallery — arrows + dots, gradient placeholder when empty. */
function PhotoCarousel({
  photos,
  title,
  tone,
}: {
  photos: { url: string; alt: string | null; credit: string | null }[];
  title: string;
  tone: string;
}) {
  const [index, setIndex] = useState(0);
  const count = photos.length;
  const current = photos[index];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <div className="flex h-64 items-center justify-center bg-white md:h-96">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.url}
            alt={current.alt ?? title}
            className="h-full w-full object-contain"
          />
        ) : (
          <Thumb tone={tone} className="h-full w-full" />
        )}
      </div>

      {count > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={() => setIndex((i) => (i - 1 + count) % count)}
            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white/95 text-ink shadow-sm transition-colors hover:bg-canvas"
          >
            <ChevronLeft width={18} height={18} />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={() => setIndex((i) => (i + 1) % count)}
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white/95 text-ink shadow-sm transition-colors hover:bg-canvas"
          >
            <ChevronRight width={18} height={18} />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {photos.map((photo, i) => (
              <button
                key={photo.url}
                type="button"
                aria-label={`Photo ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-5 bg-brand" : "w-2 bg-line"
                }`}
              />
            ))}
          </div>
        </>
      ) : null}

      {current?.credit ? (
        <p className="absolute bottom-3 right-3 rounded bg-white/85 px-2 py-0.5 text-[10px] text-muted">
          {current.credit}
        </p>
      ) : null}
    </div>
  );
}

/** The review summary + a scrollable carousel of review cards. */
function ReviewSection({ detail }: { detail: TransportDetailDTO }) {
  const { lang, t } = useLocale();
  const scrollerRef = useRef<HTMLDivElement>(null);

  const average =
    detail.rating ??
    (detail.reviews.length > 0
      ? detail.reviews.reduce((sum, review) => sum + review.rating, 0) /
        detail.reviews.length
      : 0);
  const rounded = Math.round(average * 10) / 10;

  const ratingLabel =
    rounded >= 4.5
      ? t("transport.ratingExcellent")
      : rounded >= 4
        ? t("transport.ratingGood")
        : rounded >= 3
          ? t("transport.ratingOkay")
          : t("transport.ratingLow");

  const scroll = (direction: -1 | 1) => {
    scrollerRef.current?.scrollBy({ left: direction * 340, behavior: "smooth" });
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === "id" ? "id-ID" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[20px] font-bold tracking-[-0.01em] text-ink">
          {t("transport.reviewHeading")}
        </h2>
        <Link
          href={`/transport/${detail.slug}/reviews`}
          className="text-[13px] font-semibold text-brand hover:underline"
        >
          {t("transport.seeAll")}
        </Link>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div className="flex items-end gap-3">
          <p className="text-[32px] font-extrabold leading-none tracking-[-0.02em] text-ink">
            {rounded.toLocaleString(lang === "id" ? "id-ID" : "en-US", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
            <span className="text-[15px] font-semibold text-muted">/5</span>
          </p>
          <div className="pb-0.5">
            <p className="text-[14px] font-bold text-ink">{ratingLabel}</p>
            <p className="text-[12px] text-muted">
              {t("transport.reviewCount", { n: detail.reviewCount })}
            </p>
          </div>
        </div>
        {detail.reviews.length > 0 ? (
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Previous reviews"
              onClick={() => scroll(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-ink transition-colors hover:bg-canvas"
            >
              <ChevronLeft width={16} height={16} />
            </button>
            <button
              type="button"
              aria-label="Next reviews"
              onClick={() => scroll(1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-ink transition-colors hover:bg-canvas"
            >
              <ChevronRight width={16} height={16} />
            </button>
          </div>
        ) : null}
      </div>

      {detail.reviews.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-line bg-white p-6 text-center text-[13px] text-muted">
          {t("transport.noReviews")}
        </p>
      ) : (
        <div
          ref={scrollerRef}
          className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
        >
          {detail.reviews.map((review) => (
            <article
              key={review.id}
              className="w-[300px] shrink-0 snap-start rounded-2xl border border-line bg-white p-5 shadow-sm"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[15px] font-extrabold text-ink">
                  {review.rating.toLocaleString(lang === "id" ? "id-ID" : "en-US", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                  <span className="text-[11px] font-semibold text-muted">/5</span>
                </p>
                <p className="text-[11px] text-muted">{formatDate(review.createdAt)}</p>
              </div>
              <p className="mt-2 truncate text-[12px] text-muted">
                <span className="font-bold text-ink">{review.initials}</span>
                {" · "}
                {review.author}
              </p>
              <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-ink">
                {review.body}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}