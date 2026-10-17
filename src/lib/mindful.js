// Meditation progress: mindful days, minutes, "this week", milestones, and when each cohort
// week unlocks. Pure functions (no database), used by the Home tile, Practices and the
// archive, and tested in scripts/test-mindful.mjs.
//
// A mindful day is a date with at least one practice, from any source, in any cohort.
// Several practices on one day are still one mindful day; their minutes add up.
// sessions: { "2026-10-17": { minutes, entries: [{ source, practiceId, minutes }] }, ... }

import { addDays } from "./dates.js";

export const MINDFUL_MILESTONES = [1, 7, 14, 21, 28]; // mindful days (not consecutive)
export const PRACTICE_LENGTHS = [3, 5, 10, 15, 20]; // minutes
export const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const weekdayOf = (dateKey) => WEEKDAYS[(new Date(`${dateKey}T12:00:00Z`).getUTCDay() + 6) % 7];

// { days, minutes, week: { done, of } }. "This week" is the last 7 days (today included);
// the member's rest days (up to two) are left out of it entirely, so they never count
// against them. A practice on a rest day is still a mindful day.
export function mindfulStats(sessions, today, restDays = []) {
  const dates = Object.keys(sessions).filter((d) => d <= today);
  const minutes = dates.reduce((sum, d) => sum + (Number(sessions[d]?.minutes) || 0), 0);
  const last7 = Array.from({ length: 7 }, (_, i) => addDays(today, -i));
  const counted = last7.filter((d) => !restDays.includes(weekdayOf(d)));
  return {
    days: dates.length,
    minutes,
    week: { done: counted.filter((d) => sessions[d]).length, of: counted.length },
  };
}

export const earnedMilestones = (days) => MINDFUL_MILESTONES.filter((m) => days >= m);
// The next milestone, or null after the last.
export const nextMilestone = (days) => MINDFUL_MILESTONES.find((m) => m > days) ?? null;

// The Monday on or before a date. Cohorts always start on a Monday.
export const mondayOnOrBefore = (dateKey) => addDays(dateKey, -WEEKDAYS.indexOf(weekdayOf(dateKey)));
export const isMonday = (dateKey) => weekdayOf(dateKey) === "monday";

// Members may log a practice for today or an earlier day of the current week (Monday to today).
export function canLogDate(dateKey, today) {
  return dateKey >= mondayOnOrBefore(today) && dateKey <= today;
}

// Midnight at the start of `dateKey` in a time zone, as a Date (UTC instant).
export function zonedMidnight(dateKey, timeZone = "Europe/Madrid") {
  const guess = new Date(`${dateKey}T00:00:00Z`);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
      .formatToParts(guess).map((p) => [p.type, p.value])
  );
  const asZone = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  return new Date(guess.getTime() - (asZone - guess.getTime()));
}

// Cohort weeks: week 1 starts on the cohort's start date (a Monday), week 2 seven days later,
// and so on. A week unlocks at 00:00 on its Monday in the member's own time zone.
export const cohortWeeks = (durationDays = 28) => Math.ceil(durationDays / 7);
export const weekStart = (startDate, week) => addDays(startDate, 7 * (week - 1));
export const weekUnlocksAt = (startDate, week, timeZone) => zonedMidnight(weekStart(startDate, week), timeZone);

// The cohort week a date falls in (1 to n), or 0 before the cohort, or n + 1 after it.
export function weekOfCohort(startDate, dateKey, durationDays = 28) {
  if (dateKey < startDate) return 0;
  const days = Math.round((new Date(`${dateKey}T12:00:00Z`) - new Date(`${startDate}T12:00:00Z`)) / 86400000);
  return Math.min(Math.floor(days / 7) + 1, cohortWeeks(durationDays) + 1);
}
