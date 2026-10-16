// The morning check-in on Home (opens 06:00), one per cohort: physically, emotionally,
// mentally, and an optional note. Saves to users/{uid}/practice/{today} as
// "morning_<cohortId>"; then Share to WhatsApp (in that cohort's group).
// Wording and choices: src/content/dailyPrompts.js.
import { saveDayAnswer } from "../../lib/data.js";
import { MORNING_QUESTIONS, MORNING_CHOICES } from "../../content/dailyPrompts.js";
import QuickAnswer from "./QuickAnswer.jsx";

const withNote = (lines, note) => (note?.trim() ? [...lines, "", note.trim()] : lines).join("\n");

// dayLabel is e.g. "Day 9 ". onSaved(key, answer) updates Home. group: e.g. "Smoke-free".
export default function MorningCheckin({ uid, today, cohortId, dayLabel, group, existing, onSaved }) {
  const key = `morning_${cohortId}`;
  return (
    <QuickAnswer
      group={group}
      questions={MORNING_QUESTIONS.map((q) => ({ ...q, choices: MORNING_CHOICES }))}
      existing={existing}
      shareText={(a) => withNote([`☀️ ${dayLabel}morning`, ...MORNING_QUESTIONS.map((q) => `${q.label}: ${a[q.key]}`)], a.note)}
      summary={(a) => [...MORNING_QUESTIONS.map((q) => ({ label: q.label, value: a[q.key] })), { label: "Note", value: a.note?.trim(), quote: true }]}
      onSave={async (a) => {
        await saveDayAnswer(uid, today, key, a);
        onSaved(key, a);
      }}
    />
  );
}
