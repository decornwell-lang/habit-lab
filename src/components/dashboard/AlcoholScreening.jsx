// Screening before joining an alcohol-free cohort (wording: src/content/screening.js).
// onDone({ score, withdrawal, advised }) once every question is answered (and, if the
// advice is shown, once it's been read). Nothing is saved here; JoinCohort saves the result.
import { useState } from "react";
import { SCREENING } from "../../content/screening.js";

export default function AlcoholScreening({ onDone, busy }) {
  const [answers, setAnswers] = useState({});
  const [read, setRead] = useState(false);
  const questions = [...SCREENING.questions, SCREENING.withdrawal];
  const complete = questions.every((q) => answers[q.key] !== undefined);
  const score = SCREENING.questions.reduce((sum, q) => sum + (answers[q.key] ?? 0), 0);
  const withdrawal = answers.withdrawal === 1;
  const advised = complete && (withdrawal || score >= SCREENING.adviceScore);

  return (
    <div className="screening">
      <p className="small">{SCREENING.intro}</p>
      {questions.map((q) => (
        <fieldset key={q.key} className="screening-q">
          <legend>{q.label}</legend>
          {q.hint && <p className="muted small">{q.hint}</p>}
          <div className="choices">
            {q.choices.map((c, i) => (
              <button type="button" key={c} className={answers[q.key] === i ? "selected" : ""} aria-pressed={answers[q.key] === i}
                onClick={() => setAnswers((a) => ({ ...a, [q.key]: i }))}>
                {c}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
      {advised && (
        <div className="screening-advice" role="alert">
          <h3>{SCREENING.advice.title}</h3>
          <p>{SCREENING.advice.text}</p>
          <p className="small">{SCREENING.advice.emergency}</p>
          <label className="checkbox">
            <input type="checkbox" checked={read} onChange={(e) => setRead(e.target.checked)} /> {SCREENING.advice.agree}
          </label>
        </div>
      )}
      <button className="btn btn-primary" disabled={!complete || (advised && !read) || busy}
        onClick={() => onDone({ score, withdrawal, advised })}>
        Continue
      </button>
    </div>
  );
}
