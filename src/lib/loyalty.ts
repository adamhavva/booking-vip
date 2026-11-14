import { db } from "@/prisma/db";

/**
 * Loyalty levels.
 *
 * The tiers live in the database (`LoyaltyLevel`), so a threshold can be
 * changed by an operator without a deploy. `resolveLevel()` picks the tier
 * whose `minPoints` is the highest one that is still `<= points`.
 */

export type LoyaltyLevelDTO = {
  id: string;
  code: string;
  name: string;
  minPoints: number;
  multiplier: number;
  benefits: string[];
  sortOrder: number;
  active: boolean;
};

/** All the active levels, ordered from the lowest threshold. */
export async function listLoyaltyLevels(): Promise<LoyaltyLevelDTO[]> {
  const rows = await db.orm.public.LoyaltyLevel
    .select("id", "code", "name", "minPoints", "multiplier", "benefits", "sortOrder", "active")
    .orderBy((f) => f.minPoints.asc())
    .all();

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    minPoints: row.minPoints,
    multiplier: row.multiplier,
    benefits: toStringArray(row.benefits),
    sortOrder: row.sortOrder,
    active: row.active,
  }));
}

/** The level that matches a point total. */
export function resolveLevel(
  levels: LoyaltyLevelDTO[],
  points: number,
): LoyaltyLevelDTO | null {
  if (levels.length === 0) return null;

  let current: LoyaltyLevelDTO | null = null;
  for (const level of levels) {
    if (level.minPoints <= points) current = level;
    else break;
  }

  // Below the first threshold the customer still belongs to the base tier.
  return current ?? levels[0]!;
}

/** The next level and how many points are still missing. */
export function pointsToNextLevel(
  levels: LoyaltyLevelDTO[],
  points: number,
): { next: LoyaltyLevelDTO | null; missing: number } {
  const next = levels.find((level) => level.minPoints > points) ?? null;
  return { next, missing: next ? Math.max(0, next.minPoints - points) : 0 };
}

/** Read a string list out of a JSON column. */
function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Rewards catalog — operator-defined key/value data in `Setting`
// ---------------------------------------------------------------------------

/**
 * The rewards catalog lives in the `Setting` key `loyalty.rewards` as a JSON
 * array, so an operator can change the offers without a deploy:
 *
 *   [{ key, name, pointsCost, kind: "percent" | "amount" | "free", value,
 *      expiresDays?, description? }]
 *
 * `value` is a percentage (0-100) for "percent" and integer USD cents for
 * "amount" (a flat cut) and "free" (full cover capped at that amount).
 */
export type RewardKind = "percent" | "amount" | "free";

export type RewardDTO = {
  key: string;
  name: string;
  pointsCost: number;
  kind: RewardKind;
  value: number;
  expiresDays: number;
  description: string | null;
};

/** Validate one raw catalog entry; invalid entries are dropped, not fatal. */
function parseReward(raw: unknown): RewardDTO | null {
  if (typeof raw !== "object" || raw === null) return null;
  const item = raw as Record<string, unknown>;

  const key = typeof item.key === "string" ? item.key.trim() : "";
  const name = typeof item.name === "string" ? item.name.trim() : "";
  const pointsCost = Number(item.pointsCost);
  const value = Number(item.value);
  const kind = item.kind;

  // The key travels inside the voucher id (`rwd:<uid>:<key>:<cost>:<uuid>`),
  // so it must not contain the separator.
  if (!key || !/^[A-Za-z0-9_-]+$/.test(key) || !name) return null;
  if (!Number.isInteger(pointsCost) || pointsCost <= 0) return null;
  if (kind !== "percent" && kind !== "amount" && kind !== "free") return null;
  if (!Number.isInteger(value) || value <= 0) return null;
  if (kind === "percent" && value > 100) return null;

  const expiresDays = Number(item.expiresDays);
  return {
    key,
    name,
    pointsCost,
    kind,
    value,
    expiresDays:
      Number.isInteger(expiresDays) && expiresDays > 0 ? expiresDays : 30,
    description:
      typeof item.description === "string" && item.description.trim()
        ? item.description.trim()
        : null,
  };
}

