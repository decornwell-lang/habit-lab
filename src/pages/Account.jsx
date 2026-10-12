// My account: avatar, leaderboard opt-in, and log out.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { updateUserProfile, savePublicProfile } from "../lib/data.js";
import { AVATARS } from "../content/avatars.js";
import Avatar from "../components/Avatar.jsx";

export default function Account() {
  const { user, profile, logOut } = useAuth();
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState(profile?.avatar || null);
  const [optIn, setOptIn] = useState(Boolean(profile?.leaderboardOptIn));
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const firstName = profile?.firstName || user.displayName || "";

  async function handleSave(e) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await updateUserProfile(user.uid, { avatar, leaderboardOptIn: optIn });
      // The public profile only ever holds first name and avatar.
      await savePublicProfile(user.uid, { firstName, avatar, leaderboardOptIn: optIn });
      setMessage("Saved.");
    } catch (err) {
      console.error(err);
      setMessage("We couldn't save your changes. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <p className="eyebrow">My account</p>
      <h1>{firstName}</h1>
      <p className="muted">{profile?.email || user.email}</p>

      <form className="card" onSubmit={handleSave}>
        <h2>Your avatar</h2>
        <p className="muted small">This is what other members see next to your first name.</p>
        <div className="avatar-grid" role="radiogroup" aria-label="Choose an avatar">
          {AVATARS.map((a) => (
            <button
              type="button"
              key={a.id}
              role="radio"
              aria-checked={avatar === a.id}
              aria-label={a.id}
              className={avatar === a.id ? "selected" : ""}
              onClick={() => setAvatar(a.id)}
            >
              <Avatar id={a.id} size={48} />
            </button>
          ))}
        </div>

        <h2>Privacy</h2>
        <label className="checkbox">
          <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} />
          <span>Show me on the Habit Lab leaderboard and to my pod (first name and avatar only)</span>
        </label>
        <p className="muted small">
          Your surname, email and phone number are never shown to other members.
        </p>

        {message && <p className="form-success" role="status">{message}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
      </form>

      <button
        className="btn btn-ghost"
        onClick={async () => {
          await logOut();
          navigate("/");
        }}
      >
        Log out
      </button>
    </main>
  );
}
