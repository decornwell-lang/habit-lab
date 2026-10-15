// A quick answer to a daily prompt: a few tap-to-choose questions and/or a
// short text, then one button that saves it and opens the share sheet with the
// answer ready to send to the cohort's WhatsApp group.
import { useState } from "react";
import WhatsAppIcon from "../WhatsAppIcon.jsx";
import ShareButton from "../ShareButton.jsx";
import QuestionStep from "./QuestionStep.jsx";

// questions: [{ key, label, choices }]   text: label for the free text (optional)
// shareText(answer) builds the WhatsApp message. onSave(answer) stores it.
export default function QuickAnswer({ questions = [], text, existing, shareText, onSave }) {
  const [answer, setAnswer] = useState(existing || {});
  const [saved, setSaved] = useState(Boolean(existing));
  const set = (key, value) => {
    setAnswer((a) => ({ ...a, [key]: value }));
    setSaved(false);
  };
  const complete = questions.every((q) => answer[q.key]) && (questions.length > 0 || answer.note?.trim());

  function save() {
    onSave(answer);
    setSaved(true);
  }

  // Numbered questions, then the note; a single text question (the reflection) isn't numbered.
  const numbered = questions.length > 0;
  return (
    <div className="quick-answer">
      {questions.map((q, i) => (
        <QuestionStep key={q.key} n={i + 1} title={q.label}>
          <div className="choices">
            {q.choices.map((c) => (
              <button type="button" key={c} className={answer[q.key] === c ? "selected" : ""} aria-pressed={answer[q.key] === c} onClick={() => set(q.key, c)}>
                {c}
              </button>
            ))}
          </div>
        </QuestionStep>
      ))}
      <QuestionStep n={numbered ? questions.length + 1 : null} title={text || "Anything to add?"} hint={numbered ? "Optional" : null}>
        <textarea className="q-textarea" rows={3} aria-label={text || "Anything to add?"} value={answer.note || ""}
          onChange={(e) => set("note", e.target.value)} placeholder={numbered ? "A few words…" : "A few words is enough"} />
      </QuestionStep>
      {complete ? (
        <ShareButton text={shareText(answer)} onShare={save} />
      ) : (
        <button className="btn btn-whatsapp" disabled><WhatsAppIcon /> Share in the group</button>
      )}
      {complete && !saved && <button type="button" className="btn btn-text" onClick={save}>Just save</button>}
      {saved && <p className="muted small center">✓ Saved</p>}
    </div>
  );
}
