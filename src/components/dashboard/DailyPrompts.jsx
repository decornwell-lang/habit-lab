// The daytime prompts on Home: morning and reflection.
// Each saves to users/{uid}/practice/{today} and can be shared in the WhatsApp group.
// Wording and choices: src/content/dailyPrompts.js.
import { saveDayAnswer } from "../../lib/data.js";
import { MORNING_QUESTIONS, MORNING_CHOICES } from "../../content/dailyPrompts.js";
import QuickAnswer from "./QuickAnswer.jsx";

const withNote = (lines, note) => (note?.trim() ? [...lines, "", note.trim()] : lines).join("\n");

// dayLabel is e.g. "Day 9 " (or "" outside a cohort). onSaved(key, answer) updates Home.
export function MorningPrompt({ uid, today, dayLabel, existing, onSaved }) {
  return (
    <QuickAnswer
      questions={MORNING_QUESTIONS.map((q) => ({ ...q, choices: MORNING_CHOICES }))}
      existing={existing}
      shareText={(a) => withNote([`☀️ ${dayLabel}morning`, ...MORNING_QUESTIONS.map((q) => `${q.label}: ${a[q.key]}`)], a.note)}
      onSave={async (a) => {
        await saveDayAnswer(uid, today, "morning", a);
        onSaved("morning", a);
      }}
    />
  );
}

export function ReflectionPrompt({ uid, today, dayLabel, content, existing, onSaved }) {
  return (
    <>
      <blockquote className="q-prompt">{content.dailyPrompt}</blockquote>
      <QuickAnswer
        text="Your response"
        existing={existing}
        shareText={(a) => [`✍️ ${dayLabel}reflection`, content.dailyPrompt, "", a.note.trim()].join("\n")}
        onSave={async (a) => {
          await saveDayAnswer(uid, today, "reflection", a);
          onSaved("reflection", a);
        }}
      />
    </>
  );
}
