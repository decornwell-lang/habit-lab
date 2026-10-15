// "Badges earned" on Home: the current badge (gold seal) and the next one to earn,
// with how many days to go. The share icon opens the phone's share sheet with a badge image.
import { useEffect, useState } from "react";
import { currentBadge, nextBadge } from "../../lib/streaks.js";
import { habitStreakLabel } from "../../lib/cohorts.js";
import ShareCard from "../ShareCard.jsx";
import Badge from "../Badge.jsx";
import { makeShareImage } from "../../lib/shareImage.js";

export default function BadgesCard({ streak, current }) {
  const label = habitStreakLabel(current.cohort.habitType); // e.g. "smoke-free"
  const badge = currentBadge(streak); // null until the first smoke-free day
  const next = nextBadge(streak);
  const toGo = next.days - streak;
  const [sharing, setSharing] = useState(false);
  const image = badge && { badge, title: `${streak}-day streak`, subtitle: label };
  const text = `I'm ${streak} ${streak === 1 ? "day" : "days"} ${label} with The Habit Lab by David Ernest Cornwell 🏅`;

  // Make the share image in the background, so Share can open the share sheet straight away.
  const [file, setFile] = useState(null);
  useEffect(() => {
    if (!image) return;
    makeShareImage(image).then((blob) => blob && setFile(new File([blob], `my-badge-${badge.id}.png`, { type: "image/png" })));
  }, [streak, label]); // eslint-disable-line react-hooks/exhaustive-deps

  function share() {
    if (file && navigator.canShare?.({ files: [file] })) {
      navigator.share({ files: [file], text: `${text}\nJoin me: ${window.location.origin}` }).catch(() => {});
    } else {
      setSharing((s) => !s); // computers: show the image with share links instead
    }
  }

  return (
    <section className="card streak-card badges-card">
      <div className="streak-head">
        <p className="card-label">Badges earned</p>
        {badge && (
          <button className="streak-share" onClick={share} aria-label="Share my badge">
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      <div className="badges-pair">
        <div className="badges-current">
          <Badge badge={badge || next} locked={!badge} size={92} />
          <p className="badges-name">{badge ? badge.name : "Your first badge"}</p>
          <p className="badges-caption">{badge ? "Current" : "Earned with your first smoke-free day"}</p>
        </div>
        {badge && (
          <div className="badges-next">
            <Badge badge={next} locked size={64} />
            <p className="badges-name">{next.name}</p>
            <p className="badges-caption">{toGo} {toGo === 1 ? "day" : "days"} to go</p>
            <div className="next-bar"><span style={{ width: `${(streak / next.days) * 100}%` }} /></div>
          </div>
        )}
      </div>

      {sharing && image && <ShareCard image={image} text={text} simple fileName={`my-badge-${badge.id}.png`} />}
    </section>
  );
}