/** The active rewards catalog, read from `Setting("loyalty.rewards")`. */
export async function readRewardCatalog(): Promise<RewardDTO[]> {
  try {
    const row = await db.orm.public.Setting
      .select("value")
      .where({ key: "loyalty.rewards" })
      .first();
    if (!row || !Array.isArray(row.value)) return [];
    return row.value
      .map(parseReward)
      .filter((reward): reward is RewardDTO => reward !== null);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Reward vouchers — ownership without a schema change
// ---------------------------------------------------------------------------

/**
 * A redeemed reward is a single-use `PromoCode`. Ownership and the exact
 * points cost are encoded in the row's **id** (a free-form string primary
 * key), so no extra column is needed:
 *
 *   rwd:<firebaseUid>:<rewardKey>:<pointsCost>:<uuid>
 *
 * The public `code` stays short and uppercase; the id is never shown.
 */
export const VOUCHER_ID_PREFIX = "rwd:";

export function voucherId(
  uid: string,
  rewardKey: string,
  pointsCost: number,
): string {
  return `${VOUCHER_ID_PREFIX}${uid}:${rewardKey}:${pointsCost}:${crypto.randomUUID()}`;
}

export type VoucherMeta = { uid: string; rewardKey: string; pointsCost: number };

/** Decode the ownership metadata out of a voucher id (null for plain promos). */
export function parseVoucherId(id: string): VoucherMeta | null {
  if (!id.startsWith(VOUCHER_ID_PREFIX)) return null;
  const parts = id.split(":");
  // rwd : uid : key : cost : uuid — the uid itself never contains ":".
  if (parts.length !== 5) return null;
  const pointsCost = Number(parts[3]);
  if (!parts[1] || !parts[2] || !Number.isInteger(pointsCost)) return null;
  return { uid: parts[1], rewardKey: parts[2], pointsCost };
}

/** The `LIKE` pattern matching every voucher owned by one account. */
export function voucherOwnerPattern(uid: string): string {
  return `${VOUCHER_ID_PREFIX}${uid}:%`;
}

// ---------------------------------------------------------------------------
// Points balance — derived, so it can always be recomputed
// ---------------------------------------------------------------------------

/**
 * Points earned by a paid booking: 1 point per whole US dollar of the total.
 * The rule is a pure function of the stored total, so the balance can be
 * re-derived from the source rows at any time (no ledger table needed).
 */
export function earnedPointsForBooking(totalUsdCents: number): number {
  return Math.max(0, Math.floor(totalUsdCents / 100));
}

/**
 * Recompute `User.points` from the source rows:
 *
 *   earned (paid bookings)  −  spent (redeemed reward vouchers)
 *
 * Idempotent — safe to call after every payment confirmation and inside the
 * redemption transaction. Pass `tx.orm` to run it inside a transaction.
 */
export async function recomputeUserPoints(
  uid: string,
  orm: typeof db.orm = db.orm,
): Promise<number> {
  const bookings = await orm.public.Booking
    .select("id", "totalUsdCents", "status")
    .where((f) => f.userId.eq(uid))
    .all();

  let earned = 0;
  if (bookings.length > 0) {
    const paidPayments = await orm.public.Payment
      .select("bookingId")
      .where((f) => f.bookingId.in(bookings.map((b) => b.id)))
      .where((f) => f.status.eq("paid"))
      .all();
    const paidBookingIds = new Set(paidPayments.map((p) => p.bookingId));

    for (const booking of bookings) {
      const paid =
        paidBookingIds.has(booking.id) ||
        booking.status === "confirmed" ||
        booking.status === "completed";
      if (paid) earned += earnedPointsForBooking(booking.totalUsdCents);
    }
  }

  const vouchers = await orm.public.PromoCode
    .select("id")
    .where((f) => f.id.like(voucherOwnerPattern(uid)))
    .all();
  let spent = 0;
  for (const voucher of vouchers) {
    spent += parseVoucherId(voucher.id)?.pointsCost ?? 0;
  }

  const points = Math.max(0, earned - spent);
  await orm.public.User.where({ id: uid }).update({ points });
  return points;
}
