// My account: badges (with sharing), avatar, leaderboard opt-in, and log out.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { updateUserProfile, savePublicProfile, getPublicProfile } from "../lib/data.js";
import { badgeInfo, sortBadges } from "../lib/streaks.js";
import { AVATARS } from "../content/avatars.js";
import Avatar from "../components/Avatar.jsx";
import ShareBadge from "../components/ShareBadge.jsx";
import NotificationSettings from "../components/NotificationSettings.jsx";
import { isValidPhone, normalizePhone } from "../lib/phone.js";

export default function Account() {
  const { user, profile, logOut } = useAuth();
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState(profile?.avatar || null);
  const [optIn, setOptIn] = useState(Boolean(profile?.leaderboardOptIn));
  const [showHabit, setShowHabit] = useState(profile?.showHabit !== false);
  const [phone, setPhone] = useState(profile?.phone || "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [badges, setBadges] = useState([]);
  const [sharingId, setSharingId] = useState(null);
  const firstName = profile?.firstName || user.displayName || "";

  useEffect(() => {
    getPublicProfile(user.uid)
      .then((p) => setBadges(sortBadges(p?.badges || [])))
      .catch(() => setBadges([]));
  }, [user.uid]);

  async function handleSave(e) {
    e.preventDefault();
    setMessage("");
    if (phone.trim() && !isValidPhone(phone)) {
      return setMessage("Add country code, e.g. +44.");
    }
    setBusy(true);
    try {
      // The phone number is private: only the owner sees it.
      await updateUserProfile(user.uid, { avatar, leaderboardOptIn: optIn, showHabit, phone: phone.trim() ? normalizePhone(phone) : null });
      // The public profile never holds surname, email or phone.
      await savePublicProfile(user.uid, { firstName, avatar, leaderboardOptIn: optIn, showHabit });
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

      <section className="card">
        <h2>My badges</h2>
        {badges.length === 0 ? (
          <p className="muted small">None yet.</p>
        ) : (
          <ul className="badge-list">
            {badges.map((id) => {
              const b = badgeInfo(id);
              return (
                <li key={id}>
                  <div className="badge-row">
                    <span className="badge-icon">{b.icon}</span>
                    <span className="person-name">{b.label}</span>
                    <button type="button" className="link-btn" onClick={() => setSharingId(sharingId === id ? null : id)}>
                      {sharingId === id ? "Close" : "Share"}
                    </button>
                  </div>
                  {sharingId === id && <ShareBadge badgeId={id} />}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <form className="card" onSubmit={handleSave}>
        <h2>Avatar</h2>
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

        <h2>Mobile number</h2>
        <div className="field">
          <label htmlFor="phone">Mobile</label>
          <input id="phone" type="tel" autoComplete="tel" placeholder="+44 7700 900123" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <p className="hint">Private. Include country code.</p>
        </div>

        <h2>Privacy</h2>
        <label className="checkbox">
          <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} />
          <span>Show me on the leaderboard</span>
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={showHabit} onChange={(e) => setShowHabit(e.target.checked)} />
          <span>Show my habit</span>
        </label>
        <p className="muted small">Surname and email are never shown.</p>

        {message && <p className="form-success" role="status">{message}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
      </form>

      <NotificationSettings uid={user.uid} />

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
