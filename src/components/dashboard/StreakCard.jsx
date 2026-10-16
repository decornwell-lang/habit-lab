// "My streak" on Home: the number of smoke-free days in a row (across all the member's
// cohorts for this habit, so phase 2 carries on from phase 1), their longest streak if a
// slip broke a longer one, where they are in this cohort, and their journey (one dot per cohort day). Sharing sends a picture
// of the number of days, e.g. "20 days · Smoke-free", whether or not there's a badge for it.
import { formatDate } from "../../lib/dates.js";
import { habitStreakLabel } from "../../lib/cohorts.js";
import JourneyMap from "./JourneyMap.jsx";
import ShareImageButton from "../ShareImageButton.jsx";

export default function StreakCard({ streak, best = 0, current, checkins, onCorrect }) {
  const { cohort, progress } = current;
  const label = habitStreakLabel(cohort.habitType); // e.g. "smoke-free"

  return (
    <section className="card streak-card my-streak">
      <div className="streak-head">
        <p className="card-label">My streak</p>
        {streak > 0 && (
          <ShareImageButton label="Share my streak" image={{ days: streak, label }} fileName={`my-streak-${streak}-days.png`}
            text={`${streak} ${streak === 1 ? "day" : "days"} ${label} with The Habit Lab by David Ernest Cornwell 🌿`} />
        )}
      </div>
      <div className="my-streak-top">
        <p className="my-streak-number">
          <strong>{streak}</strong>
          <span>{streak === 1 ? "day" : "days"} {label}</span>
          {best > streak && <small className="my-streak-best">Longest: {best} {best === 1 ? "day" : "days"}</small>}
        </p>
        <div className="my-streak-cohort">
          <p className="muted small">{cohort.name}</p>
          <p className="my-streak-day">
            {progress.state === "active" && `Day ${progress.day} of ${cohort.durationDays}`}
            {progress.state === "upcoming" && `Begins ${formatDate(progress.start)}`}
            {progress.state === "finished" && "Cohort finished"}
          </p>
          {progress.state === "active" && (
            <div className="cohort-bar"><span style={{ width: `${(progress.day / cohort.durationDays) * 100}%` }} /></div>
          )}
        </div>
      </div>
      <div className="journey-wrap"><JourneyMap current={current} checkins={checkins} onCorrect={onCorrect} /></div>
    </section>
  );
}
