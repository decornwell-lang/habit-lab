// The morning check-in's answer form: a few tap-to-choose questions and/or a
// short text, then one button: "Save", which then becomes "Share to WhatsApp"
// (the share sheet opens with the answer ready for the cohort's group).
import { useRef, useState } from "react";
import SaveShareButton from "../SaveShareButton.jsx";
import DictationTextarea from "../DictationTextarea.jsx";
import QuestionStep from "./QuestionStep.jsx";
import SavedAnswers from "./SavedAnswers.jsx";

// questions: [{ key, label, choices }]   text: label for the free text (optional)
// shareText(answer) builds the WhatsApp message. onSave(answer) stores it (returns a promise).
// summary(answer) lists the answers ([{ label, value }]) shown on the page once saved.
export default function QuickAnswer({ questions = [], text, existing, shareText, onSave, summary, group }) {
  const [answer, setAnswer] = useState(existing || {});
  const [saved, setSaved] = useState(Boolean(existing));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tried, setTried] = useState(false); // Save tapped with questions unanswered: show them in red
  const box = useRef(null);
  const set = (key, value) => setAnswer((a) => ({ ...a, [key]: value }));
  const complete = questions.every((q) => answer[q.key]) && (questions.length > 0 || answer.note?.trim());

  async function save() {
    if (!complete) {
      setTried(true);
      setTimeout(() => box.current?.querySelector(".q-step.missing")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSave(answer);
      setSaved(true);
      // The form folds up into the shorter saved view, so bring its tile back into view.
      requestAnimationFrame(() => (box.current?.closest(".fold") || box.current)?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (err) {
      console.error(err);
      setError("Couldn't save. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // Numbered questions, then the note; a single text question (the reflection) isn't numbered.
  const numbered = questions.length > 0;
  if (saved && summary) {
    return (
      <div className="quick-answer" ref={box}>
        <SavedAnswers items={summary(answer)} onEdit={() => setSaved(false)} />
        <SaveShareButton saved shareText={shareText(answer)} group={group} />
      </div>
    );
  }

  return (
    <div className="quick-answer" ref={box}>
      {questions.map((q, i) => (
        <QuestionStep key={q.key} n={i + 1} title={q.label} missing={tried && !answer[q.key]}>
          <div className="choices">
            {q.choices.map((c) => (
              <button type="button" key={c} className={answer[q.key] === c ? "selected" : ""} aria-pressed={answer[q.key] === c} onClick={() => set(q.key, c)}>
                {c}
              </button>
            ))}
          </div>
        </QuestionStep>
      ))}
      <QuestionStep n={numbered ? questions.length + 1 : null} title={text || "Anything to add?"} hint={numbered ? "Optional" : null}
        missing={tried && !numbered && !answer.note?.trim()}>
        <DictationTextarea rows={3} aria-label={text || "Anything to add?"} value={answer.note || ""}
          onChange={(v) => set("note", v)} placeholder={numbered ? "A few words…" : "A few words is enough"} />
      </QuestionStep>
      {error && <p className="form-error" role="alert">{error}</p>}
      <SaveShareButton saved={saved} busy={busy} onSave={save} shareText={complete ? shareText(answer) : ""} group={group} />
      {saved && <p className="muted small center">✓ Saved</p>}
    </div>
  );
}
