// /archive: every week of the member's cohorts, newest first. Each week: its number and dates,
// the assignment, the session recording (once added) and a short description. Weeks that
// haven't unlocked yet are shown greyed out, without links. Only for members whose cohort
// access is current (the owner always).
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { getCohorts, getMemberships, getWeeklyResources } from "../lib/data.js";
import { cohortAccess } from "../lib/access.js";
import { memberCohorts } from "../lib/cohorts.js";
import { addDays, formatDate, todayKey } from "../lib/dates.js";
import { cohortWeeks, weekStart, weekUnlocksAt } from "../lib/mindful.js";
import PdfButton from "../components/PdfButton.jsx";
import pricing from "../../config/pricing.json";

export default function Archive() {
  const { user, profile, isAdmin } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.all([getCohorts(), getMemberships(user.uid)]).then(async ([cohorts, memberships]) => {
      const resources = await getWeeklyResources(memberships.map((m) => m.cohortId)).catch(() => []);
      setData({ cohorts, memberships, resources });
    });
  }, [user.uid]);

  if (!data) return <main className="page"><p className="muted">Loading…</p></main>;
  const access = cohortAccess(data.memberships, data.cohorts, pricing);
  if (access.state !== "active" && !isAdmin) {
    return (
      <main className="page">
        <h1>Weekly archive</h1>
        <p className="muted">The weekly assignments and recordings are for members of a current cohort.</p>
        <Link to="/dashboard?tab=upcoming" className="btn btn-primary">See the cohorts</Link>
      </main>
    );
  }

  const now = new Date();
  const timeZone = profile?.timeZone || "Europe/Madrid";
  const rows = memberCohorts(data.cohorts, data.memberships, todayKey()).filter((r) => r.progress.state !== "upcoming" || isAdmin);
  return (
    <main className="page archive">
      <p className="eyebrow">Practices</p>
      <h1>Weekly archive</h1>
      <p className="intro">Every week's assignment and session recording, newest first.</p>
      {rows.map(({ cohort, progress }) => {
        const weeks = Array.from({ length: cohortWeeks(Number(cohort.durationDays) || 28) }, (_, i) => i + 1).reverse();
        return (
          <section key={cohort.id} className="info-section">
            <h2>{cohort.name}</h2>
            <ol className="archive-weeks">
              {weeks.map((n) => {
                const r = data.resources.find((x) => x.cohortId === cohort.id && x.weekNumber === n) || {};
                const start = weekStart(progress.start, n);
                const locked = now < weekUnlocksAt(progress.start, n, timeZone);
                return (
                  <li key={n} className={`card archive-week${locked ? " locked" : ""}`}>
                    <p className="card-label">Week {n} · {formatDate(start, { weekday: undefined, year: undefined })} to {formatDate(addDays(start, 6), { weekday: undefined, year: undefined })}</p>
                    {r.recordingDescription && <p className="muted small">{r.recordingDescription}</p>}
                    {locked ? (
                      <p className="muted small">Unlocks Monday at 00:00 your time.</p>
                    ) : (
                      <div className="archive-links">
                        {r.assignmentPdfUrl ? <PdfButton url={r.assignmentPdfUrl} label="Assignment" className="btn btn-ghost btn-small" /> : <span className="muted small">Assignment not added yet.</span>}
                        {r.recordingUrl ? <a className="btn btn-ghost btn-small" href={r.recordingUrl} target="_blank" rel="noreferrer">Recording</a> : <span className="muted small">No recording yet.</span>}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
      <p><Link to="/dashboard?tab=practices" className="text-link">← Back to Practices</Link></p>
    </main>
  );
}
