// The daily notifications and the quick answers members give in the app.
// Edit the wording, times or choices here. `hour` is the member's local time (24h).
// The server sends them (api/daily-prompts.js) and the app shows them on Home.

export const DAILY_PROMPTS = [
  { id: "morning", hour: 8, title: "Good morning ☀️", body: "How are you feeling today?" },
  { id: "meditation", hour: 12, title: "Today's meditation 🧘", body: "How was your practice?" },
  { id: "reflection", hour: 15, title: "Today's reflection ✍️", body: "A question to sit with today." },
  // Keep at 18, when the check-in opens (CHECKIN_OPENS_AT_HOUR in src/lib/dates.js).
  { id: "checkin", hour: 18, title: "Time for your check-in 🌿", body: "How was Day {day}?" },
];

// Morning: one quick choice for each.
export const MORNING_QUESTIONS = [
  { key: "body", label: "Physically" },
  { key: "heart", label: "Emotionally" },
  { key: "mind", label: "Mentally" },
];
export const MORNING_CHOICES = ["😔 Low", "😐 Okay", "🙂 Good"];

// Meditation: how it went. The last choice means it didn't happen.
export const MEDITATION_CHOICES = ["🌊 Restless", "🌿 Settled", "✨ Deep", "Didn't get to it"];
