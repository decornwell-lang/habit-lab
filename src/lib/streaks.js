// Streaks and badges.
// A streak is the number of days in a row a cohort's practice was kept (the evening
// review, e.g. "Did you smoke today? No"), stored as `maintained: true`.
// Each cohort has its own streak and badges.
// A "No" or a missed day pauses it; history is never deleted.
import { addDays, daysBetween } from "./dates.js";
import { habitCheckinsFor } from "./cohorts.js";

// `checkins` is an object keyed by date: { "2026-11-16": { maintained: true }, ... }
// If today has no check-in yet, we count back from yesterday, so the streak
// doesn't drop to zero in the morning before the member has checked in.
export function computeStreak(checkins, today) {
  let day = checkins[today] ? today : addDays(today, -1);
  let streak = 0;
  while (checkins[day]?.maintained === true) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

// The streak as other people should see it today. A stored streak whose last
// "Yes" was more than a day ago is paused, so it shows as 0.
export function effectiveStreak(profile, today) {
  if (!profile?.lastYesDate || !profile.streak) return 0;
  return daysBetween(profile.lastYesDate, today) <= 1 ? profile.streak : 0;
}

// The member's streak and badges for each cohort, from their public profile:
// [{ cohortId, habitType, streak, lastYesDate, badges }]. Stored in profile.cohorts;
// older profiles kept a single streak at the top level.
export function profileStreaks(profile) {
  const all = Object.entries(profile?.cohorts || {}).map(([cohortId, s]) => ({ cohortId, ...s }));
  // The older single streak, until the app moves it into profile.cohorts (see Dashboard.jsx).
  if ((profile?.streak || profile?.badges?.length) && !all.some((s) => s.habitType === profile.habitType)) {
    const { habitType, streak, lastYesDate, badges } = profile;
    all.push({ cohortId: null, habitType, streak, lastYesDate, badges });
  }
  return all;
}

// One cohort's entry from profileStreaks() (an older single streak counts for a cohort of the same habit).
export function profileStreakFor(profile, cohort) {
  const all = profileStreaks(profile);
  return all.find((s) => s.cohortId === cohort.id) || all.find((s) => !s.cohortId && s.habitType === cohort.habitType) || null;
}

// The longest run of kept days ever, for "Longest streak" (a slip never takes this away).
export function longestStreak(checkins) {
  let best = 0;
  let run = 0;
  let previous = null;
  for (const date of Object.keys(checkins).sort()) {
    run = checkins[date].maintained ? (previous && addDays(previous, 1) === date ? run + 1 : 1) : 0;
    previous = checkins[date].maintained ? date : null;
    best = Math.max(best, run);
  }
  return best;
}

// A cohort's entry for the public profile: { habitType, streak, best, lastYesDate, badges }.
// The streak belongs to the habit: it counts kept days across all the member's cohorts for
// that habit (`cohorts` is every cohort), so phase 2 carries on from phase 1. Badges for
// the habit are shared too, and are never taken away.
// Counts back from today once today's evening review is done (from 21:00), otherwise from
// the check-in day (see checkinDayKey in dates.js), so a day and its badge only count after
// that evening's check-in. Badges once earned are kept.
export function cohortStreakEntry(cohort, cohorts, checkins, profile, today, checkinDay) {
  const map = habitCheckinsFor(checkins, cohorts, cohort.habitType);
  const from = map[today] ? today : checkinDay;
  const streak = computeStreak(map, from);
  const lastYesDate = streak === 0 ? null : map[from]?.maintained ? from : addDays(from, -1);
  const earned = profileStreaks(profile).filter((s) => s.habitType === cohort.habitType).flatMap((s) => s.badges || []);
  return {
    habitType: cohort.habitType,
    streak,
    best: longestStreak(map),
    lastYesDate,
    badges: sortBadges([...new Set([...earned, ...badgesForStreak(streak)])]),
  };
}

// Badge milestones, in days: 1, 7, 20 and 33 (a full cohort), then 66 days, 6 months and a
// year for members who carry on; after one year, a badge is earned every year.
// Each badge is drawn as a gold seal with `num` and `unit` inside (see Badge.jsx).
const MILESTONES = [
  { id: "d1", days: 1, num: 1, unit: "day" },
  { id: "d7", days: 7, num: 7, unit: "days" },
  { id: "d20", days: 20, num: 20, unit: "days" },
  { id: "d33", days: 33, num: 33, unit: "days" },
  { id: "d66", days: 66, num: 66, unit: "days" },
  { id: "m6", days: 182, num: 6, unit: "months" },
  { id: "y1", days: 365, num: 1, unit: "year" },
].map((b) => ({ ...b, label: `${b.num} ${b.unit}`, name: `${b.num}-${b.unit.replace(/s$/, "")} badge` }));

export function badgesForStreak(streak) {
  const ids = MILESTONES.filter((b) => streak >= b.days).map((b) => b.id);
  for (let year = 2; year * 365 <= streak; year++) ids.push(`y${year}`);
  return ids;
}

// { id, days, num, unit, label, name } e.g. { id: "d7", days: 7, num: 7, unit: "days", label: "7 days", name: "7-day badge" }
export function badgeInfo(id) {
  const found = MILESTONES.find((b) => b.id === id);
  if (found) return found;
  if (/^d\d+$/.test(id)) { // a day badge no longer awarded (e.g. the old 30-day one): still shown
    const days = Number(id.slice(1));
    return { id, days, num: days, unit: "days", label: `${days} days`, name: `${days}-day badge` };
  }
  const years = Number(id.slice(1));
  return { id, days: years * 365, num: years, unit: "years", label: `${years} years`, name: `${years}-year badge` };
}

// The highest badge earned for this streak, or null before the first one.
export const currentBadge = (streak) => (streak > 0 ? badgeInfo(badgesForStreak(streak).at(-1)) : null);

// The next badge to earn after this streak.
export function nextBadge(streak) {
  return MILESTONES.find((b) => b.days > streak) || badgeInfo(`y${Math.floor(streak / 365) + 1}`);
}

export function sortBadges(ids = []) {
  return [...ids].sort((a, b) => badgeInfo(a).days - badgeInfo(b).days);
}
