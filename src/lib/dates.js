// Date helpers. Days are stored as "YYYY-MM-DD" strings in the member's
// own time zone, so "today" always means the member's today.

export function toKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const todayKey = () => toKey(new Date());

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
