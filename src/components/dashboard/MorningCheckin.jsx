// The morning check-in on Home (opens 06:00), one per cohort: physically, emotionally,
// mentally, last night's sleep (quality and length), the control pause for asthma cohorts,
// and an optional note. Saves to users/{uid}/practice/{today} as "morning_<cohortId>"
// (sleep and control pause also feed the charts in "My progress"); then Share to WhatsApp
// (in that cohort's group). Wording and choices: src/content/dailyPrompts.js.
import { saveDayAnswer } from "../../lib/data.js";
import { MORNING_QUESTIONS, MORNING_CHOICES, SLEEP_QUESTIONS, CONTROL_PAUSE } from "../../content/dailyPrompts.js";
import QuickAnswer from "./QuickAnswer.jsx";

const withNote = (lines, note) => (note?.trim() ? [...lines, "", note.trim()] : lines).join("\n");
const show = (q, a) => (q.type === "seconds" ? (Number.isFinite(a[q.key]) ? `${a[q.key]} seconds` : "") : a[q.key] || "");

// dayLabel is e.g. "Day 9 ". onSaved(key, answer) updates Home. group: e.g. "Smoke-free".
export default function MorningCheckin({ uid, today, cohortId, habitType, dayLabel, group, existing, onSaved }) {
  const key = `morning_${cohortId}`;
  const questions = [
    ...MORNING_QUESTIONS.map((q) => ({ ...q, choices: MORNING_CHOICES })),
    ...SLEEP_QUESTIONS,
    ...(habitType === "asthma" ? [{ ...CONTROL_PAUSE, type: "seconds", optional: true }] : []),
  ];
  return (
    <QuickAnswer
      group={group}
      questions={questions}
      existing={existing}
      shareText={(a) => withNote([`☀️ ${dayLabel}morning`, ...questions.filter((q) => show(q, a)).map((q) => `${q.label}: ${show(q, a)}`)], a.note)}
      summary={(a) => [...questions.map((q) => ({ label: q.label, value: show(q, a) })), { label: "Note", value: a.note?.trim(), quote: true }]}
      onSave={async (a) => {
        await saveDayAnswer(uid, today, key, a);
        onSaved(key, a);
      }}
    />
  );
}
