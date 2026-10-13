// Push notifications (Firebase Cloud Messaging).
// A member's device gets a "token" when they turn notifications on; it is
// stored on their profile so the server can send messages to it.
//
// Needs VITE_FIREBASE_VAPID_KEY (Firebase console → Project settings →
// Cloud Messaging → Web Push certificates).
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { app, db, firebaseConfig } from "../firebase.js";
import { isIOS, isInstalled } from "./install.js";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Returns one of:
//   "on"             notifications are on
//   "off"            supported, not turned on yet
//   "blocked"        the member said no (they must allow it in browser settings)
//   "needs-install"  iPhone/iPad: must add to Home Screen first
//   "unsupported"    this browser can't do web push
//   "not-configured" the app's push settings are missing
export async function pushStatus() {
  if (!app || !VAPID_KEY) return "not-configured";
  if (isIOS() && !isInstalled()) return "needs-install";
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !(await isSupported().catch(() => false))) {
    return "unsupported";
  }
  if (Notification.permission === "denied") return "blocked";
  if (Notification.permission === "granted") return "on";
  return "off";
}

let listening = false;

function registerWorker() {
  const params = new URLSearchParams({ config: JSON.stringify(firebaseConfig) });
  return navigator.serviceWorker.register(`/firebase-messaging-sw.js?${params}`);
}

// Asks permission (must be called from a button tap), then saves the device token.
export async function enablePush(uid) {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "blocked" : "off";
  await saveToken(uid);
  return "on";
}

// Saves (or refreshes) this device's token. Safe to call on every visit.
export async function saveToken(uid) {
  const registration = await registerWorker();
  const token = await getToken(getMessaging(app), { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
  if (token) await updateDoc(doc(db, "users", uid), { fcmTokens: arrayUnion(token) });
  // Messages that arrive while the app is open are shown too (set up once).
  if (listening) return token;
  listening = true;
  // While the app is open, show the message as the in-app banner (NoticeBanner.jsx)
  // instead of a system notification.
  onMessage(getMessaging(app), ({ data = {} }) => {
    window.dispatchEvent(new CustomEvent("habitlab:notice", { detail: { title: data.title || "Message", body: data.body || "" } }));
  });
  return token;
}
