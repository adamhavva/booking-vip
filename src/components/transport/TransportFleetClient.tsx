"use client";

import Link from "next/link";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { TransportVehicleGroupDTO } from "@/app/actions/catalog";
import { stringifyPickedPoint } from "@/lib/picked-point";
import type { PickedPoint } from "@/components/map/PickMap";

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

/**
 * The fleet list — the result of "Cari mobil".
 *
 * The search travels in the query string, so the customer can go back to the
 * entry page and change it without losing the selection.
 */
export default function TransportFleetClient({
  groups,
  search,
}: {
  groups: TransportVehicleGroupDTO[];
  search: TransportFleetSearch;
}) {
  const { formatMoney, lang } = useLocale();

  const days = Number(search.totalDays ?? "1") || 1;
  const withDriver = search.driverOption !== "without_driver";

  /** The link to the booking step, with the whole search carried over. */
  const bookingHref = (productSlug: string, packageId: string) => {
    const params = new URLSearchParams();
    if (search.pickup) params.set("pickup", stringifyPickedPoint(search.pickup));
    if (search.dropoff) params.set("dropoff", stringifyPickedPoint(search.dropoff));
    if (search.date) params.set("date", search.date);
    if (search.time) params.set("time", search.time);
    if (search.returnDate) params.set("returnDate", search.returnDate);
    if (search.returnTime) params.set("returnTime", search.returnTime);
    params.set("days", String(days));
    params.set("driverOption", withDriver ? "with_driver" : "without_driver");
    params.set("vehicle", `${productSlug}::${packageId}`);
    return `/transport/booking?${params.toString()}`;
  };

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
              Dari
            </p>
            <p className="mt-0.5 font-semibold text-ink">
              {search.from ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
              Ke
            </p>
            <p className="mt-0.5 font-semibold text-ink">{search.to ?? "—"}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
              Tanggal ambil
            </p>
            <p className="mt-0.5 font-semibold text-ink">
              {formatDate(search.date)}
              {search.time ? ` · ${search.time}` : ""}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
              Tanggal kembali
            </p>
            <p className="mt-0.5 font-semibold text-ink">
              {formatDate(search.returnDate)}
              {search.returnTime ? ` · ${search.returnTime}` : ""}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
              Durasi
            </p>
            <p className="mt-0.5 font-semibold text-ink">{days} hari</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
              Supir
            </p>
            <p className="mt-0.5 font-semibold text-ink">
              {withDriver ? "Dengan supir" : "Tanpa supir"}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
          <Link
            href="/transport"
            className="inline-flex h-9 items-center rounded-xl border border-line bg-white px-4 text-[12px] font-semibold text-ink transition-colors hover:bg-canvas"
          >
            Ubah pencarian
          </Link>
        </div>
      </section>

      {/* The vehicles */}
      {groups.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-10 text-center">
          <h2 className="text-[16px] font-bold text-ink">Belum ada armada</h2>
          <p className="mt-1.5 text-[13px] text-muted">
            Coba ubah tanggal atau area penjemputan kamu.
          </p>
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.parentSlug} className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.06em] text-muted">
              {group.parentName}
            </h2>

            <div className="mt-4 space-y-3">
              {group.children.map((vehicle) => {
                const key = `${vehicle.productSlug}::${vehicle.packageId}`;

                return (
                  <article
                    key={key}
                    className="flex flex-col gap-4 rounded-xl border border-line p-4 transition-colors hover:bg-canvas/60 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-bold tracking-[-0.01em] text-ink">
                        {vehicle.title}
                      </h3>
                      <p className="mt-0.5 text-[12px] text-muted">
                        {vehicle.packageLabel} · {days} hari
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <p className="text-[15px] font-bold text-ink">
                        {formatMoney(vehicle.unitUsdCents * days)}
                      </p>
                      <Link
                        href={bookingHref(vehicle.productSlug, vehicle.packageId)}
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
