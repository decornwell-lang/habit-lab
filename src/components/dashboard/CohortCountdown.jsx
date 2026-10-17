// The countdown at the top of Home for a cohort that hasn't started yet:
// "31 days until your cohort begins · Monday, 16 November", and underneath, in the same
// box, what to do before it begins: the "My diary and my life story" worksheet for the
// cohort's habit (WorksheetButton.jsx; wording in src/content/worksheets.js).
import { formatDate } from "../../lib/dates.js";
import WorksheetButton from "../WorksheetButton.jsx";

export default function CohortCountdown({ current }) {
  const { progress, cohort } = current;
  const days = progress.daysUntil;
  return (
    <section className="card streak-card countdown-card" aria-label={`${cohort.name} begins in ${days} ${days === 1 ? "day" : "days"}`}>
      <p className="card-label">Countdown</p>
      <div className="countdown-body">
        <strong className="countdown-number">{days}</strong>
        <div>
          <p className="countdown-text">{days === 1 ? "day until your cohort begins" : "days until your cohort begins"}</p>
          <p className="muted small">{cohort.name} · starts {formatDate(progress.start, { year: undefined })}</p>
        </div>
      </div>

      <div className="countdown-todo">
        <p className="card-label">Before you begin</p>
        <h2>My diary and my life story</h2>
        <p className="muted small">A journal to keep from now and through the programme, and prompts for your story.</p>
        <WorksheetButton habitType={cohort.habitType} />
        <p className="small muted center">Private: nothing needs to be shared.</p>
      </div>
    </section>
  );
}
