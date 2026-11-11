import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Firebase Admin SDK - server side only.
 *
 * All credentials come from server-only environment variables (no NEXT_PUBLIC_ prefix),
 * so nothing here is ever bundled into the browser.
 *
 * The app is initialised lazily: `next build` must not fail when the Firebase
 * credentials are absent (they only exist in the deployed environment).
 */

function readServiceAccount() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const privateKeyId = process.env.FIREBASE_PRIVATE_KEY_ID;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env",
    );
  }

  return {
    projectId,
    clientEmail,
    // .env stores the key with escaped newlines
    privateKey: privateKey.replace(/\\n/g, "\n"),
    ...(privateKeyId ? { privateKeyId } : {}),
  };
}

let cachedApp: App | null = null;

function getFirebaseApp(): App {
  if (!cachedApp) {
    cachedApp = getApps()[0] ?? initializeApp({ credential: cert(readServiceAccount()) });
  }
  return cachedApp;
}

/** The Firebase Auth instance (server side). */
export function getAdminAuth() {
  return getAuth(getFirebaseApp());
}

/** The Firestore instance (server side). */
export function getAdminDb() {
  return getFirestore(getFirebaseApp());
}
