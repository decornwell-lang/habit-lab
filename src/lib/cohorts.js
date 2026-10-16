// Cohort helpers: habits, where a member is in each of their cohorts, prices.
import { daysBetween, addDays } from "./dates.js";

// The habits a cohort can be about. Change the wording here.
//   label     the habit's name (Admin → Cohorts)
//   tab       the button on Home when a member is in more than one cohort
//   streak    how a streak is described, e.g. "12 days smoke-free"
//   question  the evening review's question for this cohort
//   keptWhen  the answer to `question` that keeps the streak going
//   kept, missed  a day on the journey, e.g. "Smoke-free" / "Smoked"
//   cravings  true if the evening review's craving questions apply
//   accent    the cohort's colour on Home (labels, chips, selected answers…), so you can
//             feel which cohort you're in
export const HABIT_TYPES = [
  { id: "smoking", label: "Smoking", tab: "Smoke-free", streak: "smoke-free", question: "Did you smoke today?", keptWhen: "no", kept: "Smoke-free", missed: "Smoked", cravings: true, accent: "#57bda2" },
  { id: "alcohol", label: "Alcohol", tab: "Alcohol-free", streak: "alcohol-free", question: "Did you drink alcohol today?", keptWhen: "no", kept: "Alcohol-free", missed: "Drank", cravings: true, accent: "#8fa6f5" },
  { id: "gambling", label: "Gambling", tab: "Gamble-free", streak: "gamble-free", question: "Did you gamble today?", keptWhen: "no", kept: "Gamble-free", missed: "Gambled", cravings: true, accent: "#e79bb4" },
  { id: "exercise", label: "Fitness", tab: "Fitness", streak: "of exercise", question: "Did you exercise today?", keptWhen: "yes", kept: "Exercised", missed: "Didn't exercise", accent: "#a8d672" },
  { id: "meditation", label: "Meditation", tab: "Meditation", streak: "of meditation", question: "Did you meditate today?", keptWhen: "yes", kept: "Meditated", missed: "Didn't meditate", accent: "#c4a3ec" },
  { id: "asthma", label: "Asthma", tab: "Asthma", streak: "of breathing practice", question: "Did you do your breathing practice today?", keptWhen: "yes", kept: "Practised", missed: "Didn't practise", accent: "#6cc8e8" },
  { id: "weightLoss", label: "Weight loss", tab: "Healthy eating", streak: "of healthy eating", question: "Did you eat well today?", keptWhen: "yes", kept: "Ate well", missed: "Didn't eat well", accent: "#f2b57c" },
];

const OTHER_HABIT = { label: "Practice", tab: "Practice", streak: "of practice", question: "Did you keep your practice today?", keptWhen: "yes", kept: "Kept", missed: "Not kept", accent: "#57bda2" };
export const habitInfo = (id) => HABIT_TYPES.find((h) => h.id === id) || { ...OTHER_HABIT, id };
export const habitLabel = (id) => habitInfo(id).label;
const habitOrder = (id) => {
  const i = HABIT_TYPES.findIndex((h) => h.id === id);
  return i === -1 ? HABIT_TYPES.length : i; // unknown habits last
};
export const habitStreakLabel = (id) => habitInfo(id).streak;

// Where the member is today in a cohort.
// If they chose "Restart from day 1", their own start date is used instead.
// Returns { state: "upcoming" | "active" | "finished", day, week, start, end }
function cohortProgress(cohort, membership, today, weeksInProgramme = 5) {
  const start = membership?.personalStartDate || cohort.startDate;
  const end = addDays(start, cohort.durationDays - 1);
  const day = daysBetween(start, today) + 1;

  if (cohort.status === "finished" && !membership?.personalStartDate) return { state: "finished", start, end };
  if (day < 1) return { state: "upcoming", daysUntil: 1 - day, start, end };
  if (day > cohort.durationDays) return { state: "finished", start, end };
  return { state: "active", day, week: Math.min(Math.ceil(day / 7), weeksInProgramme), start, end };
}

// All of the member's cohorts, each as { cohort, membership, progress }, in the order
// they're shown on Home: active ones (earliest start first), then upcoming, then finished
// (latest first). Cohorts starting the same day follow the order of HABIT_TYPES.
export function memberCohorts(cohorts, memberships, today) {
  const order = { active: 0, upcoming: 1, finished: 2 };
  return memberships
    .map((m) => {
      const cohort = cohorts.find((c) => c.id === m.cohortId);
      return cohort ? { cohort, membership: m, progress: cohortProgress(cohort, m, today) } : null;
    })
    .filter(Boolean)
    .sort((a, b) =>
      order[a.progress.state] - order[b.progress.state] ||
      (a.progress.state === "finished" ? -1 : 1) * a.progress.start.localeCompare(b.progress.start) ||
      habitOrder(a.cohort.habitType) - habitOrder(b.cohort.habitType)
    );
}

// The member's check-ins for one habit across all its cohorts (phase 1, phase 2…), keyed by
// date, so the streak carries on from one cohort to the next. A day counts as kept if it was
// kept in any of them.
export function habitCheckinsFor(checkins, cohorts, habitType) {
  const habitOf = Object.fromEntries(cohorts.map((c) => [c.id, c.habitType]));
  const map = {};
  for (const c of checkins) {
    if ((c.cohortId ? habitOf[c.cohortId] : "smoking") !== habitType) continue;
    if (!map[c.date] || c.maintained) map[c.date] = c;
  }
  return map;
}

// The member's check-ins for one cohort, keyed by date: { "2026-10-12": {...} }.
// `checkins` is the list from getCheckins(). Early check-ins have no cohortId; they
// were all from smoking cohorts.
export function checkinsFor(checkins, cohort) {
  const mine = checkins.filter((c) => (c.cohortId ? c.cohortId === cohort.id : cohort.habitType === "smoking"));
  return Object.fromEntries(mine.map((c) => [c.date, c]));
}

// "starts in 80 days", "starts tomorrow" or "starts today": the countdown on cohort listings.
export function startsIn(startDate, today) {
  const days = daysBetween(today, startDate);
  return days > 1 ? `starts in ${days} days` : days === 1 ? "starts tomorrow" : "starts today";
}

// Prices are in euros and include VAT, e.g. "€99" (or "Free").
export function formatPrice(cohort) {
  const amount = Number(cohort.price) || 0;
  if (!amount) return "Free";
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}
