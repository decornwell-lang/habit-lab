// The daily notifications and the quick answers members give in the app.
// Edit the wording, times or choices here. `hour` is the member's local time (24h).
// The server sends them (api/daily-prompts.js). Tapping one opens its tile on Home,
// or `link` if given. On Home, the morning, reflection and check-in tiles stay
// locked until their hour (the same time the notification goes out) and lock
// again at midnight.

export const DAILY_PROMPTS = [
  { id: "morning", hour: 7, title: "Good morning ☀️", body: "How are you feeling today?" },
  { id: "meditation", hour: 12, title: "Today's meditation 🧘", body: "Take 15 minutes to practise.", link: "/dashboard?tab=practices" },
  { id: "reflection", hour: 15, title: "Today's reflection ✍️", body: "A question to sit with today." },
  // Keep at 18, when the check-in opens (CHECKIN_OPENS_AT_HOUR in src/lib/dates.js).
  { id: "checkin", hour: 18, title: "Time for your check-in 🌿", body: "How was Day {day}?" },
];

// The hour a prompt opens, e.g. promptHour("checkin") → 18.
export const promptHour = (id) => DAILY_PROMPTS.find((p) => p.id === id)?.hour ?? 0;

// Morning: one quick choice for each.
export const MORNING_QUESTIONS = [
  { key: "body", label: "Physically" },
  { key: "heart", label: "Emotionally" },
  { key: "mind", label: "Mentally" },
];
export const MORNING_CHOICES = ["😔 Low", "😐 Okay", "🙂 Good"];

