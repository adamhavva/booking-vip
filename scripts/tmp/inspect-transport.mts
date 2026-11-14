import "dotenv/config";
import { db } from "/Users/dandiramdani/Projects/booking-vip/src/prisma/db.ts";

const lines = await db.orm.public.ServiceLine.select("id", "slug").all();
console.log("lines:", lines.map((l) => l.slug).join(", "));
const transport = lines.find((l) => l.slug === "transport");
if (transport) {
  const products = await db.orm.public.Product
    .select("id", "slug", "title", "vendor", "seats", "driverOption", "fromPriceUsdCents", "imageUrl", "serviceTypeId", "active")
    .where({ lineId: transport.id })
    .all();
  console.log("transport products:", products.length);
  for (const p of products.slice(0, 30)) {
    const pkgs = await db.orm.public.ProductPackage
      .select("id", "label", "unitKind", "unitUsdCents", "adultUsdCents", "active")
      .where({ productId: p.id })
      .all();
    console.log(JSON.stringify({ ...p, pkgs }));
  }
  const types = await db.orm.public.ServiceType.select("id", "slug", "name").where({ lineId: transport.id }).all();
  console.log("types:", JSON.stringify(types));
  const media = await db.orm.public.Media.select("id", "ownerType", "ownerId", "url").where({ ownerType: "Product" }).limit(5).all();
  console.log("media sample:", JSON.stringify(media));
  const reviews = await db.orm.public.Review.select("id", "subjectType", "subjectId", "rating").limit(5).all();
  console.log("reviews sample:", JSON.stringify(reviews));
  const settings = await db.orm.public.Setting.select("key").all();
  console.log("setting keys:", settings.map((s) => s.key).join(", "));
}
process.exit(0);
