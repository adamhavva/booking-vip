import "dotenv/config";
import { db } from "../../src/prisma/db.ts";

const rows = await db.query(db.raw.sql`SELECT * FROM prisma_contract.marker`.build());
console.log(JSON.stringify(rows, null, 2));
const cols = await db.query(db.raw.sql`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('Product','ProductPackage','Contact','BookingItem') AND column_name IN ('specs','info','fromUsdCents','description','vendor','seats','driverOption','title','quantity','destinationId') ORDER BY table_name, column_name`.build());
console.log(JSON.stringify(cols));
process.exit(0);
