// The countdown at the top of Home for a cohort that hasn't started yet:
// "31 days until your cohort begins · Monday, 16 November", and underneath, in the same
// box, what to do before it begins: the "My story and my diary" worksheet for the
// cohort's habit (smoking, alcohol, gambling, fitness, or a general one). It opens in the
// app (PdfButton) with Download. The worksheets are made by scripts/make-worksheets.mjs.
import { formatDate } from "../../lib/dates.js";
import PdfButton from "../PdfButton.jsx";

const WORKSHEET_HABITS = ["smoking", "alcohol", "gambling", "exercise"];
const worksheetUrl = (habitType) =>
  `/assets/before-you-begin-${WORKSHEET_HABITS.includes(habitType) ? habitType : "default"}.pdf`;

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
        <h2>My story and my diary</h2>
        <p className="muted small">Your story, and a daily diary to keep from now and through the programme.</p>
        <PdfButton url={worksheetUrl(cohort.habitType)} label="Open the worksheet" fileName={`before-you-begin-${cohort.habitType}.pdf`} />
        <p className="small muted center">Print it, or keep it in a notebook. Private: nothing needs to be shared.</p>
      </div>
    </section>
  );
}
