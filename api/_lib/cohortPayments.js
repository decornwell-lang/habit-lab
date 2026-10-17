// Recording a paid cohort. Called by the Stripe webhook (checkout.session.completed) and by
// /api/confirm-checkout (the member's app, straight after paying), whichever comes first;
// both may run, and running twice changes nothing (every record is keyed by the Stripe
// checkout session).
// For a signed-in payer it writes:
//   users/{uid}/memberships/{cohortId}   paid, plan
//   cohortEntitlements/{sessionId}       the cohort's dates: from its start, for its length
//   payments/{sessionId}                 what was paid
//   members/{uid}                        firstCohortStart, accessEndsAt, extended (bought the year)
// Access always counts from the day the cohort begins, never the day of payment (see
// src/lib/access.js). A visitor's payment (no account yet) is kept in payments/{sessionId}
// with their email until they create their account and confirm-checkout links it.
import { createRequire } from "node:module";
import { db, addMemberToCohort, FieldValue } from "./server.js";
import { entitlementPeriod, accessEndsAt } from "../../src/lib/access.js";

const pricing = createRequire(import.meta.url)("../../config/pricing.json");

const paymentRecord = (session, extra = {}) => ({
  type: "cohort",
  cohortId: session.metadata.cohortId,
  plan: session.metadata.plan || "cohort",
  amount: (session.amount_total || 0) / 100,
  currency: session.currency,
  stripeSessionId: session.id,
  stripePaymentId: session.payment_intent || null,
  email: session.customer_details?.email || null,
  createdAt: FieldValue.serverTimestamp(),
  ...extra,
});

export async function recordGuestPayment(session) {
  await db().doc(`payments/${session.id}`).set(paymentRecord(session, { guest: true, uid: null }), { merge: true });
}

export async function recordCohortPayment(uid, session) {
  const store = db();
  const { cohortId } = session.metadata;
  const plan = session.metadata.plan || "cohort";
  const cohort = (await store.doc(`cohorts/${cohortId}`).get()).data();
  if (!cohort) throw new Error(`Cohort ${cohortId} not found for payment ${session.id}`);

  await addMemberToCohort(uid, cohortId, {
    paid: true,
    method: "stripe",
    amount: (session.amount_total || 0) / 100,
    currency: session.currency,
    stripeSessionId: session.id,
    plan, // "year": the cohort plus a full year
  });

  const { startsAt, endsAt } = entitlementPeriod(cohort.startDate, Number(cohort.durationDays) || pricing.cohortDays);
  const batch = store.batch();
  batch.set(store.doc(`cohortEntitlements/${session.id}`), {
    uid, cohortId, plan, startsAt, endsAt, paidAt: FieldValue.serverTimestamp(), stripePaymentId: session.payment_intent || null, refunded: false,
  }, { merge: true });
  batch.set(store.doc(`payments/${session.id}`), paymentRecord(session, { uid, guest: false }), { merge: true });
  await batch.commit();
  await refreshMember(uid, plan === "year");
}

// Works out the member's access from all their entitlements (and keeps "extended" once set).
export async function refreshMember(uid, boughtYear = false) {
  const store = db();
  const ref = store.doc(`members/${uid}`);
  const [snap, ents] = await Promise.all([ref.get(), store.collection("cohortEntitlements").where("uid", "==", uid).get()]);
  const entitlements = ents.docs.map((d) => ({ ...d.data(), startsAt: d.data().startsAt.toDate(), endsAt: d.data().endsAt.toDate() }));
  const extended = Boolean(snap.data()?.extended || boughtYear || entitlements.some((e) => e.plan === "year" && !e.refunded));
  const kept = entitlements.filter((e) => !e.refunded);
  const firstCohortStart = kept.length ? new Date(Math.min(...kept.map((e) => e.startsAt.getTime()))) : null;
  await ref.set({
    firstCohortStart,
    accessEndsAt: accessEndsAt({ entitlements, extended }, pricing.extendDays),
    extended,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}
