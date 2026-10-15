// Evening review (opens at 21:00). Every question is optional; "Skip today" is always there.
// If the member says they smoked, one neutral line appears, nothing else.
// Saved to users/{uid}/reflections/{date}_evening. Wording: src/content/intention.js.
import { useState } from "react";
import { saveReflection } from "../../lib/data.js";
import { EVENING, MAX_TEXT } from "../../content/intention.js";
import QuestionStep from "./QuestionStep.jsx";

const MAX_CRAVINGS = 20; // shown as "20+"

export default function EveningReview({ uid, date, existing, onSaved }) {
  const [form, setForm] = useState({
    smoked: existing?.smoked ?? null,
    cravings: existing?.cravings ?? null,
    strongestAt: existing?.strongestAt || "",
    noticed: existing?.noticed || "",
    helped: existing?.helped || "",
    tomorrow: existing?.tomorrow || "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  async function save(skipped) {
    setBusy(true);
    setError("");
    try {
      const entry = skipped
        ? { type: "evening", date, skipped: true }
        : { type: "evening", date, skipped: false, ...form, strongestAt: form.strongestAt.trim(), noticed: form.noticed.trim(),
            helped: form.helped.trim(), tomorrow: form.smoked ? form.tomorrow.trim() : "" };
      await saveReflection(uid, `${date}_evening`, entry, { evening: skipped ? "skipped" : "done" });
      onSaved(entry);
    } catch (err) {
      console.error(err);
      setError("Couldn't save. Please try again.");
      setBusy(false);
    }
  }

  const text = (key, label, n) => (
    <QuestionStep n={n} title={label} hint="Optional">
      <textarea className="q-textarea" rows={2} maxLength={MAX_TEXT} value={form[key]} onChange={(e) => set(key, e.target.value)}
        aria-label={label} />
      <p className="char-count">{form[key].length} / {MAX_TEXT}</p>
    </QuestionStep>
  );

  return (
    <div className="evening">
      <h2>Evening review</h2>
      <p className="muted small">Every question is optional.</p>

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

      <QuestionStep n={2} title={EVENING.cravings}>
        <div className="breathe-stepper counter" role="group" aria-label={EVENING.cravings}>
          <button type="button" onClick={() => set("cravings", Math.max(0, (form.cravings ?? 0) - 1))} disabled={!form.cravings} aria-label="Fewer">−</button>
          <span>{form.cravings === null ? "–" : form.cravings >= MAX_CRAVINGS ? `${MAX_CRAVINGS}+` : form.cravings}</span>
          <button type="button" onClick={() => set("cravings", Math.min(MAX_CRAVINGS, (form.cravings ?? -1) + 1))} disabled={form.cravings >= MAX_CRAVINGS} aria-label="More">+</button>
        </div>
      </QuestionStep>

      <QuestionStep n={3} title={EVENING.strongest} hint="Optional">
        <input className="q-input" type="time" value={form.strongestAt} onChange={(e) => set("strongestAt", e.target.value)} aria-label={EVENING.strongest} />
      </QuestionStep>

      {text("noticed", EVENING.noticed, 4)}
      {text("helped", EVENING.helped, 5)}

      {error && <p className="form-error">{error}</p>}
      <button className="btn btn-primary" onClick={() => save(false)} disabled={busy}>{busy ? "Saving…" : "Save reflection"}</button>
      <button className="btn btn-text skip-link" onClick={() => save(true)} disabled={busy}>Skip today</button>
    </div>
  );
}
