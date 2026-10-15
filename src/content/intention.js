// Wording for the morning intention and the evening review. Edit freely.

// TODO (owner): verify the source of this proverb before launch.
export const PROVERB = "Everything rests on the tip of intention.";

export const CORE_QUESTION = "What does quitting mean to me?";

// The second question changes each week (Monday to Sunday), cycling through these.
export const WEEKLY_QUESTIONS = [
  "Who am I if I no longer smoke?",
  "What is my intention, in one sentence?",
  "What does this practice ask of me today?",
];

export const INVITATION =
  "Sit with the question for one minute. Notice what you feel emotionally, what your body is doing, and whether there is an impulse to smoke. You don't need an answer.";

export const NOTE_PROMPT = "If something came up, write a sentence or two.";
export const MAX_TEXT = 280; // characters, for every free-text answer

// This week's second question: weeks counted from Monday 5 January 2026, so everyone sees the same one.
// Counted in calendar days (not hours), so clock changes don't shift the week.
export function weeklyQuestion(date = new Date()) {
  const days = (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(2026, 0, 5)) / 86400000;
  const weeks = Math.floor(days / 7);
  return WEEKLY_QUESTIONS[((weeks % WEEKLY_QUESTIONS.length) + WEEKLY_QUESTIONS.length) % WEEKLY_QUESTIONS.length];
}

export const EVENING = {
  smoked: "Did you smoke today?",
  cravings: "How many cravings did you notice today?",
  strongest: "When did the strongest craving arrive?",
  noticed: "What did you notice in your body or emotions?",
  helped: "What helped, even a little?",
  // Shown only if the member answers "Yes" to smoking. Neutral, nothing else.
  honest: "Thank you for being honest. What do you want to carry into tomorrow?",
};
