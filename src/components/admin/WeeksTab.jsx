// Admin → Weeks: each cohort's four weeks. For each week: the assignment (title and PDF link),
// the Zoom link and start time, and, after the session, the recording link and a short
// description. Members see a week from Monday 00:00 of that week in their own time zone;
// empty fields fall back to Admin → Content (Zoom link, weekly assignment).
import { useEffect, useState } from "react";
import { getWeeklyResources, saveWeeklyResource } from "../../lib/data.js";
import { cohortWeeks, weekStart } from "../../lib/mindful.js";
import { formatDate } from "../../lib/dates.js";

const FIELDS = [
  ["assignmentTitle", "Assignment title", "e.g. Urges"],
  ["assignmentPdfUrl", "Assignment PDF link", "https://… (a PDF)"],
  ["zoomLink", "Zoom link", "https://zoom.us/j/…"],
  ["zoomStartsAt", "Session date and time (your time)", ""],
  ["recordingUrl", "Recording (YouTube), after the session", "https://youtu.be/…"],
  ["recordingDescription", "Short description", "What the session covered"],
];
// datetime-local works in the browser's time; stored as an exact moment (ISO).
const toLocalInput = (iso) => (iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

export default function WeeksTab({ cohorts }) {
  const open = cohorts.filter((c) => !c.archived).sort((a, b) => a.startDate.localeCompare(b.startDate));
  const [cohortId, setCohortId] = useState(open[0]?.id || "");
  const [weeks, setWeeks] = useState(null);
  const [message, setMessage] = useState("");
  const cohort = open.find((c) => c.id === cohortId);
  const count = cohortWeeks(Number(cohort?.durationDays) || 28);

  useEffect(() => {
    if (!cohortId) return;
    setWeeks(null);
    getWeeklyResources([cohortId]).catch(() => []).then((list) =>
      setWeeks(Object.fromEntries(Array.from({ length: count }, (_, i) => {
        const r = list.find((x) => x.weekNumber === i + 1) || {};
        return [i + 1, { ...Object.fromEntries(FIELDS.map(([k]) => [k, ""])), ...r, zoomStartsAt: toLocalInput(r.zoomStartsAt) }];
      })))
    );
  }, [cohortId, count]);

  async function save(n) {
    const w = weeks[n];
    const data = Object.fromEntries(FIELDS.map(([k]) => [k, (w[k] || "").trim() || null]));
    data.zoomStartsAt = w.zoomStartsAt ? new Date(w.zoomStartsAt).toISOString() : null;
    await saveWeeklyResource(cohortId, n, data);
    setMessage(`Week ${n} saved.`);
  }

  if (!open.length) return <section className="card"><p className="muted">No cohorts yet.</p></section>;
  return (
    <section className="card">
      <h2>Cohort weeks</h2>
      <div className="field">
        <label>Cohort</label>
        <select value={cohortId} onChange={(e) => setCohortId(e.target.value)}>
          {open.map((c) => <option key={c.id} value={c.id}>{c.name} ({formatDate(c.startDate, { weekday: undefined })})</option>)}
        </select>
      </div>
      {message && <p className="form-success">{message}</p>}
      {!weeks ? <p className="muted">Loading…</p> : Object.entries(weeks).map(([n, w]) => (
        <details key={n} className="week-admin">
          <summary>Week {n} · from {formatDate(weekStart(cohort.startDate, Number(n)), { year: undefined })}{w.assignmentPdfUrl ? " · assignment ✓" : ""}{w.recordingUrl ? " · recording ✓" : ""}</summary>
          {FIELDS.map(([k, label, hint]) => (
            <div className="field" key={k}>
              <label>{label}</label>
              <input type={k === "zoomStartsAt" ? "datetime-local" : "text"} value={w[k] || ""} placeholder={hint}
                onChange={(e) => setWeeks({ ...weeks, [n]: { ...w, [k]: e.target.value } })} />
            </div>
          ))}
          <button type="button" className="btn btn-primary" onClick={() => save(n)}>Save week {n}</button>
        </details>
      ))}
    </section>
  );
}
