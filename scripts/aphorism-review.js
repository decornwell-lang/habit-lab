// The owner's review step for AI-drafted aphorisms: approve, edit or reject.
// Used by Admin → Aphorisms through the local dev server only (see vite.config.js);
// it reads and writes the files in /data, so it never runs on the live site.
// Nothing reaches members until a line is approved here AND the change is pushed.
import fs from "node:fs";
import path from "node:path";
import { todayKey, addDays } from "../src/lib/dates.js";

const file = (name) => path.resolve("data", name);
const read = (name) => (fs.existsSync(file(name)) ? JSON.parse(fs.readFileSync(file(name), "utf8")) : []);
const write = (name, data) => fs.writeFileSync(file(name), JSON.stringify(data, null, 2) + "\n");

// Every review action, with its date: data/aphorisms-review-log.json
function log(action, draft, text = draft.text) {
  const entries = read("aphorisms-review-log.json");
  entries.push({ at: new Date().toISOString(), action, id: draft.id, text });
  write("aphorisms-review-log.json", entries);
}

export function reviewStatus() {
  const today = todayKey();
  const approved = read("aphorisms-approved.json");
  return {
    today,
    pending: read("aphorisms-drafts.json").filter((d) => d.status === "pending"),
    approvedTotal: approved.length,
    remaining: approved.filter((a) => a.showOn >= today).length, // lines still to be shown, today included
    libraryTotal: read("aphorisms-library.json").length,
  };
}

function findPending(drafts, id) {
  const draft = drafts.find((d) => d.id === id && d.status === "pending");
  if (!draft) throw new Error("That draft isn't pending any more.");
  return draft;
}

export function editDraft(id, text) {
  const clean = String(text || "").trim();
  if (!clean) throw new Error("The line can't be empty.");
  const drafts = read("aphorisms-drafts.json");
  const draft = findPending(drafts, id);
  log("edited", draft, clean);
  draft.text = clean;
  write("aphorisms-drafts.json", drafts);
}

export function rejectDraft(id) {
  const drafts = read("aphorisms-drafts.json");
  const draft = findPending(drafts, id);
  draft.status = "rejected"; // kept for the record, no longer pending
  write("aphorisms-drafts.json", drafts);
  log("rejected", draft);
}

// Moves the draft to data/aphorisms-approved.json and gives it the next free day
// in the rotation (showOn), so every member sees the same line on the same day.
export function approveDraft(id) {
  const drafts = read("aphorisms-drafts.json");
  const draft = findPending(drafts, id);
  const approved = read("aphorisms-approved.json");
  const today = todayKey();
  const last = approved.map((a) => a.showOn).sort().at(-1);
  const showOn = last && last >= today ? addDays(last, 1) : today;
  approved.push({ text: draft.text, source: "Habit Lab", theme: draft.theme, approvedOn: today, showOn });
  write("aphorisms-approved.json", approved);
  write("aphorisms-drafts.json", drafts.filter((d) => d.id !== id));
  log("approved", draft);
}
