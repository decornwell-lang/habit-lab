// Alcohol-free cohorts: short screening shown before joining. Edit the wording here, and
// have it checked by a health professional. The first three questions are the AUDIT-C
// (each answer scores 0–4, in order); the last asks about past withdrawal symptoms.
// It isn't a diagnosis: a high score only shows advice to speak to a doctor first.
export const SCREENING = {
  intro: "Before you join, four quick questions. Your answers are private: David only sees whether the advice below was shown.",
  questions: [
    {
      key: "often",
      label: "How often do you have a drink containing alcohol?",
      choices: ["Never", "Monthly or less", "2–4 times a month", "2–3 times a week", "4 or more times a week"],
    },
    {
      key: "amount",
      label: "On a typical day when you drink, how many drinks do you have?",
      hint: "One drink = a small glass of wine, a small beer or a single measure of spirits.",
      choices: ["1–2", "3–4", "5–6", "7–9", "10 or more"],
    },
    {
      key: "heavy",
      label: "How often do you have 6 or more drinks on one occasion?",
      choices: ["Never", "Less than monthly", "Monthly", "Weekly", "Daily or almost daily"],
    },
  ],
  withdrawal: {
    key: "withdrawal",
    label: "When you've stopped or cut down before, have you had shaking, sweating, feeling very anxious or sick, trouble sleeping, or seen or heard things that weren't there?",
    choices: ["No", "Yes"],
  },
  // Advice is shown at this AUDIT-C score or above (out of 12), or if withdrawal is "Yes".
  adviceScore: 8,
  advice: {
    title: "Please speak to a doctor before you stop",
    text:
      "Your answers suggest your body may have become used to alcohol. Stopping suddenly can then be unsafe, so please talk to your GP or a doctor before you stop or cut down, and before the cohort starts. They can help you do it safely. You're still welcome to join.",
    emergency: "If you feel very unwell after stopping, contact a doctor straight away or call emergency services (112 in Europe, 999 in the UK).",
    agree: "I've read this advice.",
  },
};
