import fs from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
const app = getApps()[0] ?? initializeApp({ credential: cert(JSON.parse(fs.readFileSync(".credentials/firebase-service-account.json", "utf8"))) });
const auth = getAuth(app);
for (const email of process.argv.slice(2)) {
  const u = await auth.getUserByEmail(email).catch((e) => ({ err: e.code }));
  console.log(email, u.err ?? { uid: u.uid, emailVerified: u.emailVerified });
}
