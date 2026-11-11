"use client";

import { useCallback, useEffect, useState } from "react";
import AccountPageHeader from "@/components/account/AccountPageHeader";
import { getAccountOverview, getLoyaltyLevels, type AccountOverviewDTO } from "@/app/actions/account";
import type { LoyaltyLevelDTO } from "@/lib/loyalty";

/**
 * The points & level page.
 *
 * The levels are read from the database, so an operator can change a
 * threshold without a deploy. The progress bar shows how far the customer is
 * from the next tier.
 */
export default function LoyaltyPanel() {
  const [overview, setOverview] = useState<AccountOverviewDTO | null>(null);
  const [levels, setLevels] = useState<LoyaltyLevelDTO[]>([]);

  const load = useCallback(async () => {
    const [data, tierList] = await Promise.all([getAccountOverview(), getLoyaltyLevels()]);
    setOverview(data);
    setLevels(tierList);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const points = overview?.points ?? 0;
  const current = overview?.level ?? null;
  const next = overview?.nextLevel ?? null;

  const progress =
    current && next && next.minPoints > current.minPoints
      ? Math.min(
          100,
          Math.max(0, ((points - current.minPoints) / (next.minPoints - current.minPoints)) * 100),
        )
      : 100;

  return (
    <div>
      <AccountPageHeader
        title="Poin & Level"
        description="Poin dan level kamu dihitung dari database — ambang level bisa diubah kapan saja."
      />

      {/* Summary */}
      <section className="rounded-2xl border border-line bg-white p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted">
              Poin kamu
            </p>
            <p className="mt-1 text-[32px] font-extrabold leading-none tracking-[-0.02em] text-ink">
              {points.toLocaleString("id-ID")}
            </p>
          </div>
          <div className="rounded-xl bg-brand-soft px-4 py-3 text-right">
            <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-brand-dark/70">
              Level sekarang
            </p>
            <p className="mt-0.5 text-[16px] font-bold text-brand-dark">
              {current?.name ?? "Member"}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <div className="h-2 w-full overflow-hidden rounded-full bg-canvas">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-[12px] text-muted">
            {next
              ? `${overview?.pointsToNext ?? 0} poin lagi untuk mencapai level ${next.name}.`
              : "Kamu sudah di level tertinggi."}
          </p>
        </div>
      </section>

      {/* Level list */}
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
          Level tersedia
        </h2>

        <div className="mt-3 space-y-3">
          {levels.map((level) => {
            const reached = points >= level.minPoints;
            const isCurrent = current?.id === level.id;

            return (
              <div
                key={level.id}
                className={`rounded-2xl border p-5 ${
                  isCurrent ? "border-brand bg-brand-soft/30" : "border-line bg-white"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-semibold text-ink">{level.name}</h3>
                      {isCurrent ? (
                        <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-white">
                          Kamu
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-[12px] text-muted">
                      Minimal {level.minPoints.toLocaleString("id-ID")} poin · multiplier ×
                      {level.multiplier}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      reached ? "bg-brand-soft text-brand-dark" : "bg-canvas text-muted"
                    }`}
                  >
                    {reached ? "Tercapai" : "Belum tercapai"}
                  </span>
                </div>

                {level.benefits.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {level.benefits.map((benefit) => (
                      <li
                        key={benefit}
                        className="rounded-full border border-line bg-canvas/70 px-2.5 py-1 text-[11px] text-muted"
                      >
                        {benefit}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
