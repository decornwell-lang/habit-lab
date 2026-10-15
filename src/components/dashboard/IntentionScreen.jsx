// Morning intention (opens at 07:15): one screen, no scrolling.
// The proverb with the spear, the core question, this week's question, a one-minute
// invitation and an optional note. Saved to users/{uid}/reflections/{date}_intention.
// Wording: src/content/intention.js. One button: Save, then Share to WhatsApp
// (only the note, and only if "Include my text" is ticked).
import { useState } from "react";
import { saveReflection } from "../../lib/data.js";
import { PROVERB, CORE_QUESTION, INVITATION, NOTE_PROMPT, MAX_TEXT, weeklyQuestion } from "../../content/intention.js";
import Spear from "../illustrations/Spear.jsx";
import SaveShareButton from "../SaveShareButton.jsx";
import ShareOptions from "../ShareOptions.jsx";
import { shareMessage } from "../../lib/shareMessage.js";

export default function IntentionScreen({ uid, date, existing, firstName, onSaved }) {
  const [text, setTextRaw] = useState(existing?.text || "");
  const [saved, setSaved] = useState(Boolean(existing));
  const [share, setShare] = useState({ includeText: true, includeScore: false });
  const setText = (value) => { setTextRaw(value); setSaved(false); };
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
      setSaved(true);
    } catch (err) {
      console.error(err);
      setError("Couldn't save. Please try again.");
    } finally {
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
      {saved && <ShareOptions {...share} hasScore={false} onChange={(c) => setShare((s) => ({ ...s, ...c }))} />}
      <SaveShareButton saved={saved} busy={busy} onSave={done}
        shareText={shareMessage({ firstName, label: "morning intention", text, ...share })} />
    </div>
  );
}
