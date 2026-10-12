// 5. My Pod: the small group of 3-5 members the member is placed with.
// Only first name and avatar are shown, and only for members who opted in.
import { useEffect, useState } from "react";
import { podFor } from "../../lib/cohorts.js";
import { getVisibleProfiles } from "../../lib/data.js";
import { effectiveStreak } from "../../lib/streaks.js";
import Avatar from "../Avatar.jsx";
import PodNotes from "./PodNotes.jsx";

export default function MyPod({ uid, profile, current, today }) {
  const [members, setMembers] = useState(null);
  const pod = current ? podFor(current.cohort.memberIds || [], uid) : [];
  const podKey = pod.join(",");

  useEffect(() => {
    if (!podKey) return;
    getVisibleProfiles(podKey.split(",")).then(setMembers);
  }, [podKey]);

  if (!current) {
    return (
      <section className="card">
        <p className="card-label">My Pod</p>
        <p className="muted">When you join a cohort, you'll be placed in a small pod of 3 or 4 members.</p>
      </section>
    );
  }

  const visible = (members || []).filter((m) => m && (m.id === uid || m.leaderboardOptIn));
  const hidden = pod.length - visible.length;

  return (
    <section className="card">
      <p className="card-label">My Pod</p>
      <h2>Your pod in {current.cohort.name}</h2>
      {!members ? (
        <p className="muted">Loading…</p>
      ) : (
        <ul className="people">
          {visible.map((m) => (
            <li key={m.id}>
              <Avatar id={m.avatar} name={m.firstName} />
              <span className="person-name">{m.id === uid ? `${m.firstName} (you)` : m.firstName}</span>
              <span className="muted small">{effectiveStreak(m, today)} day streak</span>
            </li>
          ))}
        </ul>
      )}
      {hidden > 0 && (
        <p className="muted small">
          {hidden === 1 ? "1 more member keeps" : `${hidden} more members keep`} their profile private.
        </p>
      )}
      {pod.length === 1 && <p className="muted small">More members will join your pod as the cohort fills up.</p>}
      <PodNotes uid={uid} profile={profile} cohortId={current.cohort.id} podIds={pod} />
    </section>
  );
}
