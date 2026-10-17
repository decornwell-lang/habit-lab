import assert from "node:assert/strict";
import { subscriptionActive, studyGroupAccess } from "../src/lib/access.js";
const now = new Date("2026-10-17T12:00:00Z"), d = (s) => new Date(s);
const sub = (o) => ({ status: "active", currentPeriodEnd: d("2027-10-17"), ...o });
assert.equal(subscriptionActive(sub(), now), true);
assert.equal(subscriptionActive(sub({ status: "trialing" }), now), true);
assert.equal(subscriptionActive(sub({ status: "past_due" }), now), false);
assert.equal(subscriptionActive(sub({ status: "canceled" }), now), false);
assert.equal(subscriptionActive(sub({ currentPeriodEnd: d("2026-10-01") }), now), false);
// cancelled at period end: still active until the end
assert.deepEqual(studyGroupAccess({ subscriptions: [sub({ cancelAtPeriodEnd: true })] }, now), { ok: true, via: "subscription", until: d("2027-10-17"), cancelAtPeriodEnd: true });
// cohort running includes it; future or finished or refunded cohorts don't
const ent = (o) => ({ startsAt: d("2026-10-09"), endsAt: d("2026-11-11"), ...o });
assert.equal(studyGroupAccess({ entitlements: [ent()] }, now).via, "cohort");
assert.equal(studyGroupAccess({ entitlements: [ent({ startsAt: d("2027-01-04"), endsAt: d("2027-02-06") })] }, now).ok, false);
assert.equal(studyGroupAccess({ entitlements: [ent({ refunded: true })] }, now).ok, false);
assert.equal(studyGroupAccess({ entitlements: [ent({ endsAt: d("2026-10-10") })] }, now).ok, false);
// subscription wins over cohort when both
assert.equal(studyGroupAccess({ subscriptions: [sub()], entitlements: [ent()] }, now).via, "subscription");
assert.equal(studyGroupAccess({}, now).ok, false);
console.log("Study Group access: all checks pass");
import { accessEndsAt, paidCohortPeriods, entitlementPeriod } from "../src/lib/access.js";
// booked in October for a January cohort: access runs 4 Jan + 33 days, not from October
const jan = entitlementPeriod("2027-01-04", 33);
assert.equal(jan.startsAt.toISOString().slice(0, 10), "2027-01-04");
assert.equal(jan.endsAt.toISOString().slice(0, 10), "2027-02-06");
// year: 365 days from the first cohort's start
assert.equal(accessEndsAt({ entitlements: [jan], extended: true }, 365).toISOString().slice(0, 10), "2028-01-04");
assert.equal(accessEndsAt({ entitlements: [jan], extended: false }, 365).toISOString().slice(0, 10), "2027-02-06");
// paid cohorts include the Study Group only during the cohort's dates; unpaid ones don't count
const cohorts = [{ id: "a", startDate: "2026-10-09", durationDays: 33 }, { id: "b", startDate: "2027-01-04", durationDays: 33 }, { id: "c", startDate: "2026-10-01", durationDays: 33 }];
const periods = paidCohortPeriods([{ cohortId: "a", paid: true }, { cohortId: "b", paid: true }, { cohortId: "c", paid: false }], cohorts, 33);
assert.equal(periods.length, 2);
assert.equal(studyGroupAccess({ entitlements: periods }, now).via, "cohort");
assert.equal(studyGroupAccess({ entitlements: periods }, new Date("2026-12-20")).ok, false); // between cohorts
assert.equal(studyGroupAccess({ entitlements: periods }, new Date("2027-01-10")).ok, true);
console.log("Cohort dates and year: all checks pass");
