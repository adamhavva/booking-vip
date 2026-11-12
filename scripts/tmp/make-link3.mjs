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
const customToken = await auth.createCustomToken(uid);
const signIn = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${env.FIREBASE_API_KEY}`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ token: customToken, returnSecureToken: true }),
}).then((r) => r.json());
for (const variant of [
  { label: "handleCodeInApp+continueUrl", body: { requestType: "VERIFY_EMAIL", idToken: signIn.idToken, email, handleCodeInApp: true, continueUrl: "http://localhost:3000/verify-email" } },
  { label: "continueUrl only", body: { requestType: "VERIFY_EMAIL", idToken: signIn.idToken, email, continueUrl: "http://localhost:3000/verify-email" } },
]) {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${env.FIREBASE_API_KEY}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(variant.body),
  });
  console.log(variant.label, res.status, JSON.stringify(await res.json()).slice(0, 300));
}
