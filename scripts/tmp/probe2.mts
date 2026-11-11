import "dotenv/config";
import { db } from "../../src/prisma/db.ts";
console.log(await db.orm.public.PaymentMethod.select("code","label","active").all());
console.log((await db.orm.public.Setting.select("key").all()).map(s=>s.key));
const lines = await db.orm.public.ServiceLine.select("id","slug","label").all();
console.log(lines);
await db.close();
