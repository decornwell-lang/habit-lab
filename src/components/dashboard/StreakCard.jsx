// The box at the top of Home: the member's badge (gold seal), their streak,
// progress towards the next badge, and their journey (day dots) on tap.
// The share icon opens the phone's share sheet with a badge image.
import { useEffect, useState } from "react";
import { currentBadge, nextBadge } from "../../lib/streaks.js";
import { formatDate } from "../../lib/dates.js";
import { habitStreakLabel } from "../../lib/cohorts.js";
import ShareCard from "../ShareCard.jsx";
import Badge from "../Badge.jsx";
import JourneyMap from "./JourneyMap.jsx";
import { makeShareImage } from "../../lib/shareImage.js";

export default function StreakCard({ streak, current, checkins }) {
  const { cohort, progress } = current;
  const [sharing, setSharing] = useState(false);
  const [showJourney, setShowJourney] = useState(false);
  const label = habitStreakLabel(cohort.habitType); // e.g. "alcohol-free"
  const badge = currentBadge(streak); // null until the first "Yes"
  const next = nextBadge(streak);
  const toGo = next.days - streak;
  const streakText = `${streak}-day streak`; // for the share image
  const image = badge && { badge, title: streakText, subtitle: label };
  const text = `I'm ${streak} ${streak === 1 ? "day" : "days"} ${label} with The Habit Lab by David Ernest Cornwell 🏅`;

  // Make the share image in the background, so Share can open the phone's share sheet straight away.
  const [file, setFile] = useState(null);
  useEffect(() => {
    if (!image) return;
    makeShareImage(image).then(
      (blob) => blob && setFile(new File([blob], `my-streak-${streak}-days.png`, { type: "image/png" }))
    );
  }, [streak, label]); // eslint-disable-line react-hooks/exhaustive-deps

  function share() {
    if (file && navigator.canShare?.({ files: [file] })) {
      navigator.share({ files: [file], text: `${text}\nJoin me: ${window.location.origin}` }).catch(() => {});
    } else {
      setSharing((s) => !s); // computers: show the image with share links instead
    }
  }

  return (
    <section className="card streak-card">
      <div className="streak-head">
        <p className="card-label">{badge ? "My badge" : "Your first badge"}</p>
        {badge && (
          <button className="streak-share" onClick={share} aria-label="Share my badge">
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      <div className="streak-top">
        <div className="badge-stack">
          <Badge badge={badge || next} locked={!badge} size={96} />
          <span className="streak-pill">
            <strong>{streak}</strong> day streak
          </span>
        </div>
        <div className="streak-details">
          <h2>{badge ? `${badge.name}` : "Check in “Yes” to earn it"}</h2>
          <p className="streak-line">{label}</p>
          <p className="muted small">{cohort.name}</p>
        </div>
      </div>

      {badge && (
        <div className="next-badge">
          <Badge badge={next} locked size={40} />
          <div className="next-badge-text">
            <p><strong>Next: {next.name}</strong> · {toGo} {toGo === 1 ? "day" : "days"} to go</p>
            <div className="next-bar"><span style={{ width: `${(streak / next.days) * 100}%` }} /></div>
          </div>
        </div>
      )}

      <button className="journey-toggle" onClick={() => setShowJourney((s) => !s)} aria-expanded={showJourney}>
        <span>
          {progress.state === "active" && <>Day {progress.day} of {cohort.durationDays}</>}
          {progress.state === "upcoming" && <>Begins {formatDate(progress.start)}</>}
          {progress.state === "finished" && <>Cohort finished</>}
        </span>
        <span className="journey-toggle-link">
          {showJourney ? "Hide journey" : "My journey"}
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      {progress.state === "active" && <div className="cohort-bar"><span style={{ width: `${(progress.day / cohort.durationDays) * 100}%` }} /></div>}
      {showJourney && <div className="journey-wrap"><JourneyMap current={current} checkins={checkins} /></div>}

      {sharing && image && <ShareCard image={image} text={text} simple fileName={`my-streak-${streak}-days.png`} />}
    </section>
  );
}
