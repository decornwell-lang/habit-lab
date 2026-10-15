// Daily check-in (Home): commitment Yes/No, craving rating, one open question,
// then one button: "Save", which then becomes "Share to WhatsApp".
// Only shown to members who have joined a cohort.
// The craving scale (1-5) is set in src/content/prompts.json.
import { useState } from "react";
import { saveCheckin } from "../../lib/data.js";
import { formatDate, isBeforeCheckinOpens, checkinOpensLabel, todayKey } from "../../lib/dates.js";
import { COMMITMENT_QUESTION, CRAVING_QUESTION, CRAVING_SCALE } from "../../lib/content.js";
import SaveShareButton from "../SaveShareButton.jsx";
import QuestionStep from "./QuestionStep.jsx";

const scaleValues = Array.from({ length: CRAVING_SCALE.max - CRAVING_SCALE.min + 1 }, (_, i) => CRAVING_SCALE.min + i);

// The short report members can share in their cohort's WhatsApp group.
// They can edit it in WhatsApp before sending. Change the wording here.
function groupReport({ checkin, progress, content, streak }) {
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



// `day` is the check-in day that's open now and `progress` is where that day sits
// in the cohort (see checkinDayKey in src/lib/dates.js: check-ins open at 18:00).
export default function DailyCheckin({ uid, current, progress, content, existing, streak, day, onSaved }) {
  const { cohort } = current;
  const [saved, setSaved] = useState(existing || null); // the saved check-in; changing an answer clears it
  const [maintained, setMaintainedRaw] = useState(existing?.maintained ?? null);
  const [craving, setCravingRaw] = useState(existing?.craving ?? null);
  const [answer, setAnswerRaw] = useState(existing?.answer ?? "");
  // Any change means it needs saving again (the button goes back to "Save").
  const changed = (setter) => (value) => { setter(value); setSaved(null); };
  const setMaintained = changed(setMaintainedRaw);
  const setCraving = changed(setCravingRaw);
  const setAnswer = changed(setAnswerRaw);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (progress.state === "upcoming") {
    return (
      <section className="card">
        <p className="card-label">Daily Check-in</p>
        <p className="muted">
          {progress.start === todayKey()
            ? `Opens today at ${checkinOpensLabel()}.`
            : `Starts ${formatDate(progress.start)}.`}
        </p>
      </section>
    );
  }
  if (progress.state === "finished") {
    return (
      <section className="card">
        <p className="card-label">Daily Check-in</p>
        <p className="muted">{cohort.name} has finished. Thank you.</p>
      </section>
    );
  }

  async function handleSave() {
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
      setSaved(checkin);
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

  const streakLine =
    streak > 0 ? `Streak · ${streak} ${streak === 1 ? "day" : "days"}` : "Your streak starts with your next Yes.";

  return (
    <section className="card">
      <p className="streak">{saved ? "✓ Saved · " : ""}{streakLine}</p>

      <form onSubmit={(e) => e.preventDefault()}>
        <QuestionStep n={1} title={COMMITMENT_QUESTION}>
          <div className="segmented">
            <button type="button" className={maintained === true ? "selected yes" : ""} aria-pressed={maintained === true} onClick={() => setMaintained(true)}>Yes</button>
            <button type="button" className={maintained === false ? "selected no" : ""} aria-pressed={maintained === false} onClick={() => setMaintained(false)}>No</button>
          </div>
        </QuestionStep>

        <QuestionStep n={2} title={CRAVING_QUESTION}>
          <div className="scale" style={{ gridTemplateColumns: `repeat(${scaleValues.length}, 1fr)` }}>
            {scaleValues.map((n) => (
              <button type="button" key={n} className={craving === n ? "selected" : ""} aria-pressed={craving === n} onClick={() => setCraving(n)}>
                {n}
              </button>
            ))}
          </div>
          <div className="scale-labels"><span>{CRAVING_SCALE.lowLabel}</span><span>{CRAVING_SCALE.highLabel}</span></div>
        </QuestionStep>

        <QuestionStep n={3} title={content.openQuestion} hint="Optional">
          <textarea className="q-textarea" rows={3} aria-label={content.openQuestion} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="A few words is enough" />
        </QuestionStep>

        {error && <p className="form-error" role="alert">{error}</p>}
        <SaveShareButton saved={Boolean(saved)} canSave={maintained !== null && craving !== null} busy={busy} onSave={handleSave}
          shareText={saved ? groupReport({ checkin: saved, progress, content, streak }) : ""} />
        {saved && <p className="muted small center">Next check-in: {forYesterday ? "today" : "tomorrow"}, {opens}</p>}
      </form>
    </section>
  );
}
