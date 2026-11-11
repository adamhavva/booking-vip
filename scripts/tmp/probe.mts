import "dotenv/config";
import { db } from "../../src/prisma/db.ts";
const lines = await db.orm.public.ServiceLine.select("id","slug","label").all();
console.log(lines);
const transport = lines.find(l=>l.slug==="transport");
if (transport) {
  const products = await db.orm.public.Product.select("id","slug","title","fromPriceUsdCents").where(f=>f.lineId.eq(transport.id)).where(f=>f.isAddOn.eq(false)).all();
  console.log(products);
  for (const p of products) {
    const pkgs = await db.orm.public.ProductPackage.select("id","label","unitKind","adultUsdCents","unitUsdCents").where(f=>f.productId.eq(p.id)).where(f=>f.active.eq(true)).all();
    console.log(p.slug, pkgs);
  }
}
await db.close();
