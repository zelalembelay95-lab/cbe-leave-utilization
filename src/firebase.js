// Firebase is used for Authentication ONLY in this app. The database is
// Supabase (Postgres), reached through the Cloudflare Pages Functions in
// /functions/api — see supabase/schema.sql and the README for setup.
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app, auth;

if (firebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} else {
  // eslint-disable-next-line no-console
  console.warn(
    "[CBE Leave] Firebase is not configured. Add your project keys to .env " +
      "(see .env.example and README.md) to enable sign-in."
  );
}

export { app, auth };
