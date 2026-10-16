// My account → My cohorts: the cohorts the member is in, each with "Remove", which takes
// them out and deletes everything connected to it (api/leave-cohort.js). Asks first.
import { useEffect, useState } from "react";
import { getCohorts, getMemberships } from "../lib/data.js";
import { apiPost } from "../lib/api.js";
import { memberCohorts, habitInfo } from "../lib/cohorts.js";
import { formatDate, todayKey } from "../lib/dates.js";

export default function MyCohorts({ uid }) {
  const [rows, setRows] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const [cohorts, memberships] = await Promise.all([getCohorts(), getMemberships(uid)]);
    setRows(memberCohorts(cohorts, memberships, todayKey()));
  }
  useEffect(() => {
    load().catch(() => setRows([]));
  }, [uid]); // eslint-disable-line react-hooks/exhaustive-deps

  async function remove(row) {
    setBusy(true);
    setMessage("");
    try {
      await apiPost("/api/leave-cohort", { cohortId: row.cohort.id });
      setConfirming(null);
      setMessage(`${row.cohort.name} has been removed.`);
      await load();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  const status = ({ progress, cohort }) =>
    progress.state === "active" ? `Day ${progress.day} of ${cohort.durationDays}`
      : progress.state === "upcoming" ? `Starts ${formatDate(progress.start)}`
      : "Finished";

  return (
    <section className="card">
      <h2>My cohorts</h2>
      {!rows ? (
        <p className="muted small">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="muted small">You're not in a cohort.</p>
      ) : (
        <ul className="my-cohorts">
          {rows.map((row) => (
            <li key={row.cohort.id}>
              <div className="my-cohort-row">
                <span>
                  <strong>{row.cohort.name}</strong>
                  <span className="muted small"> · {habitInfo(row.cohort.habitType).tab} · {status(row)}{row.membership.paid ? " · Paid" : ""}</span>
                </span>
                <button type="button" className="link-btn" onClick={() => setConfirming(confirming === row.cohort.id ? null : row.cohort.id)}>
                  {confirming === row.cohort.id ? "Cancel" : "Remove"}
                </button>
              </div>
              {confirming === row.cohort.id && (
                <div className="danger-confirm">
                  <p className="small">
                    This deletes everything connected to this cohort: your check-ins, morning answers, intentions,
                    evening reviews, streak and badges. It can't be undone.
                    {row.membership.paid && " Your payment isn't refunded automatically; message David if you'd like a refund."}
                  </p>
                  <button type="button" className="btn btn-danger" disabled={busy} onClick={() => remove(row)}>
                    {busy ? "Removing…" : "Remove this cohort and its data"}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {message && <p className="small" role="status">{message}</p>}
    </section>
  );
}
