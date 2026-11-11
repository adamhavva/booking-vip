import "dotenv/config";
import { db } from "../../src/prisma/db.ts";
const lines = await db.orm.public.ServiceLine.select("id","slug").all();
for (const l of lines) {
  console.log("=== LINE", l.slug);
  const products = await db.orm.public.Product.select("id","slug","title","fromPriceUsdCents","direction","serviceTypeId","airportId","leadTimeHours","leadTimeDays").where(f=>f.lineId.eq(l.id)).where(f=>f.isAddOn.eq(false)).all();
  for (const p of products) {
    const pkgs = await db.orm.public.ProductPackage.select("id","label","unitKind","adultUsdCents","childUsdCents","unitUsdCents").where(f=>f.productId.eq(p.id)).where(f=>f.active.eq(true)).all();
    console.log(p.slug, "|", p.title, "|", p.fromPriceUsdCents, "| dir:", p.direction, "|", pkgs);
  }
}
console.log("AIRPORTS", (await db.orm.public.Airport.select("id","name","city","iataCode","kind").where(f=>f.kind.eq("airport")).all()).slice(0,10));
console.log("AIRLINES", (await db.orm.public.Airline.select("code","name").all()).slice(0,10));
console.log("SERVICETYPES", await db.orm.public.ServiceType.select("id","name","slug","lineId").all());
await db.close();
