// Evening review (opens at 21:00), the day's final check-in. One yes/no question for
// each of the member's active cohorts (e.g. "Did you smoke today?", "Did you exercise
// today?"), then the craving questions if any cohort is about cravings. Every question is
// optional; "Skip today" is always there. If a practice wasn't kept, one neutral line
// appears, nothing else. Saved to users/{uid}/reflections/{date}_evening.
// After Save, the answers show on the page and the button becomes "Share to WhatsApp"
// (their words; the craving intensity only if ticked). Wording: src/content/intention.js
// and the habit questions in src/lib/cohorts.js.
import { useState } from "react";
import { saveReflection } from "../../lib/data.js";
import { EVENING, MAX_TEXT } from "../../content/intention.js";
import QuestionStep from "./QuestionStep.jsx";
import SavedAnswers from "./SavedAnswers.jsx";
import SaveShareButton from "../SaveShareButton.jsx";
import ShareOptions from "../ShareOptions.jsx";
import { shareMessage } from "../../lib/shareMessage.js";

const INTENSITY = [0, 1, 2, 3, 4, 5];
const yesNo = (answer) => (answer === "yes" ? "Yes" : answer === "no" ? "No" : "");

// habits: [{ cohortId, habitType, question, keptWhen, cravings }], one per active cohort.
export default function EveningReview({ uid, date, existing, habits, firstName, onSaved }) {
  const [form, setForm] = useState({
    answers: existing?.answers || {},
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
  const answer = (cohortId, value) => setForm((f) => ({ ...f, answers: { ...f.answers, [cohortId]: f.answers[cohortId] === value ? null : value } }));

  const cravings = habits.some((h) => h.cravings);
  const slipped = habits.some((h) => form.answers[h.cohortId] && form.answers[h.cohortId] !== h.keptWhen);
  const written = [form.helped, slipped ? form.tomorrow : ""].map((t) => t.trim()).filter(Boolean).join(" ");
  const score = form.intensity === null ? "" : `cravings ${form.intensity}/5`;

  async function save(skipped) {
    setBusy(true);
    setError("");
    try {
      const answers = Object.fromEntries(Object.entries(form.answers).filter(([, v]) => v));
      const entry = skipped
        ? { type: "evening", date, skipped: true }
        : { type: "evening", date, skipped: false, answers, intensity: cravings ? form.intensity : null,
            strongestAt: cravings ? form.strongestAt.trim() : "", helped: form.helped.trim(), tomorrow: slipped ? form.tomorrow.trim() : "" };
      await saveReflection(uid, `${date}_evening`, entry, { evening: skipped ? "skipped" : "done" });
      await onSaved(entry, skipped); // also saves each cohort's check-in (streaks)
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
          ...habits.map((h) => ({ label: h.question, value: yesNo(form.answers[h.cohortId]) })),
          { label: EVENING.honest, value: slipped ? form.tomorrow : "", quote: true },
          { label: EVENING.intensity, value: cravings && form.intensity !== null ? `${form.intensity} / 5` : "" },
          { label: EVENING.strongest, value: cravings ? form.strongestAt : "" },
          { label: EVENING.helped, value: form.helped, quote: true },
        ]} />
      ) : (
        <>
          {habits.map((h) => (
            <QuestionStep key={h.cohortId} n={++n} title={h.question}>
              <div className="segmented">
                {["yes", "no"].map((v) => (
                  <button type="button" key={v} aria-pressed={form.answers[h.cohortId] === v} onClick={() => answer(h.cohortId, v)}
                    className={form.answers[h.cohortId] === v ? (v === h.keptWhen ? "selected" : "selected no") : ""}>
                    {yesNo(v)}
                  </button>
                ))}
              </div>
            </QuestionStep>
          ))}
          {slipped && (
            <div className="evening-honest">
              <p>{EVENING.honest}</p>
              <textarea className="q-textarea" rows={2} maxLength={MAX_TEXT} value={form.tomorrow} onChange={(e) => set("tomorrow", e.target.value)}
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
            <textarea className="q-textarea" rows={2} maxLength={MAX_TEXT} value={form.helped} onChange={(e) => set("helped", e.target.value)}
              aria-label={EVENING.helped} />
            <p className="char-count">{form.helped.length} / {MAX_TEXT}</p>
          </QuestionStep>
        </>
      )}

      {error && <p className="form-error">{error}</p>}
      {saved && <ShareOptions {...share} onChange={(c) => setShare((s) => ({ ...s, ...c }))} />}
      <SaveShareButton saved={saved} busy={busy} onSave={() => save(false)}
        shareText={shareMessage({ firstName, label: "evening review", text: written, score, ...share })} />
      {!saved && <button className="btn btn-text skip-link" onClick={() => save(true)} disabled={busy}>Skip today</button>}
    </div>
  );
}
