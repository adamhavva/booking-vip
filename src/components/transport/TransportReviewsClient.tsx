"use client";

import Link from "next/link";
import { ChevronLeft, Star } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { TransportReviewDTO } from "@/app/actions/transport";

/** The full review list of one vehicle. */
export default function TransportReviewsClient({
  slug,
  reviews,
}: {
  slug: string;
  reviews: TransportReviewDTO[];
}) {
  const { lang, t } = useLocale();

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === "id" ? "id-ID" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[22px] font-bold tracking-[-0.01em] text-ink">
          {t("transport.reviewHeading")}
        </h1>
        <Link
          href={`/transport/${slug}`}
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand hover:underline"
        >
          <ChevronLeft width={14} height={14} />
          {t("transport.backToVehicle")}
        </Link>
      </div>

      {reviews.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-line bg-white p-10 text-center text-[13px] text-muted">
          {t("transport.noReviews")}
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-2xl border border-line bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-[13px] font-bold text-brand">
                    {review.initials}
                  </span>
                  <div>
                    <p className="text-[13px] font-bold text-ink">{review.author}</p>
                    <p className="text-[11px] text-muted">{formatDate(review.createdAt)}</p>
                  </div>
                </div>
                <p className="inline-flex items-center gap-1 text-[14px] font-extrabold text-ink">
                  <Star width={15} height={15} className="fill-amber-400 text-amber-400" />
                  {review.rating.toLocaleString(lang === "id" ? "id-ID" : "en-US", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                  <span className="text-[11px] font-semibold text-muted">/5</span>
                </p>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-ink">{review.body}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}