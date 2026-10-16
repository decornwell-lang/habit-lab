// Asks once, after joining a cohort, whether to appear on the leaderboard.
// Shown while the member hasn't chosen yet (leaderboardOptIn is null). "Yes" first lets
// them choose their picture (avatar or photo) and the name others see.
// They can change all of this any time in My account.
import { useState } from "react";
import { updateUserProfile, savePublicProfile } from "../../lib/data.js";
import { publicIdentity } from "../../lib/identity.js";
import AppearanceFields from "../AppearanceFields.jsx";

export default function LeaderboardInvite({ uid, profile }) {
  const [busy, setBusy] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [look, setLook] = useState({
    avatar: profile?.avatar || null,
    photo: profile?.photo || null,
    nameChoice: profile?.nameChoice || "first",
    nickname: profile?.nickname || "",
  });
  if (!profile || (profile.leaderboardOptIn !== null && profile.leaderboardOptIn !== undefined)) return null;

  async function save(optIn) {
    setBusy(true);
    try {
      // The profile updates live, which hides this card.
      const chosen = optIn ? { ...look, nickname: look.nickname.trim() } : {};
      await updateUserProfile(uid, { ...chosen, leaderboardOptIn: optIn });
      await savePublicProfile(uid, { ...publicIdentity({ ...profile, ...chosen }), leaderboardOptIn: optIn });
    } catch (err) {
      console.error(err);
      setBusy(false);
    }
  }

  return (
    <section className="card card-accent">
      <h2>Join the leaderboard?</h2>
      {choosing ? (
        <>
          <AppearanceFields value={look} onChange={setLook} firstName={profile.firstName} surname={profile.surname} />
          <button className="btn btn-primary" onClick={() => save(true)} disabled={busy}>{busy ? "Saving…" : "Join the leaderboard"}</button>
          <button className="btn btn-text" onClick={() => setChoosing(false)} disabled={busy}>Back</button>
        </>
      ) : (
        <>
          <p className="muted small">Your cohort sees your picture, the name you choose and your streak. You can change this in My account (menu).</p>
          <div className="segmented">
            <button onClick={() => setChoosing(true)} disabled={busy}>Yes, show me</button>
            <button onClick={() => save(false)} disabled={busy}>No thanks</button>
          </div>
        </>
      )}
    </section>
  );
}
