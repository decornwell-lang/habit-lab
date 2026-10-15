// One question in a check-in form: its own panel with a number, the question,
// an optional hint, then the answer controls (children).
export default function QuestionStep({ n, title, hint, children }) {
  return (
    <div className="q-step" role="group" aria-label={title}>
      <div className="q-head">
        {n && <span className="q-num">{n}</span>}
        <span className="q-title">{title}</span>
      </div>
      {hint && <p className="q-hint">{hint}</p>}
      {children}
    </div>
  );
}
