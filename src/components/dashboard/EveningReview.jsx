// Evening review (opens at 21:00), the day's final check-in. Every question is optional;
// "Skip today" is always there. If the member says they smoked, one neutral line
// appears, nothing else. Saved to users/{uid}/reflections/{date}_evening.
// After Save, the answers show on the page and the button becomes "Share to WhatsApp"
// (their words; the craving intensity only if ticked). Wording: src/content/intention.js.
import { useState } from "react";
import { saveReflection } from "../../lib/data.js";
import { EVENING, MAX_TEXT } from "../../content/intention.js";
import QuestionStep from "./QuestionStep.jsx";
import SavedAnswers from "./SavedAnswers.jsx";
import SaveShareButton from "../SaveShareButton.jsx";
import ShareOptions from "../ShareOptions.jsx";
import { shareMessage } from "../../lib/shareMessage.js";

const INTENSITY = [0, 1, 2, 3, 4, 5];

export default function EveningReview({ uid, date, existing, firstName, onSaved }) {
  const [form, setForm] = useState({
    smoked: existing?.smoked ?? null,
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
  const written = [form.helped, form.smoked ? form.tomorrow : ""].map((t) => t.trim()).filter(Boolean).join(" ");
  const score = form.intensity === null ? "" : `cravings ${form.intensity}/5`;

  async function save(skipped) {
    setBusy(true);
    setError("");
    try {
      const entry = skipped
        ? { type: "evening", date, skipped: true }
        : { type: "evening", date, skipped: false, smoked: form.smoked, intensity: form.intensity,
            strongestAt: form.strongestAt.trim(), helped: form.helped.trim(), tomorrow: form.smoked ? form.tomorrow.trim() : "" };
      await saveReflection(uid, `${date}_evening`, entry, { evening: skipped ? "skipped" : "done" });
      await onSaved(entry, skipped); // also saves the day's check-in (streak)
      if (!skipped) setSaved(true);
    } catch (err) {
      console.error(err);
      setError("Couldn't save. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="evening">
      <h2>Evening review</h2>
      <p className="muted small">{saved ? "Your answers for today." : "Every question is optional."}</p>

      {saved ? (
        <SavedAnswers onEdit={() => setSaved(false)} items={[
          { label: EVENING.smoked, value: form.smoked === true ? "Yes" : form.smoked === false ? "No" : "" },
          { label: EVENING.honest, value: form.smoked ? form.tomorrow : "", quote: true },
          { label: EVENING.intensity, value: form.intensity === null ? "" : `${form.intensity} / 5` },
          { label: EVENING.strongest, value: form.strongestAt },
          { label: EVENING.helped, value: form.helped, quote: true },
        ]} />
      ) : (
        <>
          <QuestionStep n={1} title={EVENING.smoked}>
            <div className="segmented">
              <button type="button" className={form.smoked === true ? "selected no" : ""} aria-pressed={form.smoked === true} onClick={() => set("smoked", form.smoked === true ? null : true)}>Yes</button>
              <button type="button" className={form.smoked === false ? "selected" : ""} aria-pressed={form.smoked === false} onClick={() => set("smoked", form.smoked === false ? null : false)}>No</button>
            </div>
            {form.smoked === true && (
              <div className="evening-honest">
                <p>{EVENING.honest}</p>
                <textarea className="q-textarea" rows={2} maxLength={MAX_TEXT} value={form.tomorrow} onChange={(e) => set("tomorrow", e.target.value)}
                  aria-label={EVENING.honest} />
              </div>
            )}
          </QuestionStep>

          <QuestionStep n={2} title={EVENING.intensity}>
            <div className="scale-row" role="group" aria-label={EVENING.intensity}>
              {INTENSITY.map((n) => (
                <button type="button" key={n} className={form.intensity === n ? "selected" : ""} aria-pressed={form.intensity === n}
                  onClick={() => set("intensity", form.intensity === n ? null : n)}>
                  {n}
                </button>
              ))}
            </div>
            <div className="scale-labels"><span>{EVENING.intensityLow}</span><span>{EVENING.intensityHigh}</span></div>
          </QuestionStep>

          <QuestionStep n={3} title={EVENING.strongest} hint="Optional">
            <input className="q-input" type="time" value={form.strongestAt} onChange={(e) => set("strongestAt", e.target.value)} aria-label={EVENING.strongest} />
          </QuestionStep>

          <QuestionStep n={4} title={EVENING.helped} hint="Optional">
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
