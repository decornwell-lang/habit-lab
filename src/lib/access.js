// Access rules: who can use cohort features, and until when. Used by the app and by the
// server (api/), so both follow the same rules. Prices and day counts: config/pricing.json.
//
// Firestore (written only by the server, after Stripe confirms a payment):
//   members/{uid}             { firstJoinedAt, accessEndsAt, extended, lapsed }
//   cohortEntitlements/{id}   { uid, cohortId, startsAt, endsAt, paidAt, stripePaymentId, refunded }
//   payments/{id}             { uid, type: "cohort" | "extension" | "refund", cohortId, amount, currency, stripePaymentId, createdAt }
//
// Study Group (yearly subscription), kept separate from cohort access:
//   studyGroupSubscriptions/{stripeSubscriptionId}
//                             { uid, stripeSubscriptionId, stripeCustomerId, status, currentPeriodStart,
//                               currentPeriodEnd, cancelAtPeriodEnd, termsVersion, termsAcceptedAt,
//                               immediateAccess, updatedAt }  (written only by the Stripe webhook)
//   stripeEvents/{eventId}    { type, processedAt }  (each Stripe event is handled once)
//
// Dates here are JavaScript Dates (Firestore Timestamps are turned into Dates first).

const DAY = 24 * 60 * 60 * 1000;
export const plusDays = (date, days) => new Date(date.getTime() + days * DAY);

// One cohort's access: from the cohort's start for `cohortDays` days.
export function entitlementPeriod(cohortStart, cohortDays) {
  const startsAt = new Date(`${cohortStart}T00:00:00Z`);
  return { startsAt, endsAt: plusDays(startsAt, cohortDays) };
}

// The member's access end: the latest of their cohort entitlements (refunded ones don't
// count) and, if they extended, one year from their first join.
export function accessEndsAt({ entitlements, firstJoinedAt, extended }, extendDays) {
  const ends = entitlements.filter((e) => !e.refunded).map((e) => e.endsAt.getTime());
  if (extended && firstJoinedAt) ends.push(plusDays(firstJoinedAt, extendDays).getTime());
  return ends.length ? new Date(Math.max(...ends)) : null;
}

// Access is current until accessEndsAt; after that the member keeps read-only history.
export const hasAccess = (member, now = new Date()) => Boolean(member?.accessEndsAt && now < member.accessEndsAt);

// Cohort features (daily check-ins, meditation, assignment, live session link) need
// current access and an entitlement for that cohort.
export function canUseCohort(member, entitlements, cohortId, now = new Date()) {
  return hasAccess(member, now) && entitlements.some((e) => e.cohortId === cohortId && !e.refunded);
}

// The member may extend while their access is current, if they hold a cohort and haven't already extended.
export function extendCheck(member, entitlements, now = new Date()) {
  if (!entitlements.some((e) => !e.refunded)) return { ok: false, reason: "Join a cohort first, then you can extend." };
  if (member?.extended) return { ok: false, reason: "You've already extended for the year." };
  if (!hasAccess(member, now)) return { ok: false, reason: "Your access has ended. Join a new cohort to continue." };
  return { ok: true };
}

// The expiry banner shows within this many days of the end.
export const expiresSoon = (member, now = new Date(), days = 7) =>
  hasAccess(member, now) && member.accessEndsAt.getTime() - now.getTime() <= days * DAY;

// ---------- Study Group ----------
// A subscription counts while Stripe says it's active (or trialing) and the paid period
// hasn't ended. A cancelled subscription keeps access until the end of the paid period.
export const subscriptionActive = (sub, now = new Date()) =>
  Boolean(sub && ["active", "trialing"].includes(sub.status) && sub.currentPeriodEnd && now < sub.currentPeriodEnd);

// Study Group access: an active subscription, or a cohort running now (cohort members get
// the Study Group included for their cohort's dates, so they don't pay twice). Returns why, and
// until when, for the page ("Included with your cohort until 18 February").
export function studyGroupAccess({ subscriptions = [], entitlements = [] }, now = new Date()) {
  const sub = subscriptions.filter((s) => subscriptionActive(s, now)).sort((a, b) => b.currentPeriodEnd - a.currentPeriodEnd)[0];
  if (sub) return { ok: true, via: "subscription", until: sub.currentPeriodEnd, cancelAtPeriodEnd: Boolean(sub.cancelAtPeriodEnd) };
  const running = entitlements.filter((e) => !e.refunded && e.startsAt <= now && now < e.endsAt).sort((a, b) => b.endsAt - a.endsAt)[0];
  if (running) return { ok: true, via: "cohort", until: running.endsAt };
  return { ok: false };
}
