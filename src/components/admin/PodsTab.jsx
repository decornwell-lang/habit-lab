// Admin → Pods: change requests from members, and every pod by cohort.
// Create the pods for a cohort in advance (with WhatsApp group links you made),
// set each pod's type, and move anyone to another pod.
import { useEffect, useState } from "react";
import { cleanGroupLink } from "../../lib/phone.js";
import {
  getAllPods, getPodMembers, getPodRequests, resolvePodRequest, adminMovePodMember, adminCreatePods, adminUpdatePod, adminAssignGroupLinks, sortPods, POD_SIZE,
  POD_TYPES, podTypeLabel,
} from "../../lib/data.js";

export default function PodsTab({ cohorts, users }) {
  const [pods, setPods] = useState(null); // [{ ...pod, cards: [...] }]
  const [requests, setRequests] = useState([]);
  const [moving, setMoving] = useState(null); // { uid, fromPodId }
  const [message, setMessage] = useState("");

  const nameOf = (uid) => {
    const u = users.find((x) => x.id === uid);
    return u ? `${u.firstName || ""} ${u.surname || ""}`.trim() : "Unknown member";
  };
  const cohortName = (id) => cohorts.find((c) => c.id === id)?.name || "";

  async function load() {
    const [all, reqs] = await Promise.all([getAllPods(), getPodRequests()]);
    const withCards = await Promise.all(all.map(async (p) => ({ ...p, cards: await getPodMembers(p.id).catch(() => []) })));
    setPods(sortPods(withCards));
    setRequests(reqs);
  }

  useEffect(() => {
    load().catch((err) => {
      console.error(err);
      setPods([]);
    });
  }, []);

  async function move(toPodId) {
    try {
      await adminMovePodMember({ uid: moving.uid, fromPodId: moving.fromPodId, toPodId: toPodId || null });
      setMessage(toPodId ? "Moved." : "Removed from the pod.");
      setMoving(null);
      await load();
    } catch (err) {
      console.error(err);
      setMessage("Couldn't move this member. Check the latest security rules are published.");
    }
  }

  async function createMany(cohortId, count) {
    await adminCreatePods(cohortId, count);
    setMessage(count === 1 ? "Pod added." : `${count} pods created. Now set each pod's type and paste its WhatsApp group link.`);
    await load();
  }

  if (!pods) return <p className="muted">Loading…</p>;

  const open = requests.filter((r) => r.status === "open");
  const podLabel = (p, i) => `Pod ${p.number ?? i + 1} · ${podTypeLabel(p.type)} (${p.memberIds.length}/${POD_SIZE})`;

  return (
    <section>
      <div className="card">
        <h2>Requests to change pod</h2>
        {open.length === 0 ? (
          <p className="muted">No open requests.</p>
        ) : (
          <ul className="plain-list">
            {open.map((r) => (
              <li key={r.id} className="flag">
                <strong>{nameOf(r.uid)}</strong> · {cohortName(r.cohortId)}
                {r.createdAt?.toDate && <span className="muted small"> · {r.createdAt.toDate().toLocaleDateString("en-GB")}</span>}
                {r.reason && <p className="small">“{r.reason}”</p>}
                <button className="link-btn" onClick={() => setMoving({ uid: r.uid, fromPodId: r.podId })}>Move to another pod</button>
                <button className="link-btn" onClick={async () => { await resolvePodRequest(r.id); load(); }}>Mark as handled</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {message && <p className="form-success">{message}</p>}

      {moving && (
        <div className="card card-accent">
          <h2>Move {nameOf(moving.uid)}</h2>
          {(() => {
            const from = pods.find((p) => p.id === moving.fromPodId);
            const options = pods.filter((p) => p.cohortId === from?.cohortId && p.id !== moving.fromPodId);
            const cohortPods = pods.filter((p) => p.cohortId === from?.cohortId);
            return (
              <>
                {options.length === 0 && <p className="muted small">There's no other pod in this cohort yet. Start a new pod below, then move them.</p>}
                <div className="share-links" style={{ justifyContent: "flex-start" }}>
                  {options.map((p) => (
                    <button key={p.id} className="btn btn-ghost btn-small" onClick={() => move(p.id)}>
                      To {podLabel(p, cohortPods.indexOf(p))}
                    </button>
                  ))}
                  <button className="btn btn-ghost btn-small" onClick={() => move(null)}>Remove from pod</button>
                  <button className="btn btn-text" onClick={() => setMoving(null)}>Cancel</button>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {cohorts.filter((c) => c.status !== "finished").map((c) => {
        const cohortPods = pods.filter((p) => p.cohortId === c.id);
        const missing = cohortPods.filter((p) => !p.whatsappGroupLink).length;
        return (
          <div key={c.id} className="card">
            <h2>{c.name}</h2>
            <p className="muted small">
              {cohortPods.length} {cohortPods.length === 1 ? "pod" : "pods"}
              {missing > 0 && <span className="tag tag-upcoming">{missing} need a WhatsApp group</span>}
            </p>
            {cohortPods.length === 0 && (
              <div className="pod-setup-help">
                <p className="small">
                  <strong>Setting up pods for this cohort:</strong> create the WhatsApp groups first (e.g. “Habit Lab ·
                  Pod 1” to “Pod 8”), then create the pods here and paste each group's invite link. Members are placed
                  in these pods first, oldest first.
                </p>
              </div>
            )}
            <BulkLinks cohortId={c.id} onDone={(text) => { setMessage(text); load(); }} />
            {cohortPods.map((p, i) => (
              <AdminPodRow key={p.id} pod={p} index={i} nameOf={nameOf} onMove={(uid) => setMoving({ uid, fromPodId: p.id })} onSaved={load} />
            ))}
            <div className="share-links" style={{ justifyContent: "flex-start" }}>
              <button className="btn btn-primary btn-small" onClick={() => createMany(c.id, 8)}>Create 8 pods</button>
              <button className="btn btn-ghost btn-small" onClick={() => createMany(c.id, 1)}>Add 1 pod</button>
            </div>
          </div>
        );
      })}
    </section>
  );
}

// One pod in the admin list: type, WhatsApp group link, and members.
function AdminPodRow({ pod, index, nameOf, onMove, onSaved }) {
  const [link, setLink] = useState(pod.whatsappGroupLink || "");
  const [note, setNote] = useState("");

  async function saveType(type) {
    await adminUpdatePod(pod.id, { type });
    onSaved();
  }

  async function saveLink(e) {
    e.preventDefault();
    if (!link.trim()) {
      await adminUpdatePod(pod.id, { whatsappGroupLink: null, groupLinkSetBy: null });
      setNote("Link removed.");
      return onSaved();
    }
    const clean = cleanGroupLink(link);
    if (!clean) return setNote("That isn't a WhatsApp group link (https://chat.whatsapp.com/…).");
    await adminUpdatePod(pod.id, { whatsappGroupLink: clean, groupLinkSetBy: "admin" });
    setLink(clean);
    setNote("Saved ✓");
    onSaved();
  }

  return (
    <div className={`admin-pod ${pod.whatsappGroupLink ? "" : "needs-link"}`}>
      <div className="admin-pod-head">
        <h3>Pod {pod.number ?? index + 1} <span className="muted small">({pod.memberIds.length}/{POD_SIZE})</span></h3>
        <select value={pod.type || "mixed"} onChange={(e) => saveType(e.target.value)} aria-label="Pod type">
          {POD_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>
      <form className="note-form" onSubmit={saveLink}>
        <input aria-label="WhatsApp group invite link" placeholder="Paste WhatsApp group link: https://chat.whatsapp.com/…" value={link} onChange={(e) => { setLink(e.target.value); setNote(""); }} />
        <button className="btn btn-primary btn-small">Save</button>
      </form>
      {note && <p className="small muted">{note}</p>}
      {pod.memberIds.length === 0 ? (
        <p className="muted small">No members yet</p>
      ) : (
        <ul className="plain-list">
          {pod.memberIds.map((uid) => (
            <li key={uid}>
              {nameOf(uid)}
              <button className="link-btn" onClick={() => onMove(uid)}>Move</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Paste several WhatsApp group links at once (one per line). Each goes to a pod
// without a link; new pods are created for any extra links.
function BulkLinks({ cohortId, onDone }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [type, setType] = useState("mixed");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    const lines = text.split(/\s+/).filter(Boolean);
    const links = lines.map(cleanGroupLink);
    const bad = lines.filter((_, i) => !links[i]);
    if (!lines.length) return setError("Paste at least one link.");
    if (bad.length) return setError(`These aren't WhatsApp group links: ${bad.join(", ")}`);
    const unique = [...new Set(links)];
    const { assigned, created, renumbered } = await adminAssignGroupLinks(cohortId, unique, type);
    setText("");
    setOpen(false);
    const parts = [];
    if (renumbered) parts.push(`${renumbered} already linked (numbered to match your list)`);
    if (assigned) parts.push(`${assigned} added to existing pods`);
    if (created) parts.push(`${created} new ${created === 1 ? "pod" : "pods"} created`);
    onDone(`${unique.length} links: ${parts.join(", ")}.`);
  }

  if (!open) {
    return <button className="btn btn-ghost btn-small bulk-open" onClick={() => setOpen(true)}>Paste all group links at once</button>;
  }

  return (
    <form className="bulk-links" onSubmit={submit}>
      <div className="field">
        <label>WhatsApp group links, one per line</label>
        <textarea rows={6} value={text} onChange={(e) => { setText(e.target.value); setError(""); }}
          placeholder={"https://chat.whatsapp.com/…\nhttps://chat.whatsapp.com/…"} />
        <p className="hint">Paste them in order (Pod 1 first). Links go to pods without one; extra links create new pods. Pasting links that are already in use just renumbers those pods to match.</p>
      </div>
      <div className="field">
        <label>Type for any new pods</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {POD_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>
      {error && <p className="form-error">{error}</p>}
      <button className="btn btn-primary btn-small">Add links</button>
      <button type="button" className="btn btn-text" onClick={() => setOpen(false)}>Cancel</button>
    </form>
  );
}
