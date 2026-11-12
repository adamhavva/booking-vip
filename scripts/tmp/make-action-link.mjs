import fs from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
const env = {};
for (const line of fs.readFileSync(".env", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/\\n/g, "\n");
}
const app = getApps()[0] ?? initializeApp({ credential: cert(JSON.parse(fs.readFileSync(".credentials/firebase-service-account.json", "utf8"))) });
const auth = getAuth(app);
const email = process.argv[2];
const existing = await auth.getUserByEmail(email).catch(() => null);
const uid = existing?.uid ?? (await auth.createUser({ email, password: "Test12345", emailVerified: false })).uid;
await auth.updateUser(uid, { emailVerified: false });
const link = await auth.generateEmailVerificationLink(email, {
  url: "http://localhost:3000/verify-email",
  handleCodeInApp: true,
});
const oobCode = new URL(link).searchParams.get("oobCode");
const actionUrl = `https://${env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}/__/auth/action?mode=verifyEmail&oobCode=${encodeURIComponent(oobCode)}&continueUrl=${encodeURIComponent("http://localhost:3000/verify-email")}&apiKey=${env.FIREBASE_API_KEY}`;
console.log(JSON.stringify({ uid, oobCode, actionUrl }));
