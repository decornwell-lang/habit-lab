// "My practice" summary: current streak, badges, and where the member is in their cohort.
import { badgeInfo, sortBadges } from "../../lib/streaks.js";
import { formatDate } from "../../lib/dates.js";

export default function StreakCard({ streak, badges = [], current, weekTitle }) {
  const { cohort, progress } = current;
  return (
    <section className="card streak-card">
      <div className="streak-number">
        <span className="big">{streak}</span>
        <span className="unit">{streak === 1 ? "day" : "days"}</span>
      </div>
      <div className="streak-details">
        <p className="card-label">My streak</p>
        <h2>{cohort.name}</h2>
        {progress.state === "active" && (
          <p className="muted small">Day {progress.day} of {cohort.durationDays} · {weekTitle}</p>
        )}
        {progress.state === "upcoming" && (
          <p className="muted small">Begins {formatDate(progress.start)}</p>
        )}
        {progress.state === "finished" && <p className="muted small">Finished {formatDate(progress.end)}</p>}
        {badges.length > 0 && (
          <p className="streak-badges" title={sortBadges(badges).map((b) => badgeInfo(b).label).join(", ")}>
            {sortBadges(badges).map((b) => badgeInfo(b).icon).join(" ")}
          </p>
        )}
      </div>
    </section>
  );
}
