// A quick answer to a daily prompt: a few tap-to-choose questions and/or a
// short text, then one button that saves it and opens WhatsApp with the answer
// ready to share in the cohort group.
import { useState } from "react";
import WhatsAppIcon from "../WhatsAppIcon.jsx";

// Opens WhatsApp with the message ready; the member picks the cohort group.
export const whatsAppShareLink = (text) => `https://wa.me/?text=${encodeURIComponent(text)}`;

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

  return (
    <div className="quick-answer">
      {questions.map((q) => (
        <fieldset className="question" key={q.key}>
          {q.label && <legend>{q.label}</legend>}
          <div className="choices">
            {q.choices.map((c) => (
              <button type="button" key={c} className={answer[q.key] === c ? "selected" : ""} aria-pressed={answer[q.key] === c} onClick={() => set(q.key, c)}>
                {c}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
      <div className="field">
        {text && <label htmlFor={`note-${text}`}>{text}</label>}
        <textarea id={`note-${text}`} rows={2} value={answer.note || ""} onChange={(e) => set("note", e.target.value)}
          placeholder={questions.length ? "Anything to add? (optional)" : "A few words is enough"} />
      </div>
      {complete ? (
        // A real link, so WhatsApp opens straight from the tap; the answer saves at the same time.
        <a className="btn btn-whatsapp" href={whatsAppShareLink(shareText(answer))} target="_blank" rel="noreferrer" onClick={save}>
          <WhatsAppIcon /> Share in the group
        </a>
      ) : (
        <button className="btn btn-whatsapp" disabled><WhatsAppIcon /> Share in the group</button>
      )}
      {complete && !saved && <button type="button" className="btn btn-text" onClick={save}>Just save</button>}
      {saved && <p className="muted small center">✓ Saved</p>}
    </div>
  );
}
