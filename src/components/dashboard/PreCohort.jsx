// "Start here before your cohort begins": shown once a member has joined
// a cohort that hasn't started yet.
import { formatDate } from "../../lib/dates.js";

export default function PreCohort({ current }) {
  const { progress } = current;
  return (
    <section className="card card-accent">
      <p className="card-label">Before you begin</p>
      <h2>Your Story Before the Cohort</h2>
      <p className="muted">Starts {formatDate(progress.start, { weekday: undefined, year: undefined })}.</p>
      <a className="btn btn-primary" href="/assets/your-story-before-the-cohort.pdf" target="_blank" rel="noreferrer">
        Download (PDF)
      </a>
      <p className="small muted center">Private. Take your time.</p>
    </section>
  );
}
