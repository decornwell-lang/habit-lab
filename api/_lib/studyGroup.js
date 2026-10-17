// Study Group subscriptions: turning a Stripe subscription into our record
// (studyGroupSubscriptions/{stripeSubscriptionId}; see src/lib/access.js).
import { db, FieldValue } from "./server.js";

const toDate = (seconds) => (seconds ? new Date(seconds * 1000) : null);

// Stripe moved the period dates onto the subscription's items in newer API versions; read either.
export function subscriptionRecord(sub) {
  const item = sub.items?.data?.[0] || {};
  return {
    uid: sub.metadata?.uid || null,
    stripeSubscriptionId: sub.id,
    stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer?.id || null,
    status: sub.status,
    currentPeriodStart: toDate(sub.current_period_start ?? item.current_period_start),
    currentPeriodEnd: toDate(sub.current_period_end ?? item.current_period_end),
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
    termsVersion: sub.metadata?.termsVersion || null,
    termsAcceptedAt: sub.metadata?.termsAcceptedAt ? new Date(sub.metadata.termsAcceptedAt) : null,
    immediateAccess: sub.metadata?.immediateAccess === "true",
  };
}

// Saves the latest state of a subscription (safe to repeat: it always writes what Stripe says now).
export async function saveSubscription(sub) {
  const record = subscriptionRecord(sub);
  if (!record.uid) return null; // not one of ours (no member attached)
  await db().doc(`studyGroupSubscriptions/${sub.id}`).set({ ...record, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  // The member's Stripe customer, for the Customer Portal. Server-only (members can't change it).
  if (record.stripeCustomerId) await db().doc(`stripeCustomers/${record.uid}`).set({ stripeCustomerId: record.stripeCustomerId }, { merge: true });
  return record;
}
