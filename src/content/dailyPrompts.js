// The three daily notifications, and the morning check-in's questions.
// Members are notified at 06:00 (morning), 08:00 (intention) and 21:00 (evening review,
// the day's final check-in), each in their own time zone. Edit wording and times here;
// `hour` (and optional `minute`) is the member's local time.
// The server sends them (api/daily-prompts.js); tapping one opens its tile on Home.
// On Home, each tile stays locked until its time and locks again at midnight.

export const DAILY_PROMPTS = [
  { id: "morning", hour: 6, title: "Good morning ☀️", body: "How are you feeling today?" },
  { id: "intention", hour: 8, title: "Your intention for today", body: "Take one minute with this." },
  // The day's final check-in. Keep at CHECKIN_OPENS_AT_HOUR in src/lib/dates.js.
  { id: "evening", hour: 21, title: "Evening review", body: "A minute to reflect on today." },
];

// When a prompt opens: promptTime("intention") → { hour: 8, minute: 0 }.
export function promptTime(id) {
  const p = DAILY_PROMPTS.find((x) => x.id === id);
  return { hour: p?.hour ?? 0, minute: p?.minute ?? 0 };
}

// Morning: one quick choice for each.
export const MORNING_QUESTIONS = [
  { key: "body", label: "Physically" },
  { key: "heart", label: "Emotionally" },
  { key: "mind", label: "Mentally" },
];
export const MORNING_CHOICES = ["😔 Low", "😐 Okay", "🙂 Good"];

