// "Your journey": one dot per cohort day (from the evening review, the day's check-in).
//   filled aqua  = a smoke-free day ("Did you smoke today? No")
//   gold ring    = a hard day, and you came back (answered "Yes")
//   pale         = no check-in
//   outlined     = today, and days still to come are faint
// Tap today or a past day to correct it (e.g. a smoke-free day logged by mistake as smoking).
import { useState } from "react";
import { addDays, todayKey, daysBetween, formatDate } from "../../lib/dates.js";
import { habitStreakLabel } from "../../lib/cohorts.js";

// onCorrect(date, day, maintained) saves the change (returns a promise).
export default function JourneyMap({ current, checkins, onCorrect }) {
  const { cohort, progress } = current;
  const [editing, setEditing] = useState(null); // the day being corrected
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
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

  async function correct(maintained) {
    setBusy(true);
    setError("");
    try {
      await onCorrect(editing.date, editing.day, maintained);
      setEditing(null);
    } catch (err) {
      console.error(err);
      setError("Couldn't save. Please try again.");
    } finally {
      setBusy(false);
    }
  }

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
          <li key={d.date} className={`dot ${d.state}${editing?.date === d.date ? " editing" : ""}`} title={`Day ${d.day}`}>
            {onCorrect && d.state !== "future" ? (
              <button type="button" className="dot-button" aria-label={`Day ${d.day}: ${d.state}. Change`}
                onClick={() => { setError(""); setEditing(editing?.date === d.date ? null : d); }} />
            ) : (
              <span className="sr-only">Day {d.day}: {d.state}</span>
            )}
          </li>
        ))}
      </ol>
      {editing && (
        <div className="journey-edit">
          <p><strong>Day {editing.day}</strong> · {formatDate(editing.date)}</p>
          <div className="segmented">
            <button type="button" className={editing.state === "kept" ? "selected" : ""} disabled={busy} onClick={() => correct(true)}>
              {cohort.habitType === "smoking" ? "Smoke-free" : "Kept"}
            </button>
            <button type="button" className={editing.state === "returned" ? "selected no" : ""} disabled={busy} onClick={() => correct(false)}>
              {cohort.habitType === "smoking" ? "Smoked" : "Not kept"}
            </button>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>
      )}
      {onCorrect && !editing && <p className="muted small">Made a mistake? Tap a day to change it.</p>}
      <ul className="journey-legend">
        <li><span className="dot kept" /> {cohort.habitType === "smoking" ? "Smoke-free" : "Kept"}</li>
        <li><span className="dot returned" /> Returned</li>
        <li><span className="dot today" /> Today</li>
      </ul>
    </section>
  );
}
