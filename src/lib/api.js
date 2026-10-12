// Calls our own server functions in /api (used for Stripe payments).
// Sends the member's login token so the server knows who is asking.
import { auth } from "../firebase.js";

export async function apiPost(path, body) {
  const token = await auth.currentUser.getIdToken();
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}
