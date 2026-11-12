import fs from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
const app = getApps()[0] ?? initializeApp({ credential: cert(JSON.parse(fs.readFileSync(".credentials/firebase-service-account.json", "utf8"))) });
const auth = getAuth(app);
const email = process.argv[2];
const existing = await auth.getUserByEmail(email).catch(() => null);
const uid = existing?.uid ?? (await auth.createUser({ email, password: "Test12345", emailVerified: false })).uid;
await auth.updateUser(uid, { emailVerified: false });
const link = await auth.generateEmailVerificationLink(email, {
  url: `http://localhost:3000/verify-email?email=${encodeURIComponent(email)}`,
});
console.log("LINK:", link);
