// My Pod: members choose to join a small pod (up to 4 people) in their cohort.
// Pods connect through a WhatsApp group: one member creates it and pastes the
// invite link, everyone else taps to join. Members can also allow one-to-one
// WhatsApp chats (their number is never shown in the app). They can leave,
// or ask David to change their pod.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getMyPod, joinPod, leavePod, getPodMembers, setPodPhone, getVisibleProfiles,
  addPodRequest, getMyOpenPodRequest, setPodGroupLink, POD_SIZE, POD_TYPES, podTypeLabel,
} from "../../lib/data.js";
import { effectiveStreak } from "../../lib/streaks.js";
import { whatsAppLink, cleanGroupLink } from "../../lib/phone.js";
import Avatar from "../Avatar.jsx";

export default function MyPod({ uid, profile, current, today }) {
  const cohortId = current.cohort.id;
  const [pod, setPod] = useState(undefined); // undefined = loading, null = not in a pod
  const [members, setMembers] = useState([]);
  const [streaks, setStreaks] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
    if (window.confirm("Leave your pod?")) run(() => leavePod(pod.id, uid));
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
        <h2>Join a small group</h2>
        <p className="muted small">Up to {POD_SIZE} people, with a WhatsApp group.</p>
        <fieldset className="question pod-types">
          <legend>Choose a pod</legend>
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
        {error && <p className="form-error">{error}</p>}
      </section>
    );
  }

  const me = members.find((m) => m.id === uid);
  const sharing = Boolean(me?.phone);

  return (
    <section className="card">
      <p className="card-label">My Pod · {pod.memberIds.length} of {POD_SIZE}</p>
      <h2>Your {podTypeLabel(pod.type).toLowerCase()}</h2>

      {/* The pod's WhatsApp group: the main way pods connect */}
      <PodGroupLink pod={pod} uid={uid} members={members} onSaved={load} />

      <ul className="people">
        {members.map((m) => (
          <li key={m.id}>
            <Avatar id={m.avatar} name={m.firstName} />
            <span className="person-name">
              {m.id === uid ? `${m.firstName} (you)` : m.firstName}
              {streaks[m.id] !== undefined && <span className="muted small">{streaks[m.id]} day streak</span>}
            </span>
            {m.phone && m.id !== uid && (
              <a className="btn btn-whatsapp btn-small wa-chat" href={whatsAppLink(m.phone)} target="_blank" rel="noreferrer"
                aria-label={`Message ${m.firstName} on WhatsApp`}>
                WhatsApp
              </a>
            )}
          </li>
        ))}
      </ul>
      {pod.memberIds.length < POD_SIZE && (
        <p className="muted small">
          More members will join.
        </p>
      )}

      {/* Optional one-to-one chats */}
      <div className="pod-section">
        <h3>Direct messages</h3>
        {!profile?.phone ? (
          <p className="muted small">
            <Link to="/account">Add your number</Link> to allow direct messages.
          </p>
        ) : (
          <label className="checkbox">
            <input
              type="checkbox"
              checked={sharing}
              disabled={busy}
              onChange={(e) => run(() => setPodPhone(pod.id, uid, e.target.checked ? profile.phone : null))}
            />
            <span>
              Let my pod message me on WhatsApp
            </span>
          </label>
        )}
      </div>

      <PodChangeRequest uid={uid} profile={profile} cohortId={cohortId} podId={pod.id} />

      <p className="center">
        <button className="link-btn" onClick={handleLeave} disabled={busy}>Leave pod</button>
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
    return <p className="notice notice-good small">Request sent to David.</p>;
  }

  return (
    <div className="pod-section">
      {!open ? (
        <button className="link-btn" onClick={() => setOpen(true)}>Ask to change pod</button>
      ) : (
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="pod-reason">Why? (only David sees this)</label>
            <textarea id="pod-reason" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Optional" />
          </div>
          <button className="btn btn-primary btn-small" disabled={busy}>{busy ? "Sending…" : "Send request"}</button>
          <button type="button" className="btn btn-text" onClick={() => setOpen(false)}>Cancel</button>
        </form>
      )}
    </div>
  );
}

// The pod's WhatsApp group. If nobody has added it yet, shows how to create
// one and a box to paste the invite link. Once added, everyone sees a Join button.
function PodGroupLink({ pod, uid, members, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [diy, setDiy] = useState(false); // member chose to set the group up themselves
  const setBy = pod.groupLinkSetBy === "admin" ? { id: "admin", firstName: "David" } : members.find((m) => m.id === pod.groupLinkSetBy);

  async function save(e) {
    e.preventDefault();
    const clean = cleanGroupLink(link);
    if (!clean) return setError("Not a WhatsApp group link.");
    setBusy(true);
    setError("");
    try {
      await setPodGroupLink(pod.id, clean, uid);
      setEditing(false);
      setLink("");
      await onSaved();
    } catch (err) {
      console.error(err);
      setError("Couldn't save the link. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("Remove this link?")) return;
    await setPodGroupLink(pod.id, null, uid).catch(console.error);
    await onSaved();
  }

  if (pod.whatsappGroupLink && !editing) {
    return (
      <div className="pod-group">
        <a className="btn btn-whatsapp" href={pod.whatsappGroupLink} target="_blank" rel="noreferrer">
          Join our WhatsApp group
        </a>
        <p className="muted small center">
          {setBy ? `Set up by ${setBy.id === uid ? "you" : setBy.firstName}. ` : ""}
          <button className="link-btn" onClick={() => setEditing(true)}>Change link</button>
          <button className="link-btn" onClick={remove}>Remove</button>
        </p>
      </div>
    );
  }

  // No link yet: David normally adds it. Members can set it up themselves if they want.
  if (!editing && !diy) {
    return (
      <div className="pod-group pod-group-setup">
        <h3>WhatsApp group coming soon</h3>
        <button className="link-btn" onClick={() => setDiy(true)}>Set it up yourself</button>
      </div>
    );
  }

  return (
    <div className="pod-group pod-group-setup">
      <h3>Add your pod's WhatsApp group</h3>
      <ol className="steps-list">
        <li>In WhatsApp: <strong>New group</strong></li>
        <li>Group info → <strong>Invite via link</strong> → <strong>Copy</strong></li>
        <li>Paste it here</li>
      </ol>
      <form className="note-form" onSubmit={save}>
        <input aria-label="WhatsApp group invite link" placeholder="https://chat.whatsapp.com/…" value={link} onChange={(e) => setLink(e.target.value)} />
        <button className="btn btn-primary btn-small" disabled={busy || !link.trim()}>Save</button>
      </form>
      <button className="btn btn-text" onClick={() => { setEditing(false); setDiy(false); }}>Cancel</button>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
