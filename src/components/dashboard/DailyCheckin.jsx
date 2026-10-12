// 2. Daily Check-in: commitment Yes/No, craving 0-10, one open question.
// Only shown to members who have joined a cohort.
import { useState } from "react";
import { saveCheckin } from "../../lib/data.js";
import { formatDate } from "../../lib/dates.js";
import { COMMITMENT_QUESTION, CRAVING_QUESTION } from "../../lib/content.js";

export default function DailyCheckin({ uid, current, content, existing, streak, today, onSaved }) {
  const { cohort, progress } = current;
  const [editing, setEditing] = useState(!existing);
  const [maintained, setMaintained] = useState(existing?.maintained ?? null);
  const [craving, setCraving] = useState(existing?.craving ?? null);
  const [answer, setAnswer] = useState(existing?.answer ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (progress.state === "upcoming") {
    return (
      <section className="card">
        <p className="card-label">Daily Check-in</p>
        <p className="muted">Your daily check-ins begin on {formatDate(progress.start)}, day 1 of {cohort.name}.</p>
      </section>
    );
  }
  if (progress.state === "finished") {
    return (
      <section className="card">
        <p className="card-label">Daily Check-in</p>
        <p className="muted">{cohort.name} has finished. Thank you for practising together.</p>
      </section>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (maintained === null) return setError("Please answer Yes or No.");
    if (craving === null) return setError("Please choose a number from 0 to 10.");
    setBusy(true);
    try {
      const checkin = {
        cohortId: cohort.id,
        day: progress.day,
        week: progress.week,
        maintained,
        craving,
        question: content.openQuestion,
        answer: answer.trim(),
      };
      await saveCheckin(uid, today, checkin);
      await onSaved(today, checkin);
      setEditing(false);
    } catch (err) {
      console.error(err);
      setError("We couldn't save your check-in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const streakLine =
    streak > 0 ? `Current streak: ${streak} ${streak === 1 ? "day" : "days"}` : "Your streak begins with your next Yes.";

  if (!editing) {
    return (
      <section className="card">
        <p className="card-label">Daily Check-in · Day {progress.day}</p>
        <h2>Today's check-in is saved</h2>
        <p className="streak">{streakLine}</p>
        <ul className="summary">
          <li>Commitment kept today: <strong>{existing?.maintained ? "Yes" : "No"}</strong></li>
          <li>Cravings: <strong>{existing?.craving} / 10</strong></li>
          {existing?.answer && <li>“{existing.answer}”</li>}
        </ul>
        <button className="btn btn-ghost" onClick={() => setEditing(true)}>Change today's answers</button>
      </section>
    );
  }

  return (
    <section className="card">
      <p className="card-label">Daily Check-in · Day {progress.day}</p>
      <h2>{content.dailyPrompt}</h2>
      <p className="streak">{streakLine}</p>

      <form onSubmit={handleSubmit}>
        <fieldset className="question">
          <legend>{COMMITMENT_QUESTION}</legend>
          <div className="segmented">
            <button type="button" className={maintained === true ? "selected" : ""} aria-pressed={maintained === true} onClick={() => setMaintained(true)}>Yes</button>
            <button type="button" className={maintained === false ? "selected" : ""} aria-pressed={maintained === false} onClick={() => setMaintained(false)}>No</button>
          </div>
        </fieldset>

        <fieldset className="question">
          <legend>{CRAVING_QUESTION}</legend>
          <div className="scale">
            {Array.from({ length: 11 }, (_, n) => (
              <button type="button" key={n} className={craving === n ? "selected" : ""} aria-pressed={craving === n} onClick={() => setCraving(n)}>
                {n}
              </button>
            ))}
          </div>
          <div className="scale-labels"><span>None</span><span>Very strong</span></div>
        </fieldset>

        <div className="field">
          <label htmlFor="answer">{content.openQuestion}</label>
          <textarea id="answer" rows={3} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Optional, a few words is enough" />
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Submit check-in"}</button>
      </form>
    </section>
  );
}
