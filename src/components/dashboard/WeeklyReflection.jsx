// 3. This Week's Reflection: a download link to the week's PDF. No submission.
export default function WeeklyReflection({ content }) {
  return (
    <section className="card">
      <p className="card-label">This Week's Reflection</p>
      <h2>{content.title}</h2>
      <p className="muted small">{content.focus}</p>
      <a className="btn btn-primary" href={content.reflectionUrl} target="_blank" rel="noreferrer">
        Download this week's reflection (PDF)
      </a>
      <p className="small muted center">
        Work through this on your own, and bring what came up to Monday's live session.
      </p>
    </section>
  );
}
