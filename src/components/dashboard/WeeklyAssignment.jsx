// Weekly assignment (Practices tab): a download link to the week's PDF. No submission.
export default function WeeklyAssignment({ content }) {
  return (
    <section className="card">
      <p className="card-label">Weekly assignment</p>
      <h2>{content.title}</h2>
      <a className="btn btn-primary" href={content.reflectionUrl} target="_blank" rel="noreferrer">
        Download (PDF)
      </a>
      <p className="small muted center">Bring it to Monday's session.</p>
    </section>
  );
}
