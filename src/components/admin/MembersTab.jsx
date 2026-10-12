// Admin → Members: table of all users, add someone to a cohort, CSV export.
import { useState } from "react";
import { joinCohortDirectly, getAllCheckins } from "../../lib/data.js";
import { downloadCsv } from "../../lib/csv.js";
import { effectiveStreak, badgeInfo, sortBadges } from "../../lib/streaks.js";
import { todayKey, toKey } from "../../lib/dates.js";

// Joins the data for one table row.
function buildRows({ users, profiles, memberships, cohorts }) {
  const today = todayKey();
  return users
    .map((u) => {
      const p = profiles.find((x) => x.id === u.id) || {};
      const ms = memberships.filter((m) => m.uid === u.id);
      return {
        uid: u.id,
        name: `${u.firstName || ""} ${u.surname || ""}`.trim(),
        email: u.email,
        role: u.role,
        signedUp: u.createdAt?.toDate ? toKey(u.createdAt.toDate()) : "",
        cohorts: ms.map((m) => cohorts.find((c) => c.id === m.cohortId)?.name || m.cohortId).join("; "),
        payment: ms.map((m) => (m.paid ? `Paid${m.amount ? ` ${m.amount}` : ""}` : m.method === "admin" ? "Added by admin" : "Free")).join("; "),
        streak: effectiveStreak(p, today),
        badges: sortBadges(p.badges).map((b) => badgeInfo(b).label).join(", "),
        badgeIcons: sortBadges(p.badges).map((b) => badgeInfo(b).icon).join(""),
        cohortIds: ms.map((m) => m.cohortId),
      };
    })
    .sort((a, b) => b.signedUp.localeCompare(a.signedUp));
}

export default function MembersTab({ data, reload, onViewCheckins }) {
  const rows = buildRows(data);
  const [addFor, setAddFor] = useState(null);
  const [cohortId, setCohortId] = useState("");
  const [message, setMessage] = useState("");

  async function addToCohort(uid) {
    if (!cohortId) return;
    try {
      await joinCohortDirectly(uid, cohortId, "admin");
      setMessage("Member added to the cohort.");
      setAddFor(null);
      await reload();
    } catch (err) {
      console.error(err);
      setMessage("Couldn't add the member. They may already be in that cohort.");
    }
  }

  function exportMembers() {
    downloadCsv(`habit-lab-members-${todayKey()}.csv`, rows, [
      { label: "Name", value: (r) => r.name },
      { label: "Email", value: (r) => r.email },
      { label: "Signed up", value: (r) => r.signedUp },
      { label: "Cohorts", value: (r) => r.cohorts },
      { label: "Payment", value: (r) => r.payment },
      { label: "Current streak", value: (r) => r.streak },
      { label: "Badges", value: (r) => r.badges },
    ]);
  }

  async function exportCheckins() {
    const all = await getAllCheckins();
    const names = Object.fromEntries(rows.map((r) => [r.uid, r]));
    all.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    downloadCsv(`habit-lab-checkins-${todayKey()}.csv`, all, [
      { label: "Date", value: (c) => c.date },
      { label: "Name", value: (c) => names[c.uid]?.name },
      { label: "Email", value: (c) => names[c.uid]?.email },
      { label: "Cohort", value: (c) => data.cohorts.find((x) => x.id === c.cohortId)?.name },
      { label: "Day", value: (c) => c.day },
      { label: "Week", value: (c) => c.week },
      { label: "Maintained", value: (c) => (c.maintained ? "Yes" : "No") },
      { label: "Craving", value: (c) => c.craving },
      { label: "Question", value: (c) => c.question },
      { label: "Answer", value: (c) => c.answer },
    ]);
  }

  return (
    <section>
      <div className="toolbar">
        <p className="muted">{rows.length} {rows.length === 1 ? "member" : "members"}</p>
        <button className="btn btn-ghost btn-small" onClick={exportMembers}>Export members (CSV)</button>
        <button className="btn btn-ghost btn-small" onClick={exportCheckins}>Export check-ins (CSV)</button>
      </div>
      {message && <p className="form-success">{message}</p>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Signed up</th><th>Cohort</th><th>Payment</th><th>Streak</th><th>Badges</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.uid}>
                <td>{r.name}{r.role === "admin" && <span className="tag">admin</span>}</td>
                <td>{r.email}</td>
                <td>{r.signedUp}</td>
                <td>{r.cohorts || "—"}</td>
                <td>{r.payment || "—"}</td>
                <td>{r.streak}</td>
                <td title={r.badges}>{r.badgeIcons || "—"}</td>
                <td className="actions">
                  <button className="link-btn" onClick={() => onViewCheckins(r.uid)}>Check-ins</button>
                  {addFor === r.uid ? (
                    <span className="inline-form">
                      <select value={cohortId} onChange={(e) => setCohortId(e.target.value)}>
                        <option value="">Choose cohort…</option>
                        {data.cohorts.filter((c) => !r.cohortIds.includes(c.id)).map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <button className="link-btn" onClick={() => addToCohort(r.uid)}>Add</button>
                    </span>
                  ) : (
                    <button className="link-btn" onClick={() => { setAddFor(r.uid); setCohortId(""); }}>Add to cohort</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
