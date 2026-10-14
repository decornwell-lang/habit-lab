// "My practice" summary: current streak, where the member is in their
// cohort, and a Share button (opens the phone's share sheet with a streak image).
import { useEffect, useState } from "react";
import { badgeInfo, badgesForStreak, nextBadge } from "../../lib/streaks.js";
import { formatDate } from "../../lib/dates.js";
import { habitStreakLabel } from "../../lib/cohorts.js";
import ShareCard from "../ShareCard.jsx";
import { makeShareImage } from "../../lib/shareImage.js";

export default function StreakCard({ streak, badges = [], current, weekTitle }) {
  const { cohort, progress } = current;
  const [sharing, setSharing] = useState(false);
  const label = habitStreakLabel(cohort.habitType); // e.g. "alcohol-free"
  const days = `${streak} ${streak === 1 ? "day" : "days"}`;
  // The share image shows the badge this streak has reached (e.g. the 1 day badge).
  const badgeIcon = streak > 0 ? badgeInfo(badgesForStreak(streak).at(-1)).icon : "";
  const text = `I'm ${days} ${label} with The Habit Lab by David Ernest Cornwell ${badgeIcon}\nJoin me: ${window.location.origin}`;

  // Make the share image in the background, so Share can open the phone's share sheet straight away.
  const [file, setFile] = useState(null);
  useEffect(() => {
    if (streak < 1) return;
    makeShareImage({ icon: badgeIcon, title: days, subtitle: label }).then(
      (blob) => blob && setFile(new File([blob], `my-streak-${streak}-days.png`, { type: "image/png" }))
    );
  }, [streak, badgeIcon, days, label]);

  function share() {
    if (file && navigator.canShare?.({ files: [file] })) {
      navigator.share({ files: [file], text }).catch(() => {}); // closed without sharing: nothing to do
    } else {
      setSharing((s) => !s); // computers: show the image with share links instead
    }
  }

  const next = nextBadge(streak);
  const toGo = next.days - streak;
  // Ring: progress towards the next badge.
  const RING = 2 * Math.PI * 44;
  const ringFill = Math.min(streak / next.days, 1);

  return (
    <section className="card streak-card">
      <div className="streak-head">
        <p className="card-label">{label} streak</p>
        {streak > 0 && (
          <button className="streak-share" onClick={share} aria-label="Share my streak">
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      <div className="streak-top">
        <div className="streak-ring">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="44" className="track" />
            <circle cx="50" cy="50" r="44" className="fill" strokeDasharray={RING} strokeDashoffset={RING * (1 - ringFill)} />
          </svg>
          <div className="streak-ring-text">
            <span className="big">{streak}</span>
            <span className="unit">{streak === 1 ? "day" : "days"}</span>
          </div>
        </div>

        <div className="streak-details">
          <h2>{cohort.name}</h2>
          {progress.state === "active" && (
            <>
              <p className="muted small">Day {progress.day} of {cohort.durationDays}</p>
              <div className="cohort-bar"><span style={{ width: `${(progress.day / cohort.durationDays) * 100}%` }} /></div>
            </>
          )}
          {progress.state === "upcoming" && <p className="muted small">Begins {formatDate(progress.start)}</p>}
          {progress.state === "finished" && <p className="muted small">Finished {formatDate(progress.end)}</p>}
          <p className="streak-next">{next.icon} {toGo} {toGo === 1 ? "day" : "days"} to your next badge</p>
        </div>
      </div>

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
