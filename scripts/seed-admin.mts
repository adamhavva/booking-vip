#!/usr/bin/env node --experimental-strip-types
// Seed an admin account.
//
// Creates (or updates) the Firebase Auth identity and mirrors it into the
// `User` table with the ADMIN role — the database role is the source of
// truth for the admin/user split, so seeding the row is what actually grants
// access to `/admin`.
//
// Idempotent: re-running updates the password of an existing identity and
// re-keys a stale row instead of failing.
//
// Run:
//   SEED_ADMIN_EMAIL=admin@example.com SEED_ADMIN_PASSWORD=... \
//     node --experimental-strip-types scripts/seed-admin.mts
//   node --experimental-strip-types scripts/seed-admin.mts <email> <password>
//
// The password is never stored in the repo — pass it in through the
// environment or as an argument.

import "dotenv/config";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { db } from "../src/prisma/db.ts";

const ADMIN_ROLE = "ADMIN";

// ---------- arguments ----------

function readCredentials() {
  const email = (process.argv[2] ?? process.env.SEED_ADMIN_EMAIL ?? "").trim();
  const password = process.argv[3] ?? process.env.SEED_ADMIN_PASSWORD ?? "";

  if (!email || !password) {
    console.error(
      "Usage: node --experimental-strip-types scripts/seed-admin.mts <email> <password>",
    );
    process.exit(1);
  }
  return { email: email.toLowerCase(), password };
}

// ---------- firebase admin ----------

function getFirebaseAuth() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.error(
      "Missing Firebase Admin credentials — set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env",
    );
    process.exit(1);
  }

  const app =
    getApps()[0] ??
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getAuth(app);
}

// ---------- seed ----------

const { email, password } = readCredentials();
const auth = getFirebaseAuth();

// Create the identity, or reset the password of the existing one.
let uid: string;
let existed = false;
try {
  const existing = await auth.getUserByEmail(email);
  existed = true;
  uid = existing.uid;
  await auth.updateUser(uid, { password, emailVerified: true });
} catch (error) {
  const code = (error as { code?: string })?.code;
  if (code !== "auth/user-not-found") {
    console.error("[seed-admin] firebase lookup failed:", error);
    process.exit(1);
  }
  const created = await auth.createUser({
    email,
    password,
    emailVerified: true,
  });
  uid = created.uid;
}

console.log(
  `[seed-admin] firebase identity ${existed ? "updated" : "created"}: ${email} (uid ${uid})`,
);

// Mirror the identity into the database with the ADMIN role. A row that
// still carries a stale UID is re-keyed to the current one so the account
// keeps its history.
const existingRow = await db.orm.public.User
  .select("id", "role")
  .where({ email })
  .first();

if (existingRow) {
  await db.orm.public.User
    .where({ id: existingRow.id })
    .update({ id: uid, role: ADMIN_ROLE, emailVerified: true });
  console.log(
    `[seed-admin] user row updated (role ${existingRow.role} → ${ADMIN_ROLE}, id re-keyed to ${uid})`,
  );
} else {
  await db.orm.public.User.create({
    id: uid,
    email,
    name: null,
    phone: null,
    role: ADMIN_ROLE,
    emailVerified: true,
  });
  console.log(`[seed-admin] user row created with the ${ADMIN_ROLE} role`);
}

console.log(`[seed-admin] done — sign in at /admin/login with ${email}`);
process.exit(0);
