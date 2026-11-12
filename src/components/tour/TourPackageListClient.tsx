"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { TourPackageGroupDTO } from "@/app/actions/catalog";

export type TourPackageSearch = {
  destination?: string;
  date?: string;
  adults?: string;
  children?: string;
  infants?: string;
  type?: string;
};

/**
 * The package list — the result of "Cari paket".
 *
 * The price is computed from the passenger counts, so the customer sees the
 * price they will actually pay before the booking step.
 */
export default function TourPackageListClient({
  groups,
  search,
}: {
  groups: TourPackageGroupDTO[];
  search: TourPackageSearch;
}) {
  const { formatMoney, lang } = useLocale();

  const adults = Number(search.adults ?? "2") || 2;
  const children = Number(search.children ?? "0") || 0;
  const infants = Number(search.infants ?? "0") || 0;

  /** The packages that match the destination and the tour type. */
  const filtered = useMemo(() => {
    const destination = (search.destination ?? "").toLowerCase();
    const type = (search.type ?? "").toLowerCase();

    return groups
      .map((group) => ({
        ...group,
        children: group.children.filter((tour) => {
          if (type && group.parentSlug !== type) return false;
          if (!destination) return true;
          const haystack = [
            tour.title,
            tour.packageLabel,
            tour.parentName ?? "",
            group.parentName,
          ]
            .join(" ")
            .toLowerCase();
          return destination.split(",")[0]?.trim() ? haystack.includes(destination.split(",")[0]!.trim()) : true;
        }),
      }))
      .filter((group) => group.children.length > 0);
  }, [groups, search.destination, search.type]);

  const formatDate = (value?: string) => {
    if (!value) return "—";
    const date = new Date(`${value}T00:00:00`);
    if (!Number.isFinite(date.getTime())) return value;
    return date.toLocaleDateString(lang === "id" ? "id-ID" : "en-US", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* The search summary */}
      <section className="rounded-2xl border border-line bg-white p-5">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
              Destinasi
            </p>
            <p className="mt-0.5 font-semibold text-ink">
              {search.destination ?? "Semua destinasi"}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
              Tanggal mulai
            </p>
            <p className="mt-0.5 font-semibold text-ink">{formatDate(search.date)}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
              Penumpang
            </p>
            <p className="mt-0.5 font-semibold text-ink">
              {adults} dewasa
              {children > 0 ? `, ${children} anak` : ""}
              {infants > 0 ? `, ${infants} bayi` : ""}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
          <Link
            href="/tour-package"
            className="inline-flex h-9 items-center rounded-xl border border-line bg-white px-4 text-[12px] font-semibold text-ink transition-colors hover:bg-canvas"
          >
            Ubah pencarian
          </Link>
          <Link
            href="/tour-package/search"
            className="inline-flex h-9 items-center rounded-xl border border-line bg-white px-4 text-[12px] font-semibold text-ink transition-colors hover:bg-canvas"
          >
            Pilih titik jemput di peta
          </Link>
        </div>
      </section>

      {/* The packages */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-10 text-center">
          <h2 className="text-[16px] font-bold text-ink">
            Belum ada paket untuk pencarian ini
          </h2>
          <p className="mt-1.5 text-[13px] text-muted">
            Coba ganti destinasi lain atau ubah tanggal perjalanan.
          </p>
        </div>
      ) : (
        filtered.map((group) => (
          <section
            key={group.parentSlug}
            className="rounded-2xl border border-line bg-white p-5"
          >
            <h2 className="text-[13px] font-bold uppercase tracking-[0.06em] text-muted">
              {group.parentName}
            </h2>

            <div className="mt-4 space-y-3">
              {group.children.map((tour) => {
                const key = `${tour.productSlug}::${tour.packageId}`;
                const total =
                  tour.adultUsdCents * adults +
                  tour.childUsdCents * children +
                  tour.infantUsdCents * infants;

                const params = new URLSearchParams();
                params.set("package", key);
                if (search.date) params.set("date", search.date);
                params.set("adults", String(adults));
                params.set("children", String(children));
                params.set("infants", String(infants));

                return (
                  <article
                    key={key}
                    className="flex flex-col gap-4 rounded-xl border border-line p-4 transition-colors hover:bg-canvas/60 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-bold tracking-[-0.01em] text-ink">
                        {tour.title}
                      </h3>
                      <p className="mt-0.5 text-[12px] text-muted">
                        {tour.packageLabel}
                        {tour.durationLabel ? ` · ${tour.durationLabel}` : ""}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <p className="text-[15px] font-bold text-ink">
                        {formatMoney(total)}
                      </p>
                      <Link
                        href={`/tour-package/search?${params.toString()}`}
                        className="inline-flex h-10 items-center rounded-xl bg-brand px-5 text-[13px] font-semibold text-white transition-opacity hover:bg-brand-dark"
                      >
                        Pilih
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
