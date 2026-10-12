// "Start here before your cohort begins": shown once a member has joined
// a cohort that hasn't started yet.
import { formatDate } from "../../lib/dates.js";

export default function PreCohort({ current }) {
  const { progress } = current;
  return (
    <section className="card card-accent">
      <p className="card-label">Start here before your cohort begins</p>
      <h2>Your Story Before the Cohort</h2>
      <p className="muted">
        Your cohort begins on <strong>{formatDate(progress.start)}</strong>
        {progress.daysUntil === 1 ? " (tomorrow)" : ` (in ${progress.daysUntil} days)`}. Before then, spend some time with
        these questions about your history with the habit.
      </p>
      <a className="btn btn-primary" href="/assets/your-story-before-the-cohort.pdf" target="_blank" rel="noreferrer">
        Download the PDF
      </a>
      <p className="small muted center">Take your time. Nothing needs to be shared.</p>
    </section>
  );
}
