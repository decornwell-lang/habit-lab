// The daily notifications and the quick answers members give in the app.
// Members are notified three times a day: 07:00 morning, 09:00 intention, 21:00 evening
// review (the day's final check-in). Prompts with notify: false open on Home but don't notify.
// Edit the wording, times or choices here. `hour` is the member's local time (24h).
// The server sends them (api/daily-prompts.js). Tapping one opens its tile on Home,
// or `link` if given. On Home, the morning, reflection and check-in tiles stay
// locked until their hour (the same time the notification goes out) and lock
// again at midnight.

export const DAILY_PROMPTS = [
  { id: "morning", hour: 7, title: "Good morning ☀️", body: "How are you feeling today?" },
  { id: "intention", hour: 9, title: "Your intention for today", body: "Take one minute with this." },
  { id: "reflection", hour: 15, title: "Today's reflection ✍️", body: "A question to sit with today.", notify: false },
  { id: "meditation", hour: 12, title: "Today's meditation 🧘", body: "Take 15 minutes to practise.", link: "/dashboard?tab=practices", notify: false },
  // The day's final check-in. Keep at CHECKIN_OPENS_AT_HOUR in src/lib/dates.js.
  { id: "evening", hour: 21, title: "Evening review", body: "A minute to reflect on today." },
];

// When a prompt opens: promptTime("intention") → { hour: 7, minute: 15 }.
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

