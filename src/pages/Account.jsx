// My account (from the menu): each member's own page. Their details, the cohorts they're
// in (each can be removed, with its data), light/dark/automatic, badges (with sharing), avatar, mobile number,
// privacy, notifications, password, log out, and deleting their membership.
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { updateUserProfile, savePublicProfile, getPublicProfile } from "../lib/data.js";
import { badgeInfo, sortBadges, profileStreaks } from "../lib/streaks.js";
import { habitStreakLabel } from "../lib/cohorts.js";
import ShareBadge from "../components/ShareBadge.jsx";
import Badge from "../components/Badge.jsx";
import NotificationSettings from "../components/NotificationSettings.jsx";
import ChangePassword from "../components/ChangePassword.jsx";
import { isValidPhone } from "../lib/phone.js";
import PhoneInput from "../components/PhoneInput.jsx";
import MyCohorts from "../components/MyCohorts.jsx";
import ThemeSetting from "../components/ThemeSetting.jsx";
import AppearanceFields from "../components/AppearanceFields.jsx";
import { publicIdentity, lookFrom } from "../lib/identity.js";
import DeleteAccount from "../components/DeleteAccount.jsx";
import { REFLECTION_CONSENT } from "../content/site.js";

export default function Account() {
  const { user, profile, logOut } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const afterLink = params.get("newPassword") === "1"; // just logged in with an emailed link
  // Picture and leaderboard name (AppearanceFields.jsx).
  const [look, setLook] = useState(() => lookFrom(profile));
  const [optIn, setOptIn] = useState(Boolean(profile?.leaderboardOptIn));
  const [showHabit, setShowHabit] = useState(profile?.showHabit !== false);
  const [reflectionConsent, setReflectionConsent] = useState(Boolean(profile?.reflectionConsent));
  const [phone, setPhone] = useState(profile?.phone || "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [badges, setBadges] = useState([]); // [{ id, key, label }] from every cohort
  const [sharingId, setSharingId] = useState(null);
  const firstName = profile?.firstName || user.displayName || "";

  useEffect(() => {
    getPublicProfile(user.uid)
      .then((p) =>
        setBadges(profileStreaks(p).flatMap((s) =>
          sortBadges(s.badges || []).map((id) => ({ id, key: `${s.cohortId}-${id}`, label: s.habitType ? habitStreakLabel(s.habitType) : undefined }))
        ))
      )
      .catch(() => setBadges([]));
  }, [user.uid]);

  async function handleSave(e) {
    e.preventDefault();
    setMessage("");
    if (phone && !isValidPhone(phone)) return setMessage("Check your mobile number.");
    setBusy(true);
    try {
      // The phone number is private: only the owner sees it.
      await updateUserProfile(user.uid, { ...look, nickname: look.nickname.trim(), leaderboardOptIn: optIn, showHabit, reflectionConsent, phone: phone || null });
      // The public profile never holds surname, email or phone.
      await savePublicProfile(user.uid, { ...publicIdentity({ ...profile, ...look }), leaderboardOptIn: optIn, showHabit });
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

      {afterLink && <ChangePassword highlight />}

      <section className="card">
        <h2>My details</h2>
        <dl className="details-list">
          <dt>Name</dt><dd>{[profile?.firstName, profile?.surname].filter(Boolean).join(" ") || firstName}</dd>
          <dt>Email</dt><dd>{profile?.email || user.email}</dd>
          <dt>Mobile</dt><dd>{profile?.phone || "Not added"}</dd>
        </dl>
      </section>

      <MyCohorts uid={user.uid} />

      <ThemeSetting uid={user.uid} profile={profile} />

      <section className="card">
        <h2>My badges</h2>
        {badges.length === 0 ? (
          <p className="muted small">None yet.</p>
        ) : (
          <ul className="badge-list">
            {badges.map(({ id, key, label }) => {
              const b = badgeInfo(id);
              return (
                <li key={key}>
                  <div className="badge-row">
                    <Badge badge={b} size={44} />
                    <span className="person-name">{b.name}{label && <span className="muted small"> · {label}</span>}</span>
                    <button type="button" className="link-btn" onClick={() => setSharingId(sharingId === key ? null : key)}>
                      {sharingId === key ? "Close" : "Share"}
                    </button>
                  </div>
                  {sharingId === key && <ShareBadge badgeId={id} label={label} />}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <form className="card" onSubmit={handleSave}>
        <h2>How others see you</h2>
        <AppearanceFields value={look} onChange={setLook} firstName={profile?.firstName || firstName} surname={profile?.surname} />

        <h2>Mobile number</h2>
        <div className="field">
          <label htmlFor="phone">Mobile</label>
          <PhoneInput value={phone} onChange={setPhone} />
          <p className="hint">Private.</p>
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
        <label className="checkbox">
          <input type="checkbox" checked={reflectionConsent} onChange={(e) => setReflectionConsent(e.target.checked)} />
          <span>{REFLECTION_CONSENT}</span>
        </label>
        <p className="muted small">Your email and mobile are never shown.</p>

        {message && <p className="form-success" role="status">{message}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
      </form>

      <NotificationSettings uid={user.uid} />

      {!afterLink && <ChangePassword />}

      <button
        className="btn btn-ghost"
        onClick={async () => {
          await logOut();
          navigate("/");
        }}
      >
        Log out
      </button>

      <DeleteAccount />
    </main>
  );
}
