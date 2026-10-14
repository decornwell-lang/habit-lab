// Streaks and badges.
// A streak is the number of consecutive days with a "Yes" check-in.
// A "No" or a missed day pauses it; history is never deleted.
import { addDays, daysBetween } from "./dates.js";

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

// Badge milestones, in days. After one year, a badge is earned every year.
const MILESTONES = [
  { id: "d1", days: 1, label: "First day", icon: "🌱" },
  { id: "d7", days: 7, label: "7 days", icon: "🌿" },
  { id: "d30", days: 30, label: "30 days", icon: "🌳" },
  { id: "d66", days: 66, label: "66 days", icon: "🏔️" },
  { id: "m6", days: 182, label: "6 months", icon: "🌕" },
  { id: "y1", days: 365, label: "1 year", icon: "⭐" },
];

export function badgesForStreak(streak) {
  const ids = MILESTONES.filter((b) => streak >= b.days).map((b) => b.id);
  for (let year = 2; year * 365 <= streak; year++) ids.push(`y${year}`);
  return ids;
}

// The next badge to earn after this streak, e.g. 🌿 at 7 days.
export function nextBadge(streak) {
  return MILESTONES.find((b) => b.days > streak) || badgeInfo(`y${Math.floor(streak / 365) + 1}`);
}

export function badgeInfo(id) {
  const found = MILESTONES.find((b) => b.id === id);
  if (found) return found;
  const years = Number(id.slice(1));
  return { id, days: years * 365, label: `${years} years`, icon: "⭐" };
}

// Sorts badge ids from smallest to largest milestone.
export function sortBadges(ids = []) {
  return [...ids].sort((a, b) => badgeInfo(a).days - badgeInfo(b).days);
}
