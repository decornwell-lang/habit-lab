// Date helpers. Days are stored as "YYYY-MM-DD" strings in the member's
// own time zone (from their phone or computer clock).

// A practice day starts at this hour, in each member's own time zone.
// Before it (midnight to 06:59), the app still treats it as the previous day,
// so a late-night check-in counts for the day just lived. Change it here.
export const DAY_STARTS_AT_HOUR = 7;

export function toKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// The current practice day (it switches over at DAY_STARTS_AT_HOUR, not midnight).
export const todayKey = (now = new Date()) => toKey(new Date(now.getTime() - DAY_STARTS_AT_HOUR * 3600000));

// True between midnight and the start of the practice day (e.g. 00:00–06:59).
export const isBeforeDayStarts = (now = new Date()) => now.getHours() < DAY_STARTS_AT_HOUR;

// "07:00" in a friendly form.
export const dayStartLabel = () => `${String(DAY_STARTS_AT_HOUR).padStart(2, "0")}:00`;

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
