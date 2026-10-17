// Meditation progress (src/lib/mindful.js): the checks from the brief.
import assert from "node:assert/strict";
import { mondayOnOrBefore, isMonday, mindfulStats, earnedMilestones, nextMilestone, canLogDate, weekUnlocksAt, zonedMidnight, weekOfCohort } from "../src/lib/mindful.js";

const today = "2026-10-17"; // a Saturday
// Two sources on one day: one mindful day, both durations in the minutes.
let s = mindfulStats({ "2026-10-17": { minutes: 15, entries: [{ source: "app", minutes: 10 }, { source: "manual_log", minutes: 5 }] } }, today);
assert.equal(s.days, 1); assert.equal(s.minutes, 15);

// "This week" is the last 7 days; rest days are left out, never counted against.
const week = { "2026-10-12": { minutes: 5 }, "2026-10-13": { minutes: 5 }, "2026-10-14": { minutes: 5 }, "2026-10-15": { minutes: 5 }, "2026-10-16": { minutes: 5 } };
s = mindfulStats(week, today);
assert.deepEqual(s.week, { done: 5, of: 7 });
s = mindfulStats(week, today, ["saturday", "sunday"]);
assert.deepEqual(s.week, { done: 5, of: 5 }); // 5 of 5: the weekend doesn't count against them
// A practice on a rest day is still a mindful day (and doesn't break "this week").
s = mindfulStats({ ...week, "2026-10-17": { minutes: 3 } }, today, ["saturday", "sunday"]);
assert.equal(s.days, 6); assert.deepEqual(s.week, { done: 5, of: 5 });
// Days after today never count.
assert.equal(mindfulStats({ "2026-10-30": { minutes: 5 } }, today).days, 0);

// Milestones 1, 7, 14, 21, 28 mindful days, not consecutive.
assert.deepEqual(earnedMilestones(0), []);
assert.deepEqual(earnedMilestones(7), [1, 7]);
assert.deepEqual(earnedMilestones(30), [1, 7, 14, 21, 28]);
assert.equal(nextMilestone(7), 14); assert.equal(nextMilestone(28), null);

// Logging: this week only (Monday to today).
assert.equal(canLogDate("2026-10-12", today), true);  // Monday
assert.equal(canLogDate("2026-10-11", today), false); // last Sunday
assert.equal(canLogDate("2026-10-18", today), false); // tomorrow

// A week unlocks at Monday 00:00 in the member's own time zone, not the server's.
assert.equal(zonedMidnight("2027-01-04", "Europe/Madrid").toISOString(), "2027-01-03T23:00:00.000Z"); // winter, UTC+1
assert.equal(zonedMidnight("2026-07-06", "Europe/Madrid").toISOString(), "2026-07-05T22:00:00.000Z"); // summer, UTC+2
assert.equal(weekUnlocksAt("2027-01-04", 2, "America/New_York").toISOString(), "2027-01-11T05:00:00.000Z");
assert.equal(weekUnlocksAt("2027-01-04", 1, "Asia/Tokyo").toISOString(), "2027-01-03T15:00:00.000Z");

// Cohort weeks: four weeks in 28 days.
assert.equal(weekOfCohort("2027-01-04", "2027-01-03"), 0);
assert.equal(weekOfCohort("2027-01-04", "2027-01-04"), 1);
assert.equal(weekOfCohort("2027-01-04", "2027-01-10"), 1);
assert.equal(weekOfCohort("2027-01-04", "2027-01-11"), 2);
assert.equal(weekOfCohort("2027-01-04", "2027-01-31"), 4);
assert.equal(weekOfCohort("2027-01-04", "2027-02-01"), 5);
// Cohorts start on a Monday: a Friday start moves to the Monday before.
assert.equal(mondayOnOrBefore("2026-10-09"), "2026-10-05");
assert.equal(mondayOnOrBefore("2026-10-05"), "2026-10-05");
assert.equal(mondayOnOrBefore("2026-10-11"), "2026-10-05"); // Sunday
assert.equal(isMonday("2027-01-04"), true); assert.equal(isMonday("2027-01-08"), false);
console.log("Mindful days: all checks pass");
