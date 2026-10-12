// 7. Leaderboard: members who opted in, with avatar, first name, which habit
// their streak is for (unless they hid it), streak and badges.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getLeaderboard } from "../../lib/data.js";
import { effectiveStreak, badgeInfo, sortBadges } from "../../lib/streaks.js";
import { habitStreakLabel, habitIcon } from "../../lib/cohorts.js";
import Avatar from "../Avatar.jsx";

export default function Leaderboard({ uid, optedIn, today }) {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    getLeaderboard()
      .then((profiles) =>
        setRows(
          profiles
            .map((p) => ({ ...p, current: effectiveStreak(p, today) }))
            .sort((a, b) => b.current - a.current || (b.badges?.length || 0) - (a.badges?.length || 0))
        )
      )
      .catch(() => setRows([]));
  }, [today, optedIn]);

  return (
    <section className="card">
      <p className="card-label">Leaderboard</p>
      {!rows ? (
        <p className="muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="muted">No one is on the leaderboard yet.</p>
      ) : (
        <ol className="people leaderboard">
          {rows.map((p) => (
            <li key={p.id} className={p.id === uid ? "me" : ""}>
              <Avatar id={p.avatar} name={p.firstName} />
              <span className="person-name">
                {p.firstName}
                {p.habitType && p.showHabit !== false && (
                  <span className="habit-tag">{habitIcon(p.habitType)} {habitStreakLabel(p.habitType)}</span>
                )}
                {p.badges?.length > 0 && (
                  <span className="badges" title={sortBadges(p.badges).map((b) => badgeInfo(b).label).join(", ")}>
                    {sortBadges(p.badges).map((b) => badgeInfo(b).icon).join("")}
                  </span>
                )}
              </span>
              <span className="streak-count">{p.current}<small> days</small></span>
            </li>
          ))}
        </ol>
      )}
      {!optedIn && (
        <p className="muted small">
          You're not on the leaderboard. You can change this in <Link to="/account">My account</Link>.
        </p>
      )}
    </section>
  );
}
