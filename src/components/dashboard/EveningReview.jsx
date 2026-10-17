// Evening review (opens at 21:00), the day's final check-in, one per cohort: the cohort's
// yes/no question (e.g. "Did you smoke today?", "Did you exercise today?"), then the
// craving questions if the habit is about cravings. Every question is optional; "Skip
// today" is always there. If the practice wasn't kept, one neutral line appears, nothing
// else. Saved to users/{uid}/reflections/{date}_evening_{cohortId}.
// After Save, the answers show on the page and the button becomes "Share to WhatsApp"
// (their words; the craving intensity only if ticked). Wording: src/content/intention.js
// and the habit questions in src/lib/cohorts.js.
import { useState } from "react";
import { saveReflection } from "../../lib/data.js";
import { EVENING, MAX_TEXT } from "../../content/intention.js";
import QuestionStep from "./QuestionStep.jsx";
import SavedAnswers from "./SavedAnswers.jsx";
import SaveShareButton from "../SaveShareButton.jsx";
import DictationTextarea from "../DictationTextarea.jsx";
import ShareOptions from "../ShareOptions.jsx";
import { shareMessage } from "../../lib/shareMessage.js";

const INTENSITY = [0, 1, 2, 3, 4, 5];
const yesNo = (answer) => (answer === "yes" ? "Yes" : answer === "no" ? "No" : "");

// habit: the cohort's { cohortId, question, keptWhen, cravings, tab } (see HABIT_TYPES in cohorts.js).
export default function EveningReview({ uid, date, existing, habit, firstName, onSaved }) {
  const [form, setForm] = useState({
    answer: existing?.answer || null, // "yes" or "no"
    intensity: existing?.intensity ?? null,
    strongestAt: existing?.strongestAt || "",
    helped: existing?.helped || "",
    tomorrow: existing?.tomorrow || "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(Boolean(existing) && !existing?.skipped);
  const [share, setShare] = useState({ includeText: true, includeScore: false });
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const choose = (value) => set("answer", form.answer === value ? null : value);

  const { cohortId, cravings } = habit;
  const slipped = Boolean(form.answer) && form.answer !== habit.keptWhen;
  const written = [form.helped, slipped ? form.tomorrow : ""].map((t) => t.trim()).filter(Boolean).join(" ");
  const score = form.intensity === null ? "" : `cravings ${form.intensity}/5`;

  async function save(skipped) {
    setBusy(true);
    setError("");
    try {
      const entry = skipped
        ? { type: "evening", date, cohortId, skipped: true }
        : { type: "evening", date, cohortId, skipped: false, answer: form.answer, intensity: cravings ? form.intensity : null,
            strongestAt: cravings ? form.strongestAt.trim() : "", helped: form.helped.trim(), tomorrow: slipped ? form.tomorrow.trim() : "" };
      await saveReflection(uid, `${date}_evening_${cohortId}`, entry, { evening: { [cohortId]: skipped ? "skipped" : "done" } });
      await onSaved(entry, skipped); // also saves the cohort's check-in (streak)
      if (!skipped) setSaved(true);
    } catch (err) {
      console.error(err);
      setError("Couldn't save. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  let n = 0; // question numbers
  return (
    <div className="evening">
      <h2>Evening review</h2>
      <p className="muted small">{saved ? "Your answers for today." : "Every question is optional."}</p>

      {saved ? (
        <SavedAnswers onEdit={() => setSaved(false)} items={[
          { label: habit.question, value: yesNo(form.answer) },
          { label: EVENING.honest, value: slipped ? form.tomorrow : "", quote: true },
          { label: EVENING.intensity, value: cravings && form.intensity !== null ? `${form.intensity} / 5` : "" },
          { label: EVENING.strongest, value: cravings ? form.strongestAt : "" },
          { label: EVENING.helped, value: form.helped, quote: true },
        ]} />
      ) : (
        <>
          <QuestionStep n={++n} title={habit.question}>
            <div className="segmented">
              {["yes", "no"].map((v) => (
                <button type="button" key={v} aria-pressed={form.answer === v} onClick={() => choose(v)}
                  className={form.answer === v ? (v === habit.keptWhen ? "selected" : "selected no") : ""}>
                  {yesNo(v)}
                </button>
              ))}
            </div>
          </QuestionStep>
          {slipped && (
            <div className="evening-honest">
              <p>{EVENING.honest}</p>
              <DictationTextarea rows={2} maxLength={MAX_TEXT} value={form.tomorrow} onChange={(v) => set("tomorrow", v)}
                aria-label={EVENING.honest} />
            </div>
          )}

          {cravings && (
            <>
              <QuestionStep n={++n} title={EVENING.intensity}>
                <div className="scale-row" role="group" aria-label={EVENING.intensity}>
                  {INTENSITY.map((i) => (
                    <button type="button" key={i} className={form.intensity === i ? "selected" : ""} aria-pressed={form.intensity === i}
                      onClick={() => set("intensity", form.intensity === i ? null : i)}>
                      {i}
                    </button>
                  ))}
                </div>
                <div className="scale-labels"><span>{EVENING.intensityLow}</span><span>{EVENING.intensityHigh}</span></div>
              </QuestionStep>

              <QuestionStep n={++n} title={EVENING.strongest} hint="Optional">
                <input className="q-input" type="time" value={form.strongestAt} onChange={(e) => set("strongestAt", e.target.value)} aria-label={EVENING.strongest} />
              </QuestionStep>
            </>
          )}

          <QuestionStep n={++n} title={EVENING.helped} hint="Optional">
            <DictationTextarea rows={2} maxLength={MAX_TEXT} value={form.helped} onChange={(v) => set("helped", v)}
              aria-label={EVENING.helped} />
            <p className="char-count">{form.helped.length} / {MAX_TEXT}</p>
          </QuestionStep>
        </>
      )}

      {error && <p className="form-error">{error}</p>}
      {saved && <ShareOptions {...share} onChange={(c) => setShare((s) => ({ ...s, ...c }))} />}
      <SaveShareButton saved={saved} busy={busy} onSave={() => save(false)} group={habit.tab}
        shareText={shareMessage({ firstName, label: "evening review", text: written, score, ...share })} />
      {!saved && <button className="btn btn-text skip-link" onClick={() => save(true)} disabled={busy}>Skip today</button>}
    </div>
  );
}
