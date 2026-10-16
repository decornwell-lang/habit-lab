// "Before you begin": the worksheet for the cohort's habit (smoking, alcohol, gambling,
// fitness, or a general one), with two parts: their story, and a daily diary to keep
// until the cohort starts and through the programme. Opens in the app (PdfButton) with
// Download, to print or copy into a notebook. Made by scripts/make-worksheets.mjs.
import { formatDate } from "../../lib/dates.js";
import PdfButton from "../PdfButton.jsx";

const WORKSHEET_HABITS = ["smoking", "alcohol", "gambling", "exercise"];
export const worksheetUrl = (habitType) =>
  `/assets/before-you-begin-${WORKSHEET_HABITS.includes(habitType) ? habitType : "default"}.pdf`;

// Shown on Home for a cohort that hasn't started yet.
export default function PreCohort({ current }) {
  const { cohort, progress } = current;
  return (
    <section className="card card-accent">
      <p className="card-label">Before you begin</p>
      <h2>My story and my diary</h2>
      <p className="muted">
        Two parts to work on before {formatDate(progress.start, { weekday: undefined, year: undefined })}: your story, and a
        daily diary to keep as you go through the programme.
      </p>
      <PdfButton url={worksheetUrl(cohort.habitType)} label="Open the worksheet" fileName={`before-you-begin-${cohort.habitType}.pdf`} />
      <p className="small muted center">Print it, or keep it in a notebook. Private: nothing needs to be shared.</p>
    </section>
  );
}
