// Admin → Reflections: read-only. For one cohort: morning intentions, evening reviews and
// craving notes per day (counts only), a craving summary over time, and each member's
// words only if they ticked the consent box (the security rules enforce this too).
import { useEffect, useMemo, useState } from "react";
import { getAllActivity, getMemberReflections } from "../../lib/data.js";
import { addDays, todayKey, formatDate } from "../../lib/dates.js";

const DAYS = 14;

export default function ReflectionsTab({ data }) {
  const [cohortId, setCohortId] = useState(() => (data.cohorts.find((c) => c.status === "active") || data.cohorts[0])?.id || "");
  const [activity, setActivity] = useState(null);
  const [openUid, setOpenUid] = useState(null);
  const [entries, setEntries] = useState({}); // uid -> reflections, loaded on demand

  useEffect(() => {
    getAllActivity().then(setActivity).catch((err) => { console.error(err); setActivity([]); });
  }, []);

  const cohort = data.cohorts.find((c) => c.id === cohortId);
  const members = (cohort?.memberIds || []).map((uid) => data.users.find((u) => u.id === uid) || { id: uid });
  const memberIds = new Set(members.map((m) => m.id));
  const days = useMemo(() => Array.from({ length: DAYS }, (_, i) => addDays(todayKey(), -i)), []);

  if (!activity) return <p className="muted">Loading…</p>;
  const rows = activity.filter((a) => memberIds.has(a.uid));
  const perDay = days.map((date) => {
    const today = rows.filter((a) => a.date === date);
    return {
      date,
      intentions: today.filter((a) => a.intention).length,
      reviews: today.filter((a) => a.evening === "done").length,
      skipped: today.filter((a) => a.evening === "skipped").length,
      cravings: today.reduce((n, a) => n + (a.cravings || 0), 0),
    };
  });
  const maxCravings = Math.max(1, ...perDay.map((d) => d.cravings));
  const totals = (uid) => {
    const mine = rows.filter((a) => a.uid === uid);
    return {
      intentions: mine.filter((a) => a.intention).length,
      reviews: mine.filter((a) => a.evening === "done").length,
      cravings: mine.reduce((n, a) => n + (a.cravings || 0), 0),
    };
  };

  async function toggleMember(uid) {
    setOpenUid(openUid === uid ? null : uid);
    if (!entries[uid]) {
      const list = await getMemberReflections(uid).catch(() => []);
      setEntries((e) => ({ ...e, [uid]: list.sort((a, b) => (b.date || "").localeCompare(a.date || "")) }));
    }
  }

  return (
    <section>
      <p className="notice">Members have consented to sharing wellbeing reflections with the facilitator. Full text is shown only for members who ticked the consent box; for everyone else, counts only.</p>

      <div className="field">
        <label htmlFor="refl-cohort">Cohort</label>
        <select id="refl-cohort" value={cohortId} onChange={(e) => { setCohortId(e.target.value); setOpenUid(null); }}>
          {data.cohorts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="card">
        <h2>Craving notes per day</h2>
        <p className="muted small">Last {DAYS} days · {members.length} {members.length === 1 ? "member" : "members"}</p>
        <ol className="bar-list">
          {perDay.map((d) => (
            <li key={d.date} title={`${formatDate(d.date, { weekday: "short", year: undefined })}: ${d.cravings} craving ${d.cravings === 1 ? "note" : "notes"}`}>
              <span className="bar-label">{formatDate(d.date, { weekday: "short", month: "short", year: undefined })}</span>
              <span className="bar-track"><span className="bar" style={{ width: `${(d.cravings / maxCravings) * 100}%` }} /></span>
              <span className="bar-value">{d.cravings}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="card">
        <h2>Daily activity</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Day</th><th>Intentions</th><th>Evening reviews</th><th>Skipped</th><th>Craving notes</th></tr></thead>
            <tbody>
              {perDay.map((d) => (
                <tr key={d.date}>
                  <td>{formatDate(d.date, { weekday: "short", month: "short", year: undefined })}</td>
                  <td>{d.intentions} / {members.length}</td>
                  <td>{d.reviews} / {members.length}</td>
                  <td>{d.skipped}</td>
                  <td>{d.cravings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2>Members</h2>
        <ul className="refl-members">
          {members.map((m) => {
            const t = totals(m.id);
            const consented = m.reflectionConsent === true;
            return (
              <li key={m.id}>
                <div className="refl-member-row">
                  <span className="person-name">{`${m.firstName || ""} ${m.surname || ""}`.trim() || m.id}</span>
                  <span className="muted small">{t.intentions} intentions · {t.reviews} reviews · {t.cravings} cravings</span>
                  {consented ? (
                    <button className="link-btn" onClick={() => toggleMember(m.id)}>{openUid === m.id ? "Hide" : "Read"}</button>
                  ) : (
                    <span className="tag">Counts only</span>
                  )}
                </div>
                {openUid === m.id && <MemberEntries entries={entries[m.id]} />}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

// A consenting member's own words, newest first.
function MemberEntries({ entries }) {
  if (!entries) return <p className="muted small">Loading…</p>;
  if (!entries.length) return <p className="muted small">Nothing written yet.</p>;
  return (
    <ul className="refl-entries">
      {entries.slice(0, 30).map((e, i) => (
        <li key={i}>
          <p className="refl-entry-head">{e.date}{e.time ? ` · ${e.time}` : ""} · {LABELS[e.type] || e.type}</p>
          {e.type === "intention" && <p>{e.question}{e.text && <><br /><em>“{e.text}”</em></>}</p>}
          {e.type === "evening" && (e.skipped ? <p className="muted">Skipped</p> : (
            <p>
              {e.smoked === true ? "Smoked" : e.smoked === false ? "Didn't smoke" : ""}
              {e.cravings != null && ` · ${e.cravings} cravings`}
              {e.strongestAt && ` · strongest at ${e.strongestAt}`}
              {e.noticed && <><br />Noticed: <em>“{e.noticed}”</em></>}
              {e.helped && <><br />Helped: <em>“{e.helped}”</em></>}
              {e.tomorrow && <><br />Tomorrow: <em>“{e.tomorrow}”</em></>}
            </p>
          ))}
          {e.type === "craving" && (
            <p>
              {e.strength != null && `Strength ${e.strength}/10`}
              {e.areas?.length > 0 && ` · ${e.areas.join(", ")}${e.other ? ` (${e.other})` : ""}`}
              {e.happening && <><br /><em>“{e.happening}”</em></>}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

const LABELS = { intention: "Morning intention", evening: "Evening review", craving: "Craving note" };
