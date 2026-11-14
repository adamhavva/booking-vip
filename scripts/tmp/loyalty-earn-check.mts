// Direct check of the points-earning math and the derived balance.
// Run: node --import ./scripts/tmp/alias-hook.mjs scripts/tmp/loyalty-earn-check.mts
import { db } from "@/prisma/db";
import {
  earnedPointsForBooking,
  recomputeUserPoints,
  parseVoucherId,
  voucherOwnerPattern,
} from "@/lib/loyalty";

const email = process.argv[2] ?? "bv.loyalty.v8wsky@example.com";
const user = await db.orm.public.User.select("id", "points").where({ email }).first();
if (!user) throw new Error("test user not found");

console.log("earnedPointsForBooking(9281) =", earnedPointsForBooking(9281), "(expect 92)");
console.log("earnedPointsForBooking(9700) =", earnedPointsForBooking(9700), "(expect 97)");

const vouchers = await db.orm.public.PromoCode
  .select("id")
  .where((f) => f.id.like(voucherOwnerPattern(user.id)))
  .all();
const spent = vouchers.reduce((s, v) => s + (parseVoucherId(v.id)?.pointsCost ?? 0), 0);
console.log("vouchers owned:", vouchers.length, "spent:", spent);

const points = await recomputeUserPoints(user.id);
const paid = await db.orm.public.Payment
  .select("bookingId")
  .where((f) => f.status.eq("paid"))
  .all();
console.log("paid payments:", paid.length);
console.log("recomputed balance:", points, "(expect max(0, 92+97-spent))");
const expect = Math.max(0, 92 + 97 - spent);
if (points !== expect) throw new Error(`balance mismatch: ${points} != ${expect}`);
console.log("EARN CHECK OK");
await db.close();