// Today's aphorism, the same for every member.
//   1. An approved line scheduled for today (data/aphorisms-approved.json, "showOn").
//      Lines get their day when the owner approves them (scripts/aphorism-review.js).
//   2. Otherwise the owner's fixed library (data/aphorisms-library.json),
//      picked by day of the year.
// Only approved or owner-written lines can ever be returned: drafts are never read here.
import approved from "../../data/aphorisms-approved.json";
import library from "../../data/aphorisms-library.json";
import { parseKey } from "./dates.js";

const asLine = (entry) => (typeof entry === "string" ? { text: entry } : entry);

export function aphorismFor(dateKey) {
  const scheduled = approved.find((a) => a.showOn === dateKey);
  if (scheduled) return scheduled;
  if (!library.length) return null;
  const date = parseKey(dateKey);
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  return asLine(library[dayOfYear % library.length]);
}
