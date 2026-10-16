// Admin → Check-ins: read-only. Shows recent days when a member's practice wasn't kept
// (e.g. they smoked), recent "Not right now" answers, and every check-in (one per cohort
// per evening review) for a selected member.
import { useEffect, useState } from "react";
import { getAllCheckins, getUserPracticeChecks } from "../../lib/data.js";
import { badgeInfo } from "../../lib/streaks.js";
import { toKey } from "../../lib/dates.js";
import { habitStreakLabel } from "../../lib/cohorts.js";

export default function CheckinsTab({ data, selectedUid, setSelectedUid }) {
  const [all, setAll] = useState(null);
  const [practiceChecks, setPracticeChecks] = useState([]);
  const nameOf = (uid) => {
    const u = data.users.find((x) => x.id === uid);
    return u ? `${u.firstName || ""} ${u.surname || ""}`.trim() : uid;
  };
  const cohortOf = (id) => data.cohorts.find((c) => c.id === id);
  const cohortName = (id) => cohortOf(id)?.name || "";

  useEffect(() => {
    getAllCheckins().then(setAll).catch(() => setAll([]));
  }, []);

  useEffect(() => {
    if (selectedUid) getUserPracticeChecks(selectedUid).then(setPracticeChecks).catch(() => setPracticeChecks([]));
  }, [selectedUid]);

  if (!all) return <p className="muted">Loading…</p>;

  const recentNo = all.filter((c) => c.maintained === false).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15);
  const mine = all.filter((c) => c.uid === selectedUid).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <section>
      <div className="card">
        <h2>Recent hard days</h2>
        {recentNo.length === 0 ? (
          <p className="muted">None yet.</p>
        ) : (
          <ul className="plain-list">
            {recentNo.map((c) => (
              <li key={`${c.uid}-${c.date}-${c.cohortId}`}>
                <button className="link-btn" onClick={() => setSelectedUid(c.uid)}>{nameOf(c.uid)}</button> · {cohortName(c.cohortId)} · {c.date} · day {c.day}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="field">
        <label>Show all check-ins for</label>
        <select value={selectedUid} onChange={(e) => setSelectedUid(e.target.value)}>
          <option value="">Choose a member…</option>
          {data.users.map((u) => <option key={u.id} value={u.id}>{nameOf(u.id)}</option>)}
        </select>
      </div>

      {selectedUid && (
        <>
          {practiceChecks.length > 0 && (
            <div className="card">
              <h2>“Still in your practice?” answers</h2>
              <ul className="plain-list">
                {practiceChecks
                  .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
                  .map((p) => (
                    <li key={p.id} className={p.answer === "notRightNow" ? "flag" : ""}>
                      {p.createdAt?.toDate ? toKey(p.createdAt.toDate()) : ""} · {badgeInfo(p.badge).label} badge ·{" "}
                      <strong>{p.answer === "yes" ? "Yes" : "Not right now"}</strong>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Cohort</th><th>Day</th><th>Kept?</th><th>Cravings (0–5)</th></tr></thead>
              <tbody>
                {mine.length === 0 && <tr><td colSpan={5} className="muted">No check-ins yet.</td></tr>}
                {mine.map((c) => (
                  <tr key={`${c.date}-${c.cohortId}`} className={c.maintained ? "" : "flag"}>
                    <td>{c.date}</td>
                    <td>{cohortName(c.cohortId)}</td>
                    <td>{c.day}</td>
                    <td>{c.maintained ? `Yes (${habitStreakLabel(cohortOf(c.cohortId)?.habitType)})` : "No"}</td>
                    <td>{c.craving}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
