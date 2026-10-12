// Cohort helpers: where a member is in their cohort, their pod, prices.
import { daysBetween, addDays } from "./dates.js";

// `streak` is how a streak is described on the leaderboard and when sharing,
// e.g. "12 days smoke-free". Change the wording here.
export const HABIT_TYPES = [
  { id: "smoking", label: "Smoking", streak: "smoke-free", icon: "🚭" },
  { id: "alcohol", label: "Alcohol", streak: "alcohol-free", icon: "💧" },
  { id: "exercise", label: "Exercise", streak: "of exercise", icon: "🏃" },
  { id: "weightLoss", label: "Weight loss", streak: "of healthy eating", icon: "🥗" },
];

export const habitLabel = (id) => HABIT_TYPES.find((h) => h.id === id)?.label || id;
export const habitStreakLabel = (id) => HABIT_TYPES.find((h) => h.id === id)?.streak || "of practice";
export const habitIcon = (id) => HABIT_TYPES.find((h) => h.id === id)?.icon || "🌿";

// Where the member is today in a cohort.
// If they chose "Restart from day 1", their own start date is used instead.
// Returns { state: "upcoming" | "active" | "finished", day, week, start, end }
export function cohortProgress(cohort, membership, today, weeksInProgramme = 5) {
  const start = membership?.personalStartDate || cohort.startDate;
  const end = addDays(start, cohort.durationDays - 1);
  const day = daysBetween(start, today) + 1;

  if (cohort.status === "finished" && !membership?.personalStartDate) return { state: "finished", start, end };
  if (day < 1) return { state: "upcoming", daysUntil: 1 - day, start, end };
  if (day > cohort.durationDays) return { state: "finished", start, end };
  return { state: "active", day, week: Math.min(Math.ceil(day / 7), weeksInProgramme), start, end };
}

// Chooses which of the member's cohorts the dashboard should focus on:
// an active one first, then the next upcoming one, then the latest finished one.
export function pickCurrentCohort(cohorts, memberships, today) {
  const rows = memberships
    .map((m) => {
      const cohort = cohorts.find((c) => c.id === m.cohortId);
      return cohort ? { cohort, membership: m, progress: cohortProgress(cohort, m, today) } : null;
    })
    .filter(Boolean);
  const byStart = (a, b) => a.progress.start.localeCompare(b.progress.start);
  return (
    rows.filter((r) => r.progress.state === "active").sort(byStart)[0] ||
    rows.filter((r) => r.progress.state === "upcoming").sort(byStart)[0] ||
    rows.filter((r) => r.progress.state === "finished").sort(byStart).at(-1) ||
    null
  );
}

export function formatPrice(cohort) {
  const amount = Number(cohort.price) || 0;
  if (!amount) return "Free";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: (cohort.currency || "gbp").toUpperCase(),
  }).format(amount);
}
