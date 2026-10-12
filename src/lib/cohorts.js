// Cohort helpers: where a member is in their cohort, their pod, prices.
import { daysBetween, addDays } from "./dates.js";

export const HABIT_TYPES = [
  { id: "smoking", label: "Smoking" },
  { id: "alcohol", label: "Alcohol" },
  { id: "exercise", label: "Exercise" },
  { id: "weightLoss", label: "Weight loss" },
];

export const habitLabel = (id) => HABIT_TYPES.find((h) => h.id === id)?.label || id;

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

// Pods: cohort members are grouped in order of joining into pods of about 4,
// balanced so sizes differ by at most one (e.g. 6 members = two pods of 3).
// Pods can change while people are still joining, then settle once the cohort starts.
export function podFor(memberIds = [], uid, targetSize = 4) {
  if (!memberIds.includes(uid)) return [];
  const count = Math.max(1, Math.round(memberIds.length / targetSize));
  const base = Math.floor(memberIds.length / count);
  const extra = memberIds.length % count;
  let start = 0;
  for (let i = 0; i < count; i++) {
    const size = base + (i < extra ? 1 : 0);
    const pod = memberIds.slice(start, start + size);
    if (pod.includes(uid)) return pod;
    start += size;
  }
  return [];
}

export function formatPrice(cohort) {
  const amount = Number(cohort.price) || 0;
  if (!amount) return "Free";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: (cohort.currency || "gbp").toUpperCase(),
  }).format(amount);
}
