// Shared helpers for the server functions in /api (they run on Vercel, never
// in the browser). Files in /api starting with "_" are not public endpoints.
//
// Needs these environment variables (set them in Vercel, and in .env.local):
//   FIREBASE_SERVICE_ACCOUNT  the Firebase service account key (the whole JSON, on one line)
//   STRIPE_SECRET_KEY         Stripe secret key (sk_test_... until launch)
//   STRIPE_TAX                "on" once Stripe Tax is set up (works out the VAT inside each price)
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue, FieldPath } from "firebase-admin/firestore";
import Stripe from "stripe";

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Reads the service account key. Tolerates extra text pasted after the key
// (e.g. pasted twice) by reading only the first complete { ... } block.
function readServiceAccount(raw) {
  const text = raw.trim();
  try {
    return JSON.parse(text);
  } catch {
    let depth = 0;
    let inString = false;
    for (let i = text.indexOf("{"); i >= 0 && i < text.length; i++) {
      const ch = text[i];
      if (inString) {
        if (ch === "\\") i++;
        else if (ch === '"') inString = false;
      } else if (ch === '"') inString = true;
      else if (ch === "{") depth++;
      else if (ch === "}" && --depth === 0) {
        try {
          return JSON.parse(text.slice(text.indexOf("{"), i + 1));
        } catch {
          break;
        }
      }
    }
    throw new HttpError(500, "The server key in Vercel (FIREBASE_SERVICE_ACCOUNT) isn't valid. Paste the whole .json file once, with nothing else.");
  }
}

function firebase() {
  if (!getApps().length) {
    const key = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!key) throw new HttpError(500, "The server key isn't set up yet (FIREBASE_SERVICE_ACCOUNT is missing in Vercel). Payments and push notifications need it.");
    initializeApp({ credential: cert(readServiceAccount(key)) });
  }
  return { auth: getAuth(), db: getFirestore() };
}

export const db = () => firebase().db;
export const adminAuth = () => firebase().auth;
export { FieldValue, FieldPath };

export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new HttpError(500, "Payments aren't set up yet (STRIPE_SECRET_KEY is missing in Vercel).");
  return new Stripe(key);
}

// Checks the login token sent by the app and returns the member's details.
export async function requireUser(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new HttpError(401, "Please log in again.");
  const { auth } = firebase();
  try {
    return await auth.verifyIdToken(token);
  } catch {
    throw new HttpError(401, "Please log in again.");
  }
}

// Adds a member to a cohort (safe to call twice).
export async function addMemberToCohort(uid, cohortId, details) {
  const store = db();
  const batch = store.batch();
  batch.set(store.doc(`users/${uid}/memberships/${cohortId}`), { ...details, joinedAt: FieldValue.serverTimestamp() }, { merge: true });
  batch.update(store.doc(`cohorts/${cohortId}`), { memberIds: FieldValue.arrayUnion(uid) });
  await batch.commit();
}

// Wraps a handler so errors become friendly JSON responses.
export function handle(fn) {
  return async (req, res) => {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    try {
      await fn(req, res);
    } catch (err) {
      console.error(err);
      res.status(err.status || 500).json({ error: err.status ? err.message : "Something went wrong. Please try again." });
    }
  };
}

export function siteOrigin(req) {
  return req.headers.origin || `https://${req.headers.host}`;
}
