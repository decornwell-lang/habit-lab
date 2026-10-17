// Wording for the morning intention and the evening review. Edit freely.

// Morning intention, top to bottom.
export const INTENTION = {
  intro: "Each day, it's important that we reconnect with our intention and rededicate ourselves to it.",
  question: "What is my intention, in one sentence?",
  note: "This may change over time.",
  invitation:
    "I invite you now to reconnect with your intention and sit with it for one minute. Notice what emotions are present, what sensations are present in your body, and what thoughts are present.",
  box: "If something came up, write a sentence or two.",
};

export const MAX_TEXT = 280; // characters, for every free-text answer

// The first questions (one per cohort, e.g. "Did you smoke today?") are in src/lib/cohorts.js.
export const EVENING = {
  intensity: "How intense were the cravings today?",
  intensityLow: "None",
  intensityHigh: "Very strong",
  strongest: "When did the strongest craving arrive?",
  helped: "Name one thing that helped you today.",
  practised: "Did you practise today?",
  // Shown only if a practice wasn't kept today (e.g. "Yes" to smoking). Neutral, nothing else.
  honest: "Thank you for being honest. What do you want to carry into tomorrow?",
};
