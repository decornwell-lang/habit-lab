// Home, above the cohort's cards: the member's meditation, all their cohorts together (one
// tile, even in two cohorts). Mindful days (never resets), this week ("5 of 7", rest days
// left out), total minutes, and the latest milestone badge (1, 7, 14, 21, 28 mindful days).
// Tapping it opens Practices. Only the member's own numbers; nothing about anyone else.
// The first time a milestone is reached, a short celebration shows once (the milestones
// already celebrated are kept on the profile as mindfulMilestones).
import { useEffect, useState } from "react";
import { mindfulStats, earnedMilestones, nextMilestone } from "../../lib/mindful.js";
import { updateUserProfile } from "../../lib/data.js";
import Badge from "../Badge.jsx";

export const mindfulBadge = (n) => ({ id: `m${n}`, num: n, unit: n === 1 ? "day" : "days", name: `${n} mindful ${n === 1 ? "day" : "days"}` });

export default function MeditationTile({ uid, profile, sessions, today, onOpen }) {
  const stats = mindfulStats(sessions, today, profile?.restDays || []);
  const earned = earnedMilestones(stats.days);
  const latest = earned.at(-1);
  const next = nextMilestone(stats.days);
  const [celebrate, setCelebrate] = useState(null);

  // A milestone reached and not yet celebrated: celebrate it once, then remember it.
  useEffect(() => {
    const seen = profile?.mindfulMilestones || [];
    const fresh = earned.filter((m) => !seen.includes(m));
    if (!fresh.length) return;
    setCelebrate(fresh.at(-1));
    updateUserProfile(uid, { mindfulMilestones: [...new Set([...seen, ...fresh])] }).catch(console.error);
  }, [stats.days]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <button type="button" className="card meditation-tile" onClick={onOpen} aria-label="Meditation: open Practices">
        <span className="card-label">Meditation</span>
        <span className="mindful-stats">
          <span><strong>{stats.days}</strong><small>mindful {stats.days === 1 ? "day" : "days"}</small></span>
          <span><strong>{stats.week.done}<em> of {stats.week.of}</em></strong><small>this week</small></span>
          <span><strong>{stats.minutes}</strong><small>minutes</small></span>
        </span>
        <span className="mindful-badge">
          {latest ? <Badge badge={mindfulBadge(latest)} size={40} /> : <Badge badge={mindfulBadge(1)} size={40} locked />}
          <small>{latest ? `${mindfulBadge(latest).name}${next ? ` · next at ${next}` : ""}` : "Your first practice earns your first badge"}</small>
        </span>
      </button>

      {celebrate && (
        <div className="celebrate" role="dialog" aria-label="Milestone reached" onClick={() => setCelebrate(null)}>
          <div className="celebrate-panel">
            <div className="celebrate-badge"><Badge badge={mindfulBadge(celebrate)} size={120} /></div>
            <p className="celebrate-line">{mindfulBadge(celebrate).name}.</p>
            <button type="button" className="btn btn-primary" onClick={() => setCelebrate(null)}>Lovely</button>
          </div>
        </div>
      )}
    </>
  );
}
