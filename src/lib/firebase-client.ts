import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

/**
 * Firebase Web SDK — browser only.
 *
 * Used for the Google sign-in popup on the customer login page. The config
 * values are public by design (the Firebase API key is not a secret), but
 * they are read from `NEXT_PUBLIC_*` variables so Next.js can inline them
 * into the browser bundle.
 */

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;

/** Initialise (once) and return the browser Auth instance. */
export function getClientAuth(): Auth {
  if (cachedAuth) return cachedAuth;

  if (!config.apiKey || !config.authDomain) {
    throw new Error(
      "Missing NEXT_PUBLIC_FIREBASE_API_KEY / NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN. Is the client Firebase config set?",
    );
  }

  cachedApp = getApps().length > 0 ? getApp() : initializeApp(config);
  cachedAuth = getAuth(cachedApp);
  return cachedAuth;
}
