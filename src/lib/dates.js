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

export function formatDateTime(iso) {
  const date = new Date(iso);
  if (!iso || isNaN(date)) return "";
  return date.toLocaleString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  });
}
