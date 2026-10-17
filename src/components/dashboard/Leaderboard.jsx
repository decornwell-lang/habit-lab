// Leaderboard (Home tile): members of this cohort who opted in, ranked by their streak
// in it. Each row: rank, picture, the name they chose, the challenge (unless they hid it), their
// current badge and streak. Before the cohort begins (`opensOn`, its start date) it just
// says when it opens.
import { useEffect, useState } from "react";
import { formatDate } from "../../lib/dates.js";
import { getLeaderboard } from "../../lib/data.js";
import { effectiveStreak, sortBadges, profileStreakFor } from "../../lib/streaks.js";
import { habitStreakLabel } from "../../lib/cohorts.js";
import Badge from "../Badge.jsx";
import Avatar from "../Avatar.jsx";

export default function Leaderboard({ uid, cohort, optedIn, today, opensOn }) {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    getLeaderboard()
      .then((profiles) =>
        setRows(
          profiles
            .map((p) => ({ ...p, entry: profileStreakFor(p, cohort) }))
            .filter((p) => p.entry)
            .map((p) => ({ ...p, badges: p.entry.badges || [], current: effectiveStreak(p.entry, today) }))
            .sort((a, b) => b.current - a.current || (b.badges?.length || 0) - (a.badges?.length || 0))
        )
      )
      .catch(() => setRows([]));
  }, [today, optedIn, cohort]);

  if (opensOn) {
    return (
      <section className="card">
        <p className="card-label">Leaderboard</p>
        <p className="muted">Opens on {formatDate(opensOn, { weekday: undefined, year: undefined })}, when your cohort begins.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <p className="card-label">Leaderboard</p>
      {!rows ? (
        <p className="muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="muted">No one yet.</p>
      ) : (
        <ol className="people leaderboard">
          {rows.map((p, i) => {
            const top = p.badges?.length ? sortBadges(p.badges).at(-1) : null;
            const habit = p.showHabit !== false ? habitStreakLabel(cohort.habitType) : "";
            return (
              <li key={p.id} className={p.id === uid ? "me" : ""}>
                <span className="lb-rank">{i + 1}</span>
                <Avatar id={p.avatar} photo={p.photo} name={p.name || p.firstName} />
                <span className="lb-who">
                  <strong>{p.name || p.firstName}</strong>
                  {habit && <span className="lb-meta">{habit.charAt(0).toUpperCase() + habit.slice(1)}</span>}
                </span>
                {top && <Badge id={top} size={26} />}
                <span className="lb-streak"><strong>{p.current}</strong><small>{p.current === 1 ? "day" : "days"}</small></span>
              </li>
            );
          })}
        </ol>
      )}
      {!optedIn && (
        <p className="muted small">
          You're not on the leaderboard. You can change this in My account (menu).
        </p>
      )}
    </section>
  );
}
