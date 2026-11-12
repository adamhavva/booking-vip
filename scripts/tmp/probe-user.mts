import "dotenv/config";
import { db } from "../../src/prisma/db.ts";
const email = process.argv[2];
const row = await db.orm.public.User.select("id", "email", "emailVerified").where({ email }).first();
console.log(email, row ?? "not found");
