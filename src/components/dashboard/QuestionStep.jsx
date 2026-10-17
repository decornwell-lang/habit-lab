// One question in a check-in form: its own panel with a number, the question,
// an optional hint, then the answer controls (children). `missing`: outlined in red with
// "Please answer this one" (Save was tapped before it was answered).
export default function QuestionStep({ n, title, hint, missing = false, children }) {
  return (
    <div className={`q-step${missing ? " missing" : ""}`} role="group" aria-label={title}>
      <div className="q-head">
        {n && <span className="q-num">{n}</span>}
        <span className="q-title">{title}</span>
      </div>
      {hint && <p className="q-hint">{hint}</p>}
      {children}
      {missing && <p className="q-missing" role="alert">Please answer this one</p>}
    </div>
  );
}
