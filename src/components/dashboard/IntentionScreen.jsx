// Morning intention (opens at 07:15): one screen, no scrolling.
// The proverb with the spear, the core question, this week's question, a one-minute
// invitation and an optional note. Saved to users/{uid}/reflections/{date}_intention.
// Wording: src/content/intention.js. Sharing comes in a later step.
import { useState } from "react";
import { saveReflection } from "../../lib/data.js";
import { PROVERB, CORE_QUESTION, INVITATION, NOTE_PROMPT, MAX_TEXT, weeklyQuestion } from "../../content/intention.js";
import Spear from "../illustrations/Spear.jsx";

export default function IntentionScreen({ uid, date, existing, onSaved }) {
  const [text, setText] = useState(existing?.text || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const question = existing?.question || weeklyQuestion();

  async function done() {
    setBusy(true);
    setError("");
    try {
      const entry = { type: "intention", date, question, text: text.trim() };
      await saveReflection(uid, `${date}_intention`, entry, { intention: true });
      onSaved(entry);
    } catch (err) {
      console.error(err);
      setError("Couldn't save. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="intention">
      <div className="intention-proverb">
        <Spear />
        <p>{PROVERB}</p>
      </div>
      <h2 className="intention-core">{CORE_QUESTION}</h2>
      <p className="intention-weekly">{question}</p>
      <p className="intention-invite">{INVITATION}</p>
      <textarea className="q-textarea" rows={2} maxLength={MAX_TEXT} value={text} onChange={(e) => setText(e.target.value)}
        placeholder={NOTE_PROMPT} aria-label={NOTE_PROMPT} />
      <p className="char-count">{text.length} / {MAX_TEXT}</p>
      {error && <p className="form-error">{error}</p>}
      <button className="btn btn-primary" onClick={done} disabled={busy}>{busy ? "Saving…" : "Done"}</button>
    </div>
  );
}
