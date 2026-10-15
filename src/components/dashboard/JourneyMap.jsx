// "Your journey": one dot per cohort day (from the evening review, the day's check-in).
//   filled aqua  = a smoke-free day ("Did you smoke today? No")
//   gold ring    = a hard day, and you came back (answered "Yes")
//   pale         = no check-in
//   outlined     = today, and days still to come are faint
import { addDays, todayKey, daysBetween } from "../../lib/dates.js";
import { habitStreakLabel } from "../../lib/cohorts.js";

export default function JourneyMap({ current, checkins }) {
  const { cohort, progress } = current;
  if (progress.state === "upcoming") return null;

  const today = todayKey(); // the calendar day, so today's dot is always outlined
  const days = Array.from({ length: cohort.durationDays }, (_, i) => {
    const date = addDays(progress.start, i);
    const c = checkins[date];
    const offset = daysBetween(today, date);
    let state = "future";
    if (offset === 0) state = c ? (c.maintained ? "kept" : "returned") : "today";
    else if (offset < 0) state = c ? (c.maintained ? "kept" : "returned") : "missed";
    return { day: i + 1, date, state };
  });

  const kept = days.filter((d) => d.state === "kept").length;
  const returned = days.filter((d) => d.state === "returned").length;

  return (
    <section className="card">
      <p className="card-label">Your journey</p>
      <h2>{kept} {kept === 1 ? "day" : "days"} {habitStreakLabel(cohort.habitType)}</h2>
      {returned > 0 && (
        <p className="muted small">
          And {returned} {returned === 1 ? "time" : "times"} you met a hard day and came back. That counts too.
        </p>
      )}
      <ol className="journey" aria-label={`Day by day, ${kept} days kept`}>
        {days.map((d) => (
          <li key={d.date} className={`dot ${d.state}`} title={`Day ${d.day}`}>
            <span className="sr-only">Day {d.day}: {d.state}</span>
          </li>
        ))}
      </ol>
      <ul className="journey-legend">
        <li><span className="dot kept" /> {cohort.habitType === "smoking" ? "Smoke-free" : "Kept"}</li>
        <li><span className="dot returned" /> Returned</li>
        <li><span className="dot today" /> Today</li>
      </ul>
    </section>
  );
}
