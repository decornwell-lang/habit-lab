// "My practice" summary: current streak, badges, where the member is in their
// cohort, and a button to share the streak on social media.
import { useState } from "react";
import { badgeInfo, sortBadges } from "../../lib/streaks.js";
import { formatDate } from "../../lib/dates.js";
import { habitStreakLabel, habitIcon } from "../../lib/cohorts.js";
import ShareCard from "../ShareCard.jsx";

export default function StreakCard({ streak, badges = [], current, weekTitle }) {
  const { cohort, progress } = current;
  const [sharing, setSharing] = useState(false);
  const label = habitStreakLabel(cohort.habitType); // e.g. "alcohol-free"
  const days = `${streak} ${streak === 1 ? "day" : "days"}`;

  return (
    <section className="card streak-card">
      <div className="streak-top">
        <div className="streak-number">
          <span className="big">{streak}</span>
          <span className="unit">{streak === 1 ? "day" : "days"}</span>
        </div>
        <div className="streak-details">
          <p className="card-label">My streak · {label}</p>
          <h2>{cohort.name}</h2>
          {progress.state === "active" && (
            <p className="muted small">Day {progress.day} of {cohort.durationDays} · {weekTitle}</p>
          )}
          {progress.state === "upcoming" && <p className="muted small">Begins {formatDate(progress.start)}</p>}
          {progress.state === "finished" && <p className="muted small">Finished {formatDate(progress.end)}</p>}
          {badges.length > 0 && (
            <p className="streak-badges" title={sortBadges(badges).map((b) => badgeInfo(b).label).join(", ")}>
              {sortBadges(badges).map((b) => badgeInfo(b).icon).join(" ")}
            </p>
          )}
        </div>
      </div>

      {streak > 0 && (
        <button className="btn btn-share" onClick={() => setSharing((s) => !s)}>
          {sharing ? "Close" : "Share my streak"}
        </button>
      )}
      {sharing && (
        <ShareCard
          image={{ icon: habitIcon(cohort.habitType), title: days, subtitle: label }}
          text={`I'm ${days} ${label} with The Habit Lab by David Ernest Cornwell ${habitIcon(cohort.habitType)}`}
          fileName={`my-streak-${streak}-days.png`}
        />
      )}
    </section>
  );
}
