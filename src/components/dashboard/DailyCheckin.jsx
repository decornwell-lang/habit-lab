// 2. Daily Check-in: commitment Yes/No, craving rating, one open question.
// Only shown to members who have joined a cohort.
// The craving scale (1-5) is set in src/content/prompts.json.
import { useState } from "react";
import { saveCheckin } from "../../lib/data.js";
import { formatDate, isBeforeCheckinOpens, checkinOpensLabel, todayKey } from "../../lib/dates.js";
import { COMMITMENT_QUESTION, CRAVING_QUESTION, CRAVING_SCALE } from "../../lib/content.js";

const scaleValues = Array.from({ length: CRAVING_SCALE.max - CRAVING_SCALE.min + 1 }, (_, i) => CRAVING_SCALE.min + i);

// The short report members can send to their pod's WhatsApp group.
// They can edit it in WhatsApp before sending. Change the wording here.
function podReport({ checkin, progress, content, streak }) {
  const lines = [
    `🌿 Day ${progress.day} check-in · ${content.title}`,
    checkin.maintained
      ? `✅ Kept my commitment today${streak > 1 ? ` (${streak}-day streak)` : ""}`
      : "🌊 A hard day today. Coming back to my practice.",
    `Cravings: ${checkin.craving}/${CRAVING_SCALE.max}`,
  ];
  if (checkin.answer) lines.push("", `${content.openQuestion}`, `“${checkin.answer}”`);
  return lines.join("\n");
}

// Opens WhatsApp with the message ready; the member picks their pod's group.
const whatsAppShareLink = (text) => `https://wa.me/?text=${encodeURIComponent(text)}`;

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.6-.3z"
      />
    </svg>
  );
}

// `day` is the check-in day that's open now and `progress` is where that day sits
// in the cohort (see checkinDayKey in src/lib/dates.js: check-ins open at 18:00).
export default function DailyCheckin({ uid, current, progress, content, existing, streak, day, onSaved }) {
  const { cohort } = current;
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
        <p className="muted">
          {progress.start === todayKey()
            ? `Your first check-in opens today at ${checkinOpensLabel()}.`
            : `Your daily check-ins begin on ${formatDate(progress.start)}, from ${checkinOpensLabel()}.`}
        </p>
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
    if (craving === null) return setError(`Please choose a number from ${CRAVING_SCALE.min} to ${CRAVING_SCALE.max}.`);
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
      await saveCheckin(uid, day, checkin);
      await onSaved(day, checkin);
      setEditing(false);
    } catch (err) {
      console.error(err);
      setError("We couldn't save your check-in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // Before 18:00 the open check-in is yesterday's; from 18:00 it's today's.
  const forYesterday = isBeforeCheckinOpens();
  const opens = checkinOpensLabel();
  const cardLabel = forYesterday
    ? `Yesterday's check-in · Day ${progress.day} · open until ${opens}`
    : `Today's check-in · Day ${progress.day}`;

  const streakLine =
    streak > 0 ? `Current streak: ${streak} ${streak === 1 ? "day" : "days"}` : "Your streak begins with your next Yes.";

  if (!editing) {
    return (
      <section className="card">
        <p className="card-label">{cardLabel}</p>
        <h2>{forYesterday ? "Yesterday's" : "Today's"} check-in is saved</h2>
        <p className="streak">{streakLine}</p>
        <ul className="summary">
          <li>Commitment kept: <strong>{existing?.maintained ? "Yes" : "No"}</strong></li>
          <li>Cravings: <strong>{existing?.craving} / {CRAVING_SCALE.max}</strong></li>
          {existing?.answer && <li>“{existing.answer}”</li>}
        </ul>
        {existing && (
          <a className="btn btn-whatsapp" href={whatsAppShareLink(podReport({ checkin: existing, progress, content, streak }))} target="_blank" rel="noreferrer">
            <WhatsAppIcon /> Share with my pod
          </a>
        )}
        <button className="btn btn-ghost" onClick={() => setEditing(true)}>Change {forYesterday ? "yesterday's" : "today's"} answers</button>
        <p className="muted small center">
          {forYesterday ? `Today's check-in opens at ${opens}.` : `Your next check-in opens tomorrow at ${opens}.`}
        </p>
      </section>
    );
  }

  return (
    <section className="card">
      <p className="card-label">{cardLabel}</p>
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
          <div className="scale" style={{ gridTemplateColumns: `repeat(${scaleValues.length}, 1fr)` }}>
            {scaleValues.map((n) => (
              <button type="button" key={n} className={craving === n ? "selected" : ""} aria-pressed={craving === n} onClick={() => setCraving(n)}>
                {n}
              </button>
            ))}
          </div>
          <div className="scale-labels"><span>{CRAVING_SCALE.lowLabel}</span><span>{CRAVING_SCALE.highLabel}</span></div>
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
