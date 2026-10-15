// "Badges earned" on Home: the current badge (gold seal) and the next one to earn,
// with how many days to go. Sharing sends a picture of the gold medal with the
// challenge below it (e.g. "Smoke-free").
import { currentBadge, nextBadge } from "../../lib/streaks.js";
import { habitStreakLabel } from "../../lib/cohorts.js";
import Badge from "../Badge.jsx";
import ShareImageButton from "../ShareImageButton.jsx";

export default function BadgesCard({ streak, current }) {
  const label = habitStreakLabel(current.cohort.habitType); // e.g. "smoke-free"
  const badge = currentBadge(streak); // null until the first smoke-free day
  const next = nextBadge(streak);
  const toGo = next.days - streak;

  return (
    <section className="card streak-card badges-card">
      <div className="streak-head">
        <p className="card-label">Badges earned</p>
        {badge && (
          <ShareImageButton label="Share my badge" image={{ badge, label }} fileName={`my-badge-${badge.id}.png`}
            text={`I earned my ${badge.name}: ${label} with The Habit Lab by David Ernest Cornwell 🏅`} />
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

    </section>
  );
}
