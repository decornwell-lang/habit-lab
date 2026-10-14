// Asks once, after joining a cohort, whether to appear on the leaderboard.
// Shown while the member hasn't chosen yet (leaderboardOptIn is null).
// They can change their mind any time in My account.
import { useState } from "react";
import { updateUserProfile, savePublicProfile } from "../../lib/data.js";

export default function LeaderboardInvite({ uid, profile }) {
  const [busy, setBusy] = useState(false);
  if (!profile || (profile.leaderboardOptIn !== null && profile.leaderboardOptIn !== undefined)) return null;

  async function choose(optIn) {
    setBusy(true);
    try {
      // The profile updates live, which hides this card.
      await updateUserProfile(uid, { leaderboardOptIn: optIn });
      await savePublicProfile(uid, { leaderboardOptIn: optIn });
    } catch (err) {
      console.error(err);
      setBusy(false);
    }
  }

  return (
    <section className="card card-accent">
      <h2>Join the leaderboard?</h2>
      <p className="muted small">Your cohort sees your first name, avatar and streak. You can change this in My account.</p>
      <div className="segmented">
        <button onClick={() => choose(true)} disabled={busy}>Yes, show me</button>
        <button onClick={() => choose(false)} disabled={busy}>No thanks</button>
      </div>
    </section>
  );
}
