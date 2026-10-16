// Date helpers. Days are stored as "YYYY-MM-DD" strings in the member's
// own time zone (from their phone or computer clock).

// The daily check-in opens at this hour (in each member's own time zone) and
// stays open until the same time the next day. Check-in for a day therefore
// runs from 21:00 that day to 20:59 the next. Change the hour here.
export const CHECKIN_OPENS_AT_HOUR = 21; // the evening review (final check-in) opens at 21:00

export function toKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Today's date (normal midnight-to-midnight day): used for practice and cohort days.
export const todayKey = (now = new Date()) => toKey(now);

// The day whose check-in is open right now. Before 21:00 it's yesterday's;
// from 21:00 it's today's.
export const checkinDayKey = (now = new Date()) =>
  now.getHours() >= CHECKIN_OPENS_AT_HOUR ? toKey(now) : addDays(toKey(now), -1);

// The member's time zone name, e.g. "Europe/Madrid".
export const timeZoneName = () => Intl.DateTimeFormat().resolvedOptions().timeZone || null;

export function parseKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key, n) {
  const date = parseKey(key);
  date.setDate(date.getDate() + n);
  return toKey(date);
}

// Whole days from `a` to `b` (positive if b is later).
export function daysBetween(a, b) {
  return Math.round((parseKey(b) - parseKey(a)) / 86400000);
}

export function formatDate(key, options = {}) {
  if (!key) return "";
  return parseKey(key).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  });
}

// The week of the year (ISO 8601: weeks start on Monday; week 1 holds the first Thursday).
// Used to pick the weekly assignment, 1 to 52; a rare week 53 counts as week 1.
export function weekOfYear(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day); // the Thursday of this week
  const week = Math.ceil(((d - Date.UTC(d.getUTCFullYear(), 0, 1)) / 86400000 + 1) / 7);
  return week > 52 ? 1 : week;
}

// The next weekly session as a moment in time: e.g. every Monday (1) at 18:00 in
// Europe/Madrid, which is 18:00 CET in winter and CEST in summer.
export function nextWeeklySession({ weekday = 1, hour = 18, minute = 0, timeZone = "Europe/Madrid" } = {}, now = new Date()) {
  const parts = (d) => Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23" })
      .formatToParts(d).map((p) => [p.type, p.value])
  );
  for (let i = 0; i <= 7; i++) {
    const p = parts(new Date(now.getTime() + i * 86400000));
    const days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    if (days[p.weekday] !== weekday) continue;
    // That day at hh:mm in the session's time zone, as an instant.
    const guess = Date.UTC(+p.year, +p.month - 1, +p.day, hour, minute);
    const g = parts(new Date(guess));
    const offset = Date.UTC(+g.year, +g.month - 1, +g.day, +g.hour, +g.minute) - guess;
    const at = new Date(guess - offset);
    if (at > now) return at;
  }
  return null;
}
