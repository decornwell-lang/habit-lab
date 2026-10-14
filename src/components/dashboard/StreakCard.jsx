// "My practice" summary: current streak, where the member is in their
// cohort, and a button to share the streak on social media.
import { useState } from "react";
import { badgeInfo, badgesForStreak } from "../../lib/streaks.js";
import { formatDate } from "../../lib/dates.js";
import { habitStreakLabel } from "../../lib/cohorts.js";
import ShareCard from "../ShareCard.jsx";

export default function StreakCard({ streak, badges = [], current, weekTitle }) {
  const { cohort, progress } = current;
  const [sharing, setSharing] = useState(false);
  const label = habitStreakLabel(cohort.habitType); // e.g. "alcohol-free"
  const days = `${streak} ${streak === 1 ? "day" : "days"}`;
  // The share image shows the badge this streak has reached (e.g. the 1 day badge).
  const badgeIcon = streak > 0 ? badgeInfo(badgesForStreak(streak).at(-1)).icon : "";

  return (
    <section className="card streak-card">
      <div className="streak-top">
        <div className="streak-number">
          <span className="big">{streak}</span>
          <span className="unit">day streak</span>
        </div>
        <div className="streak-details">
          <p className="card-label">My streak · {label}</p>
          <h2>{cohort.name}</h2>
          {progress.state === "active" && (
            <p className="muted small">Day {progress.day} of {cohort.durationDays}</p>
          )}
          {progress.state === "upcoming" && <p className="muted small">Begins {formatDate(progress.start)}</p>}
          {progress.state === "finished" && <p className="muted small">Finished {formatDate(progress.end)}</p>}
        </div>
      </div>

      {streak > 0 && (
        <button className="btn btn-share btn-small" onClick={() => setSharing((s) => !s)}>
          {sharing ? "Close" : "Share"}
        </button>
      )}
      {sharing && (
        <ShareCard
          image={{ icon: badgeIcon, title: days, subtitle: label }}
          text={`I'm ${days} ${label} with The Habit Lab by David Ernest Cornwell ${badgeIcon}`}
          simple
          fileName={`my-streak-${streak}-days.png`}
        />
      )}
    </section>
  );
}
