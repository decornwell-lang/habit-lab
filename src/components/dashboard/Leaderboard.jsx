// Leaderboard (Home tile): members of this cohort who opted in, ranked by their streak
// in it. Each row: rank, avatar, first name, the challenge (unless they hid it), their
// current badge and streak.
import { useEffect, useState } from "react";
import { getLeaderboard } from "../../lib/data.js";
import { effectiveStreak, sortBadges, profileStreakFor } from "../../lib/streaks.js";
import { habitStreakLabel } from "../../lib/cohorts.js";
import Badge from "../Badge.jsx";
import Avatar from "../Avatar.jsx";

export default function Leaderboard({ uid, cohort, optedIn, today }) {
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
                <Avatar id={p.avatar} name={p.firstName} />
                <span className="lb-who">
                  <strong>{p.firstName}</strong>
                  {habit && <span className="lb-meta">{habit.charAt(0).toUpperCase() + habit.slice(1)}</span>}
                </span>
                {top && <Badge id={top} size={30} />}
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
