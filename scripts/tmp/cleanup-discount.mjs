// Removes the temporary verification fixtures of the stacked-discount feature:
// the two TEST products (+ their packages) and any leftover test campaigns.
// The seeded demo campaign and the Setting key itself are kept.
import "dotenv/config";
import { db } from "../../src/prisma/db.ts";

const products = await db.orm.public.Product
  .select("id", "slug")
  .where((f) => f.slug.in(["test-diskon-50", "test-diskon-60"]))
  .all();
const ids = products.map((p) => p.id);
if (ids.length) {
  await db.orm.public.ProductPackage.where((f) => f.productId.in(ids)).deleteAll();
  await db.orm.public.Product.where((f) => f.id.in(ids)).deleteAll();
}
console.log(`[cleanup-discount] removed ${ids.length} test product(s).`);

const row = await db.orm.public.Setting
  .select("value")
  .where({ key: "promo.campaigns" })
  .first();
if (row && Array.isArray(row.value)) {
  const kept = row.value.filter(
    (c) => !(typeof c?.key === "string" && c.key.startsWith("test-akumulasi")),
  );
  if (kept.length !== row.value.length) {
    await db.orm.public.Setting
      .where({ key: "promo.campaigns" })
      .update({ value: kept as never });
    console.log(`[cleanup-discount] removed ${row.value.length - kept.length} test campaign(s).`);
  }
}
process.exit(0);