import { db } from "../../src/prisma/db.ts";
const rows = await db.orm.public.PaymentMethod.select("id","code","label","provider","providerMethodCode","providerCurrency","sortOrder","active").all();
console.log(JSON.stringify(rows, null, 1));
process.exit(0);
