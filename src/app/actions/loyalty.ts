"use server";

import { db } from "@/prisma/db";
import { getUserSession } from "@/lib/user/session";
import {
  earnedPointsForBooking,
  parseVoucherId,
  readRewardCatalog,
  voucherId,
  voucherOwnerPattern,
  type RewardDTO,
} from "@/lib/loyalty";

/**
 * The loyalty rewards actions.
 *
 * The catalog is operator-defined key/value data (`Setting("loyalty.rewards")`).
 * Redeeming a reward deducts points atomically and issues a single-use
 * voucher in the existing `PromoCode` table — ownership and the exact cost
 * are encoded in the voucher id, so no schema change is needed.
 */

export type LoyaltyResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/** The rewards catalog — public, it is the same for every customer. */
export async function getRewardCatalog(): Promise<RewardDTO[]> {
  return readRewardCatalog();
}

export type VoucherDTO = {
  code: string;
  title: string;
  kind: "percent" | "amount" | "free";
  value: number;
  endsAt: string | null;
  used: boolean;
  createdAt: string;
};

/** Map a stored voucher row to the DTO the loyalty page renders. */
function toVoucherDTO(row: {
  code: string;
  title: string;
  type: string;
  value: number;
  endsAt: Date | null;
  usedCount: number;
  createdAt: Date;
  id: string;
}): VoucherDTO {
  // A "free" reward is stored as a capped fixed discount — the same storage
  // shape as "amount"; the catalog entry carries the richer label.
  return {
    code: row.code,
    title: row.title,
    kind: row.type === "percentage" ? "percent" : "amount",
    value: row.value,
    endsAt: row.endsAt ? new Date(row.endsAt).toISOString() : null,
    used: row.usedCount > 0,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

/** The signed-in customer's reward vouchers (used and unused). */
export async function listMyVouchers(): Promise<VoucherDTO[]> {
  const session = await getUserSession();
  if (!session) return [];

  const rows = await db.orm.public.PromoCode
    .select("id", "code", "title", "type", "value", "endsAt", "usedCount", "createdAt")
    .where((f) => f.id.like(voucherOwnerPattern(session.uid)))
    .orderBy((f) => f.createdAt.desc())
    .all();

  return rows.map(toVoucherDTO);
}

export type RedeemResult = LoyaltyResult<{
  code: string;
  title: string;
  pointsLeft: number;
}>;

/**
 * Redeem one reward: deduct the points and issue the voucher in a single
 * transaction. The user row is locked for the duration, so two concurrent
 * redemptions can never overdraw the balance.
 */
export async function redeemReward(rewardKey: string): Promise<RedeemResult> {
  const session = await getUserSession();
  if (!session) {
    return { ok: false, error: "Sesi tidak valid. Silakan masuk kembali." };
  }

  const catalog = await readRewardCatalog();
  const reward = catalog.find((r) => r.key === rewardKey);
  if (!reward) {
    return { ok: false, error: "Hadiah tidak ditemukan atau sudah tidak tersedia." };
  }

  try {
    return await db.transaction(async (tx) => {
      // Lock the account row — a concurrent redemption waits here.
      const user = await tx.orm.public.User
        .select("id", "points")
        .where({ id: session.uid })
        .forNoKeyUpdate()
        .first();

      if (!user) {
        return { ok: false as const, error: "Akun tidak ditemukan." };
      }
      if (user.points < reward.pointsCost) {
        return {
          ok: false as const,
          error: `Poin kamu belum cukup. Dibutuhkan ${reward.pointsCost.toLocaleString("id-ID")} poin, saldo kamu ${user.points.toLocaleString("id-ID")} poin.`,
        };
      }

      const code = generateVoucherCode();
      const now = new Date();
      const endsAt = new Date(
        now.getTime() + reward.expiresDays * 24 * 60 * 60 * 1000,
      );

      await tx.orm.public.PromoCode.create({
        id: voucherId(session.uid, reward.key, reward.pointsCost),
        code,
        title: reward.name,
        // "free" is a fixed discount capped at `value` — checkPromo already
        // caps any discount at the booking total, so it covers the full
        // amount up to the cap.
        type: reward.kind === "percent" ? "percentage" : "fixed",
        value: reward.value,
        minTotalUsdCents: 0,
        usageLimit: 1,
        usedCount: 0,
        startsAt: now,
        endsAt,
        active: true,
      });

      const pointsLeft = user.points - reward.pointsCost;
      await tx.orm.public.User
        .where({ id: session.uid })
        .update({ points: pointsLeft });

      return { ok: true as const, data: { code, title: reward.name, pointsLeft } };
    });
  } catch (error) {
    console.error("[loyalty] could not redeem the reward", error);
    return { ok: false, error: "Penukaran gagal. Coba lagi sebentar." };
  }
}

/** A short, uppercase, unambiguous voucher code. */
function generateVoucherCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < bytes.length; i++) {
    code += alphabet[bytes[i]! % alphabet.length];
  }
  return `RWD-${code}`;
}

export type PointsHistoryEntry = {
  kind: "earn" | "redeem";
  label: string;
  points: number;
  at: string;
};

/**
 * The points history, derived from the source rows: paid bookings earn
 * points, redeemed vouchers spend them. Newest first.
 */
export async function listPointsHistory(): Promise<PointsHistoryEntry[]> {
  const session = await getUserSession();
  if (!session) return [];

  const entries: PointsHistoryEntry[] = [];

  const bookings = await db.orm.public.Booking
    .select("id", "code", "totalUsdCents", "status", "createdAt")
    .where((f) => f.userId.eq(session.uid))
    .all();

  if (bookings.length > 0) {
    const paidPayments = await db.orm.public.Payment
      .select("bookingId", "paidAt")
      .where((f) => f.bookingId.in(bookings.map((b) => b.id)))
      .where((f) => f.status.eq("paid"))
      .all();
    const paidAtByBooking = new Map(
      paidPayments.map((p) => [p.bookingId, p.paidAt]),
    );

    for (const booking of bookings) {
      const paidAt = paidAtByBooking.get(booking.id);
      const paid =
        paidAt != null ||
        booking.status === "confirmed" ||
        booking.status === "completed";
      if (!paid) continue;
      entries.push({
        kind: "earn",
        label: booking.code,
        points: earnedPointsForBooking(booking.totalUsdCents),
        at: new Date(paidAt ?? booking.createdAt).toISOString(),
      });
    }
  }

  const vouchers = await db.orm.public.PromoCode
    .select("id", "title", "createdAt")
    .where((f) => f.id.like(voucherOwnerPattern(session.uid)))
    .all();
  for (const voucher of vouchers) {
    const meta = parseVoucherId(voucher.id);
    if (!meta) continue;
    entries.push({
      kind: "redeem",
      label: voucher.title,
      points: -meta.pointsCost,
      at: new Date(voucher.createdAt).toISOString(),
    });
  }

  return entries.sort((a, b) => b.at.localeCompare(a.at));
}