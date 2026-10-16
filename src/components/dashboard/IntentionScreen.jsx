// Morning intention (opens at 08:00): one screen, no scrolling. A short reminder to
// reconnect with the intention, the question, a one-minute invitation and an optional
// sentence or two. Once saved, the writing appears on the page (no longer in a box) and
// the button becomes "Share to WhatsApp". Saved to users/{uid}/reflections/{date}_intention.
// Wording: src/content/intention.js.
import { useState } from "react";
import { saveReflection } from "../../lib/data.js";
import { INTENTION, MAX_TEXT } from "../../content/intention.js";
import SaveShareButton from "../SaveShareButton.jsx";
import ShareOptions from "../ShareOptions.jsx";
import { shareMessage } from "../../lib/shareMessage.js";

export default function IntentionScreen({ uid, date, existing, firstName, onSaved }) {
  const [text, setText] = useState(existing?.text || "");
  const [saved, setSaved] = useState(Boolean(existing));
  const [share, setShare] = useState({ includeText: true, includeScore: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    setError("");
    try {
      const entry = { type: "intention", date, question: INTENTION.question, text: text.trim() };
      await saveReflection(uid, `${date}_intention`, entry, { intention: true });
      onSaved(entry);
      setText(entry.text);
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
      <p className="intention-intro">{INTENTION.intro}</p>
      <h2 className="intention-core">{INTENTION.question}</h2>
      <p className="intention-note">{INTENTION.note}</p>
      <p className="intention-invite">{INTENTION.invitation}</p>

      {saved ? (
        // Saved: the writing sits on the page, no longer in a box.
        <div className="intention-saved">
          {text ? <blockquote>{text}</blockquote> : <p className="muted">You sat with your intention today.</p>}
          <p className="intention-saved-meta">
            ✓ Saved · <button className="link-btn" onClick={() => setSaved(false)}>Edit</button>
          </p>
        </div>
      ) : (
        <>
          <textarea className="q-textarea" rows={3} maxLength={MAX_TEXT} value={text} onChange={(e) => setText(e.target.value)}
            placeholder={INTENTION.box} aria-label={INTENTION.box} />
          <p className="char-count">{text.length} / {MAX_TEXT}</p>
        </>
      )}

      {error && <p className="form-error">{error}</p>}
      {saved && text && <ShareOptions {...share} hasScore={false} onChange={(c) => setShare((s) => ({ ...s, ...c }))} />}
      <SaveShareButton saved={saved} busy={busy} onSave={save}
        shareText={shareMessage({ firstName, label: "morning intention", text, ...share })} />
    </div>
  );
}
