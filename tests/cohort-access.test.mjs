import assert from "node:assert/strict";
import { cohortAccess } from "../src/lib/access.js";
const cfg = { cohortDays: 28, extendDays: 365 }, d = (s) => new Date(s);
const cohorts = [{ id: "jan", startDate: "2027-01-04", durationDays: 28 }, { id: "oct", startDate: "2026-10-09", durationDays: 28 }, { id: "old", startDate: "2026-01-05", durationDays: 28, archived: true }];
// booked in October for January: upcoming until 4 Jan, active 4 Jan to 31 Jan, ended from 1 Feb
assert.equal(cohortAccess([{ cohortId: "jan", paid: true }], cohorts, cfg, d("2026-10-20")).state, "upcoming");
assert.equal(cohortAccess([{ cohortId: "jan", paid: true }], cohorts, cfg, d("2027-01-04T10:00Z")).state, "active");
assert.equal(cohortAccess([{ cohortId: "jan", paid: true }], cohorts, cfg, d("2027-01-31T23:00Z")).state, "active");
assert.equal(cohortAccess([{ cohortId: "jan", paid: true }], cohorts, cfg, d("2027-02-01T00:00Z")).state, "ended");
// year plan: a year from the cohort's start (4 Jan 2027 → 4 Jan 2028)
const y = cohortAccess([{ cohortId: "jan", paid: true, plan: "year" }], cohorts, cfg, d("2027-06-01"));
assert.equal(y.state, "active"); assert.equal(y.endsAt.toISOString().slice(0, 10), "2028-01-04");
// running cohort plus a future one: active now
assert.equal(cohortAccess([{ cohortId: "oct" }, { cohortId: "jan" }], cohorts, cfg, d("2026-10-20")).state, "active");
// between cohorts: upcoming (the next one is booked)
assert.equal(cohortAccess([{ cohortId: "oct" }, { cohortId: "jan" }], cohorts, cfg, d("2026-12-01")).state, "upcoming");
// archived cohorts and no cohorts
assert.equal(cohortAccess([{ cohortId: "old" }], cohorts, cfg, d("2026-01-10")).state, "none");
assert.equal(cohortAccess([], cohorts, cfg).state, "none");
console.log("Cohort access: all checks pass");
