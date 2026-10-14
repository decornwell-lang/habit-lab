// The three daytime prompts: morning and reflection (Home), meditation (Practices tab).
// Each saves to users/{uid}/practice/{today} and can be shared in the WhatsApp group.
// Wording and choices: src/content/dailyPrompts.js.
import { saveDayAnswer } from "../../lib/data.js";
import { MORNING_QUESTIONS, MORNING_CHOICES, MEDITATION_CHOICES } from "../../content/dailyPrompts.js";
import QuickAnswer from "./QuickAnswer.jsx";
import TodaysPractice from "./TodaysPractice.jsx";

const withNote = (lines, note) => (note?.trim() ? [...lines, "", note.trim()] : lines).join("\n");

// dayLabel is e.g. "Day 9 " (or "" outside a cohort). onSaved(key, answer) updates Home.
export function MorningPrompt({ uid, today, dayLabel, existing, onSaved }) {
  return (
    <QuickAnswer
      questions={MORNING_QUESTIONS.map((q) => ({ ...q, choices: MORNING_CHOICES }))}
      existing={existing}
      shareText={(a) => withNote([`☀️ ${dayLabel}morning`, ...MORNING_QUESTIONS.map((q) => `${q.label}: ${a[q.key]}`)], a.note)}
      onSave={(a) => {
        saveDayAnswer(uid, today, "morning", a).catch(console.error);
        onSaved("morning", a);
      }}
    />
  );
}

export function MeditationPrompt({ uid, today, dayLabel, content, existing, onSaved }) {
  const skipped = MEDITATION_CHOICES.at(-1);
  return (
    <>
      <TodaysPractice content={content} />
      <QuickAnswer
        questions={[{ key: "how", label: "How was it?", choices: MEDITATION_CHOICES }]}
        existing={existing}
        shareText={(a) => withNote([`🧘 ${dayLabel}meditation: ${a.how}`], a.note)}
        onSave={(a) => {
          const practised = a.how !== skipped;
          saveDayAnswer(uid, today, "meditation", a, { practised, week: content.week }).catch(console.error);
          onSaved("meditation", a, practised);
        }}
      />
    </>
  );
}

export function ReflectionPrompt({ uid, today, dayLabel, content, existing, onSaved }) {
  return (
    <>
      <h2>{content.dailyPrompt}</h2>
      <QuickAnswer
        text="Your response"
        existing={existing}
        shareText={(a) => [`✍️ ${dayLabel}reflection`, content.dailyPrompt, "", a.note.trim()].join("\n")}
        onSave={(a) => {
          saveDayAnswer(uid, today, "reflection", a).catch(console.error);
          onSaved("reflection", a);
        }}
      />
    </>
  );
}
