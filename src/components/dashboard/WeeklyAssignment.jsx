// Weekly assignment (Practices tab): one of 52 assignments, one per week of the year
// (week 1 starts in early January), starting again each year. Set in Admin → Content →
// Weekly assignments (settings.assignments). Until this week's is set, the cohort week's
// reflection PDF is shown. Download only; nothing to submit.
import { weekOfYear } from "../../lib/dates.js";

export default function WeeklyAssignment({ content, settings = {} }) {
  const set = settings.assignments?.[weekOfYear()];
  // Without this week's assignment: the title set for the cohort week, without "Week 1:".
  const title = set?.title || content.title.replace(/^week\s*\d+\s*:\s*/i, "");
  const pdf = set?.pdfUrl || content.reflectionUrl;
  return (
    <section className="card">
      <p className="card-label">Weekly assignment</p>
      <h2>{title}</h2>
      <a className="btn btn-primary" href={pdf} target="_blank" rel="noreferrer">Download (PDF)</a>
      <p className="small muted center">Bring it to Monday's session.</p>
    </section>
  );
}
