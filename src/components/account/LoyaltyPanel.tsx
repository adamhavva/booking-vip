"use client";

import { useCallback, useEffect, useState } from "react";
import AccountPageHeader from "@/components/account/AccountPageHeader";
import { getLoyaltyLevels } from "@/app/actions/account";
import {
  getRewardCatalog,
  listMyVouchers,
  listPointsHistory,
  redeemReward,
  type PointsHistoryEntry,
  type VoucherDTO,
} from "@/app/actions/loyalty";
import { useAccountOverview } from "@/components/providers/AccountProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { LoyaltyLevelDTO, RewardDTO } from "@/lib/loyalty";

/**
 * The points & level page.
 *
 * Three dynamic blocks on top of the tier overview:
 *   - the rewards catalog (operator-defined `Setting("loyalty.rewards")`),
 *   - the customer's vouchers (single-use `PromoCode` rows),
 *   - the points history (derived from paid bookings and redemptions).
 *
 * Redeeming deducts the points atomically on the server and issues a voucher
 * that can be applied at checkout.
 */
export default function LoyaltyPanel() {
  const { overview, refresh } = useAccountOverview();
  const { t, lang, formatMoney } = useLocale();
  const [levels, setLevels] = useState<LoyaltyLevelDTO[]>([]);
  const [rewards, setRewards] = useState<RewardDTO[]>([]);
  const [vouchers, setVouchers] = useState<VoucherDTO[]>([]);
  const [history, setHistory] = useState<PointsHistoryEntry[]>([]);
  const [redeemingKey, setRedeemingKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<
    { kind: "ok" | "error"; text: string } | null
  >(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [levelRows, catalog, myVouchers, myHistory] = await Promise.all([
      getLoyaltyLevels(),
      getRewardCatalog(),
      listMyVouchers(),
      listPointsHistory(),
    ]);
    setLevels(levelRows);
    setRewards(catalog);
    setVouchers(myVouchers);
    setHistory(myHistory);
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

  const dateLocale = lang === "id" ? "id-ID" : "en-US";
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(dateLocale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  /** The human label of a reward's benefit. */
  const rewardValueLabel = (reward: { kind: string; value: number }) => {
    if (reward.kind === "percent") {
      return t("loyalty.rewardPercent", { n: reward.value });
    }
    if (reward.kind === "free") {
      return t("loyalty.rewardFree", { amount: formatMoney(reward.value / 100) });
    }
    return t("loyalty.rewardAmount", { amount: formatMoney(reward.value / 100) });
  };

  const handleRedeem = async (key: string) => {
    setRedeemingKey(key);
    setNotice(null);
    const result = await redeemReward(key);
    setRedeemingKey(null);

    if (result.ok) {
      // Re-read the shared overview so the header balance updates too.
      await refresh();
      await load();
      setNotice({
        kind: "ok",
        text: t("loyalty.redeemOk", { code: result.data.code }),
      });
    } else {
      setNotice({ kind: "error", text: result.error });
    }
  };

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // Clipboard unavailable — the code stays visible to copy by hand.
    }
  };

  return (
    <div>
      <AccountPageHeader
        title={t("loyalty.title")}
        description={t("loyalty.description")}
      />

      {/* Summary */}
      <section className="rounded-2xl border border-line bg-white p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted">
              {t("loyalty.yourPoints")}
            </p>
            <p className="mt-1 text-[32px] font-extrabold leading-none tracking-[-0.02em] text-ink">
              {points.toLocaleString(dateLocale)}
            </p>
          </div>
          <div className="rounded-xl bg-brand-soft px-4 py-3 text-right">
            <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-brand-dark/70">
              {t("loyalty.currentLevel")}
            </p>
            <p className="mt-0.5 text-[16px] font-bold text-brand-dark">
              {current?.name ?? t("loyalty.member")}
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
              ? t("loyalty.toNext", {
                  n: (overview?.pointsToNext ?? 0).toLocaleString(dateLocale),
                  level: next.name,
                })
              : t("loyalty.maxLevel")}
          </p>
        </div>
      </section>

      {/* Redemption notice */}
      {notice ? (
        <div
          role="status"
          className={`mt-4 rounded-xl border px-4 py-3 text-[13px] ${
            notice.kind === "ok"
              ? "border-success/25 bg-success/5 text-success"
              : "border-danger/25 bg-danger/5 text-danger"
          }`}
        >
          {notice.text}
        </div>
      ) : null}

      {/* Rewards catalog */}
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
          {t("loyalty.rewardsTitle")}
        </h2>
        <p className="mt-1 text-[12px] text-muted">{t("loyalty.rewardsDesc")}</p>

        {rewards.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-line bg-white p-5 text-[13px] text-muted">
            {t("loyalty.rewardsEmpty")}
          </p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {rewards.map((reward) => {
              const affordable = points >= reward.pointsCost;
              const busy = redeemingKey === reward.key;

              return (
                <div
                  key={reward.key}
                  className="flex flex-col rounded-2xl border border-line bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[14px] font-semibold text-ink">
                      {reward.name}
                    </h3>
                    <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold text-brand-dark">
                      {t("loyalty.cost", {
                        n: reward.pointsCost.toLocaleString(dateLocale),
                      })}
                    </span>
                  </div>

                  <p className="mt-1 text-[13px] font-semibold text-brand">
                    {rewardValueLabel(reward)}
                  </p>
                  {reward.description ? (
                    <p className="mt-1 text-[12px] leading-relaxed text-muted">
                      {reward.description}
                    </p>
                  ) : null}
                  <p className="mt-1 text-[11px] text-muted">
                    {t("loyalty.expiresDays", { n: reward.expiresDays })}
                  </p>

                  <button
                    type="button"
                    onClick={() => void handleRedeem(reward.key)}
                    disabled={!affordable || busy || redeemingKey !== null}
                    className="mt-3 h-10 rounded-xl bg-brand text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? t("loyalty.redeeming") : t("loyalty.redeem")}
                  </button>
                  {!affordable ? (
                    <p className="mt-1.5 text-[11px] text-muted">
                      {t("loyalty.notEnough")}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* My vouchers */}
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
          {t("loyalty.vouchersTitle")}
        </h2>

        {vouchers.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-line bg-white p-5 text-[13px] text-muted">
            {t("loyalty.vouchersEmpty")}
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {vouchers.map((voucher) => {
              const expired =
                !voucher.used &&
                voucher.endsAt != null &&
                new Date(voucher.endsAt).getTime() < Date.now();
              return (
              <div
                key={voucher.code}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-canvas px-2.5 py-1 font-mono text-[13px] font-bold text-ink">
                      {voucher.code}
                    </span>
                    {voucher.used ? (
                      <span className="rounded-full bg-canvas px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-muted">
                        {t("loyalty.voucherUsed")}
                      </span>
                    ) : expired ? (
                      <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-danger">
                        {t("loyalty.voucherExpired")}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 truncate text-[13px] text-ink">
                    {voucher.title} · {rewardValueLabel(voucher)}
                  </p>
                  {voucher.endsAt ? (
                    <p className="mt-0.5 text-[11px] text-muted">
                      {t("loyalty.voucherExpires", {
                        date: formatDate(voucher.endsAt),
                      })}
                    </p>
                  ) : null}
                </div>

                {!voucher.used && !expired ? (
                  <button
                    type="button"
                    onClick={() => void handleCopy(voucher.code)}
                    className="h-9 shrink-0 rounded-xl border border-line bg-white px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-canvas"
                  >
                    {copiedCode === voucher.code
                      ? t("loyalty.voucherCopied")
                      : t("loyalty.voucherCopy")}
                  </button>
                ) : null}
              </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Points history */}
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
          {t("loyalty.historyTitle")}
        </h2>

        {history.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-line bg-white p-5 text-[13px] text-muted">
            {t("loyalty.historyEmpty")}
          </p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-white">
            {history.map((entry, index) => (
              <div
                key={`${entry.kind}-${entry.at}-${index}`}
                className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-ink">
                    {entry.kind === "earn"
                      ? t("loyalty.historyEarn", { code: entry.label })
                      : t("loyalty.historyRedeem", { name: entry.label })}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {formatDate(entry.at)}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-[13px] font-bold ${
                    entry.points >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {entry.points >= 0 ? "+" : ""}
                  {entry.points.toLocaleString(dateLocale)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Level list */}
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
          {t("loyalty.levelsTitle")}
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
                          {t("loyalty.you")}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-[12px] text-muted">
                      {t("loyalty.levelMin", {
                        n: level.minPoints.toLocaleString(dateLocale),
                      })}{" "}
                      · ×{level.multiplier}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      reached ? "bg-brand-soft text-brand-dark" : "bg-canvas text-muted"
                    }`}
                  >
                    {reached ? t("loyalty.reached") : t("loyalty.notReached")}
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