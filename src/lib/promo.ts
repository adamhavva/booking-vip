import { db } from "@/prisma/db";

/**
 * Promo codes.
 *
 * The codes live in the database (`PromoCode`), so an operator can create a
 * discount from the admin area without a deploy.
 *
 * A promo is either:
 *
 *   - **fixed** — a flat amount off, stored in USD cents (`value`), or
 *   - **percentage** — a percentage of the subtotal (`value` between 0-100).
 *
 * The discount can never be bigger than the subtotal.
 */

export type PromoDTO = {
  id: string;
  code: string;
  title: string;
  type: "fixed" | "percentage";
  value: number;
  minTotalUsdCents: number;
  usageLimit: number | null;
  usedCount: number;
  active: boolean;
};

export type PromoCheck =
  | { ok: true; promo: PromoDTO; discountUsdCents: number }
  | { ok: false; error: string };

/** Look up a promo by its code. */
export async function findPromo(code: string): Promise<PromoDTO | null> {
  const rows = await db.orm.public.PromoCode
    .select(
      "id",
      "code",
      "title",
      "type",
      "value",
      "minTotalUsdCents",
      "usageLimit",
      "usedCount",
      "active",
      "startsAt",
      "endsAt",
    )
    .where((f) => f.code.eq(code.trim().toUpperCase()))
    .limit(1)
    .all();

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    code: row.code,
    title: row.title,
    type: row.type === "fixed" ? "fixed" : "percentage",
    value: row.value,
    minTotalUsdCents: row.minTotalUsdCents,
    usageLimit: row.usageLimit ?? null,
    usedCount: row.usedCount,
    active: row.active,
  };
}

/**
 * Check a promo code against a subtotal.
 *
 * Returns the discount in USD cents, or an error the customer can read.
 */
export async function checkPromo(
  code: string,
  subtotalUsdCents: number,
  now: Date = new Date(),
  userId?: string | null,
): Promise<PromoCheck> {
  const promo = await findPromo(code);

  if (!promo) {
    return { ok: false, error: "Kode promo tidak ditemukan." };
  }
  if (!promo.active) {
    return { ok: false, error: "Kode promo sudah tidak aktif." };
  }

  // Reward vouchers (issued by the loyalty program) belong to one account.
  // The owner's Firebase UID is encoded in the voucher id — a voucher can
  // only be applied by the account that redeemed it, while signed in.
  if (promo.id.startsWith("rwd:")) {
    if (!userId || !promo.id.startsWith(`rwd:${userId}:`)) {
      return {
        ok: false,
        error: "Voucher ini terikat ke akun lain. Masuk dengan akun pemilik voucher untuk memakainya.",
      };
    }
  }

  const windows = await db.orm.public.PromoCode
    .select("startsAt", "endsAt")
    .where((f) => f.id.eq(promo.id))
    .limit(1)
    .all();

  const window = windows[0];
  if (window?.startsAt && new Date(window.startsAt) > now) {
    return { ok: false, error: "Kode promo belum berlaku." };
  }
  if (window?.endsAt && new Date(window.endsAt) < now) {
    return { ok: false, error: "Kode promo sudah berakhir." };
  }

  if (promo.usageLimit != null && promo.usedCount >= promo.usageLimit) {
    return { ok: false, error: "Kode promo sudah habis dipakai." };
  }

  if (subtotalUsdCents < promo.minTotalUsdCents) {
    return {
      ok: false,
      error: `Minimum belanja untuk kode ini adalah $${(promo.minTotalUsdCents / 100).toFixed(2)}.`,
    };
  }

  const raw =
    promo.type === "fixed"
      ? promo.value
      : Math.round((subtotalUsdCents * promo.value) / 100);

  const discountUsdCents = Math.max(0, Math.min(raw, subtotalUsdCents));

  return { ok: true, promo, discountUsdCents };
}

/** Count one usage of a promo code. */
export async function markPromoUsed(promoId: string): Promise<void> {
  const rows = await db.orm.public.PromoCode
    .select("usedCount")
    .where((f) => f.id.eq(promoId))
    .limit(1)
    .all();

  const usedCount = rows[0]?.usedCount ?? 0;
  await db.orm.public.PromoCode.where({ id: promoId }).update({ usedCount: usedCount + 1 });
}
