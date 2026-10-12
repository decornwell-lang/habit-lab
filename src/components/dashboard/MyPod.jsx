// My Pod: members choose to join a small pod (up to 4 people) in their cohort.
// Inside the pod they can choose to share their phone number with the pod
// (so they can start a WhatsApp group), send encouragement notes, leave,
// or ask David to change their pod.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getMyPod, joinPod, leavePod, getPodMembers, setPodPhone, getVisibleProfiles,
  addPodRequest, getMyOpenPodRequest, POD_SIZE, POD_TYPES, podTypeLabel,
} from "../../lib/data.js";
import { effectiveStreak } from "../../lib/streaks.js";
import { whatsAppLink } from "../../lib/phone.js";
import Avatar from "../Avatar.jsx";
import PodNotes from "./PodNotes.jsx";

export default function MyPod({ uid, profile, current, today }) {
  const cohortId = current.cohort.id;
  const [pod, setPod] = useState(undefined); // undefined = loading, null = not in a pod
  const [members, setMembers] = useState([]);
  const [streaks, setStreaks] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function load() {
    try {
      const p = await getMyPod(cohortId, uid);
      setPod(p);
      if (!p) return;
      const cards = await getPodMembers(p.id);
      setMembers(cards);
      // Keep a shared number up to date if the member changed it in My account.
      const mine = cards.find((c) => c.id === uid);
      if (mine?.phone && profile?.phone && mine.phone !== profile.phone) await setPodPhone(p.id, uid, profile.phone);
      const profiles = await getVisibleProfiles(p.memberIds);
      setStreaks(Object.fromEntries(profiles.filter(Boolean).map((x) => [x.id, effectiveStreak(x, today)])));
    } catch (err) {
      console.error(err);
      setPod(null);
    }
  }

  useEffect(() => {
    load();
  }, [cohortId, uid]); // eslint-disable-line react-hooks/exhaustive-deps

  async function run(action) {
    setBusy(true);
    setError("");
    try {
      await action();
      await load();
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const [podType, setPodType] = useState("mixed");
  const handleJoin = () =>
    run(() => joinPod(cohortId, uid, { firstName: profile?.firstName || "Member", avatar: profile?.avatar }, podType));
  const handleLeave = () => {
    if (window.confirm("Leave your pod? You can join a new one at any time.")) run(() => leavePod(pod.id, uid));
  };

  if (pod === undefined) {
    return (
      <section className="card">
        <p className="card-label">My Pod</p>
        <p className="muted">Loading…</p>
      </section>
    );
  }

  // Not in a pod yet: explain and offer to join.
  if (!pod) {
    return (
      <section className="card">
        <p className="card-label">My Pod</p>
        <h2>Walk alongside a few others</h2>
        <p className="muted">
          A pod is a small group of up to {POD_SIZE} people from your cohort. You'll see each other's first names and
          streaks, send short notes of encouragement, and can choose to share your number to start a WhatsApp group.
        </p>
        <fieldset className="question pod-types">
          <legend>What kind of pod feels right for you?</legend>
          {POD_TYPES.map((t) => (
            <label key={t.id} className={`pod-type ${podType === t.id ? "selected" : ""}`}>
              <input type="radio" name="podType" value={t.id} checked={podType === t.id} onChange={() => setPodType(t.id)} />
              <span>
                <strong>{t.label}</strong>
                <small>{t.hint}</small>
              </span>
            </label>
          ))}
        </fieldset>
        <button className="btn btn-primary" onClick={handleJoin} disabled={busy}>{busy ? "Joining…" : "Join a pod"}</button>
        <p className="muted small center">Joining is optional. You can leave at any time.</p>
        {error && <p className="form-error">{error}</p>}
      </section>
    );
  }

  const me = members.find((m) => m.id === uid);
  const sharing = Boolean(me?.phone);
  const sharedNumbers = members.filter((m) => m.phone);

  async function copyNumbers() {
    try {
      await navigator.clipboard.writeText(sharedNumbers.map((m) => `${m.firstName}: ${m.phone}`).join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Couldn't copy. You can copy the numbers one by one.");
    }
  }

  return (
    <section className="card">
      <p className="card-label">My Pod · {pod.memberIds.length} of {POD_SIZE}</p>
      <h2>Your {podTypeLabel(pod.type).toLowerCase()}</h2>

      <ul className="people">
        {members.map((m) => (
          <li key={m.id}>
            <Avatar id={m.avatar} name={m.firstName} />
            <span className="person-name">
              {m.id === uid ? `${m.firstName} (you)` : m.firstName}
              {m.phone && m.id !== uid && (
                <a className="wa-link" href={whatsAppLink(m.phone)} target="_blank" rel="noreferrer">WhatsApp {m.phone}</a>
              )}
            </span>
            {streaks[m.id] !== undefined && <span className="muted small">{streaks[m.id]} day streak</span>}
          </li>
        ))}
      </ul>
      {pod.memberIds.length < POD_SIZE && (
        <p className="muted small">
          There's room for more. Your pod will fill as others choose a {podTypeLabel(pod.type).toLowerCase()}.
        </p>
      )}

      {/* Phone sharing */}
      <div className="pod-section">
        <h3>WhatsApp group</h3>
        {!profile?.phone ? (
          <p className="muted small">
            <Link to="/account">Add your mobile number in My account</Link> to share it with your pod.
          </p>
        ) : (
          <label className="checkbox">
            <input
              type="checkbox"
              checked={sharing}
              disabled={busy}
              onChange={(e) => run(() => setPodPhone(pod.id, uid, e.target.checked ? profile.phone : null))}
            />
            <span>Share my number ({profile.phone}) with my pod only</span>
          </label>
        )}
        {sharedNumbers.length >= 2 ? (
          <>
            <p className="muted small">
              To start a group, one of you opens WhatsApp, taps <strong>New group</strong>, and adds these numbers:
            </p>
            <button className="btn btn-ghost btn-small" onClick={copyNumbers}>{copied ? "Copied ✓" : "Copy all numbers"}</button>
          </>
        ) : (
          <p className="muted small">Once two or more of you share your numbers, you can start a WhatsApp group together.</p>
        )}
      </div>

      <PodNotes uid={uid} profile={profile} cohortId={cohortId} podId={pod.id} podIds={pod.memberIds} />

      <PodChangeRequest uid={uid} profile={profile} cohortId={cohortId} podId={pod.id} />

      <p className="center">
        <button className="link-btn" onClick={handleLeave} disabled={busy}>Leave this pod</button>
      </p>
      {error && <p className="form-error">{error}</p>}
    </section>
  );
}

// "Pod not working?" — sends a private request to David.
function PodChangeRequest({ uid, profile, cohortId, podId }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getMyOpenPodRequest(uid).then(setPending).catch(() => setPending(null));
  }, [uid]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await addPodRequest({ uid, firstName: profile?.firstName || "", cohortId, podId, reason: reason.trim().slice(0, 500) });
      setPending({ reason });
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  if (pending) {
    return <p className="notice notice-good small">Your request to change pod has been sent to David. He'll be in touch.</p>;
  }

  return (
    <div className="pod-section">
      {!open ? (
        <button className="link-btn" onClick={() => setOpen(true)}>Pod not working for you? Ask David to change it</button>
      ) : (
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="pod-reason">What would help? (only David sees this)</label>
            <textarea id="pod-reason" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="For example: different time zone, or I'd like a quieter pod." />
          </div>
          <button className="btn btn-primary btn-small" disabled={busy}>{busy ? "Sending…" : "Send request"}</button>
          <button type="button" className="btn btn-text" onClick={() => setOpen(false)}>Cancel</button>
        </form>
      )}
    </div>
  );
}
