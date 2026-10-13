// Celebration card shown when a badge is earned, followed by the short
// "Still in your practice?" check-in (the answer is visible to the owner).
import { useState } from "react";
import { savePracticeCheck } from "../../lib/data.js";
import { badgeInfo } from "../../lib/streaks.js";
import ShareBadge from "../ShareBadge.jsx";

export default function Celebration({ uid, badgeId, onDone, onNotRightNow }) {
  const badge = badgeInfo(badgeId);
  const [busy, setBusy] = useState(false);
  const [sharing, setSharing] = useState(false);

  async function answer(value) {
    setBusy(true);
    await savePracticeCheck(uid, { badge: badgeId, answer: value }).catch(console.error);
    setBusy(false);
    value === "yes" ? onDone() : onNotRightNow();
  }

  return (
    <section className="card card-celebrate" role="status">
      <div className="badge-big">{badge.icon}</div>
      <p className="card-label">New badge</p>
      <h2>{badge.label}</h2>
      {sharing ? (
        <ShareBadge badgeId={badgeId} />
      ) : (
        <button className="btn btn-ghost btn-small" onClick={() => setSharing(true)}>Share</button>
      )}
      <p className="question-title">Still in your practice?</p>
      <div className="segmented">
        <button onClick={() => answer("yes")} disabled={busy}>Yes</button>
        <button onClick={() => answer("notRightNow")} disabled={busy}>Not right now</button>
      </div>
    </section>
  );
}
