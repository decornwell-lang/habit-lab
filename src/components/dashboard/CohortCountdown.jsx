// The countdown at the top of Home for a cohort that hasn't started yet:
// "31 days until your cohort begins · Monday, 16 November".
import { formatDate } from "../../lib/dates.js";

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
    </section>
  );
}
