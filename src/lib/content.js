// Weekly content: each week's theme (from src/content/prompts.json),
// combined with what the admin has set (meditation and PDF links).
import prompts from "../content/prompts.json";

export const WEEKS_IN_PROGRAMME = prompts.habits.default.weeks.length;

export function weekPrompts(habitType, week) {
  const weeks = (prompts.habits[habitType] || prompts.habits.default).weeks;
  const index = Math.min(Math.max(week, 1), weeks.length) - 1;
  return weeks[index];
}

// Everything the dashboard shows for one week.
// `settings` is the admin's Content settings (from Firestore).
export function weekContent(habitType, week, settings = {}) {
  const p = weekPrompts(habitType, week);
  const admin = settings.weeks?.[week] || {};
  return {
    week,
    ...p,
    title: admin.title || `Week ${week}: ${p.theme}`,
    meditationUrl: admin.meditationUrl || "",
    reflectionUrl: admin.reflectionUrl || `/assets/reflections/week-${week}.pdf`,
  };
}
