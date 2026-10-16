// Weekly content: each week's theme (from src/content/prompts.json),
// combined with what the admin has set (meditation and PDF links).
import prompts from "../content/prompts.json";

export const WEEKS_IN_PROGRAMME = prompts.habits.default.weeks.length;

export function weekPrompts(habitType, week) {
  const weeks = (prompts.habits[habitType] || prompts.habits.default).weeks;
  const index = Math.min(Math.max(week, 1), weeks.length) - 1;
  return weeks[index];
}

// The meditation from the nearest earlier week that has one (or any week), so Practices is
// never empty when this week's video isn't set yet.
function latestMeditation(settings, week) {
  const weeks = settings.weeks || {};
  for (let w = week; w >= 1; w--) if (weeks[w]?.meditationUrl) return weeks[w].meditationUrl;
  return Object.values(weeks).find((w) => w?.meditationUrl)?.meditationUrl || "";
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
    meditationUrl: admin.meditationUrl || latestMeditation(settings, week),
    reflectionUrl: admin.reflectionUrl || `/assets/reflections/week-${week}.pdf`,
  };
}
