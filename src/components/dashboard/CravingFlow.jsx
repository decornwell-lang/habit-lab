// "I'm craving right now" (on demand, never a notification): where it is in the body,
// how strong (0 to 10), what's happening, then a way into the breathing practices.
// Each note is saved with its time to users/{uid}/reflections (type "craving").
// Wording: src/content/intention.js. One button: Save, then Share to WhatsApp. The shared
// text is "what is happening"; the score is the 0-10 strength, only if ticked.
import { useState } from "react";
import { saveCraving } from "../../lib/data.js";
import { CRAVING, MAX_TEXT } from "../../content/intention.js";
import QuestionStep from "./QuestionStep.jsx";
import SaveShareButton from "../SaveShareButton.jsx";
import ShareOptions from "../ShareOptions.jsx";
import { shareMessage } from "../../lib/shareMessage.js";

export default function CravingFlow({ uid, date, firstName, onBreathe, onSaved }) {
  const [areas, setAreas] = useState([]);
  const [other, setOther] = useState("");
  const [strength, setStrength] = useState(5);
  const [touched, setTouched] = useState(false); // the slider only counts once it's been moved
  const [happening, setHappening] = useState("");
  const [savedId, setSavedId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [share, setShare] = useState({ includeText: true, includeScore: false });

  const toggle = (area) => {
    setAreas((a) => (a.includes(area) ? a.filter((x) => x !== area) : [...a, area]));
    setSavedId(null);
  };
  const hasAnything = areas.length > 0 || touched || happening.trim();

  async function save() {
    if (savedId || !hasAnything) return savedId;
    setBusy(true);
    setError("");
    try {
      const now = new Date();
      const id = await saveCraving(uid, {
        date,
        time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
        areas,
        other: areas.includes("Other") ? other.trim() : "",
        strength: touched ? strength : null,
        happening: happening.trim(),
      });
      setSavedId(id);
      onSaved?.();
      return id;
    } catch (err) {
      console.error(err);
      setError("Couldn't save. Please try again.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  // Breathe straight away; the note is saved first if anything was filled in.
  async function breathe(practice) {
    if (hasAnything && !savedId) await save();
    onBreathe(practice);
  }

  return (
    <div className="craving">
      <h2>{CRAVING.tile}</h2>
      <p className="muted small">Every question is optional.</p>

      <QuestionStep n={1} title={CRAVING.where}>
        <div className="choices">
          {CRAVING.areas.map((area) => (
            <button type="button" key={area} className={areas.includes(area) ? "selected" : ""} aria-pressed={areas.includes(area)}
              onClick={() => toggle(area)}>
              {area}
            </button>
          ))}
        </div>
        {areas.includes("Other") && (
          <input className="q-input craving-other" value={other} maxLength={60} placeholder="Where?" aria-label="Where else?"
            onChange={(e) => { setOther(e.target.value); setSavedId(null); }} />
        )}
      </QuestionStep>

      <QuestionStep n={2} title={CRAVING.strength}>
        <div className="strength">
          <input type="range" min="0" max="10" step="1" value={strength} aria-label={CRAVING.strength}
            onChange={(e) => { setStrength(Number(e.target.value)); setTouched(true); setSavedId(null); }} />
          <span className={`strength-value ${touched ? "" : "untouched"}`}>{touched ? strength : "–"}</span>
        </div>
        <div className="scale-labels"><span>0</span><span>10</span></div>
      </QuestionStep>

      <QuestionStep n={3} title={CRAVING.happening} hint="Optional">
        <textarea className="q-textarea" rows={2} maxLength={MAX_TEXT} value={happening} aria-label={CRAVING.happening}
          onChange={(e) => { setHappening(e.target.value); setSavedId(null); }} />
        <p className="char-count">{happening.length} / {MAX_TEXT}</p>
      </QuestionStep>

      {error && <p className="form-error">{error}</p>}
      <button className="btn btn-primary" onClick={() => breathe("space")} disabled={busy}>Breathe with me</button>
      <button className="btn btn-text craving-coherent" onClick={() => breathe("coherent")} disabled={busy}>or try coherent breathing</button>
      {savedId && <ShareOptions {...share} onChange={(c) => setShare((s) => ({ ...s, ...c }))} />}
      <SaveShareButton saved={Boolean(savedId)} canSave={Boolean(hasAnything)} busy={busy} onSave={save}
        shareText={shareMessage({ firstName, label: "craving note", text: happening, score: touched ? `strength ${strength}/10` : "", ...share })} />

      <p className="craving-emergency">{CRAVING.emergency}</p>
    </div>
  );
}
