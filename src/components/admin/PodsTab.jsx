// Admin → Pods: change requests from members, and every pod by cohort.
// Move anyone to another pod (or out of their pod), or start a new pod.
import { useEffect, useState } from "react";
import {
  getAllPods, getPodMembers, getPodRequests, resolvePodRequest, adminMovePodMember, adminCreatePod, POD_SIZE,
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
    withCards.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    setPods(withCards);
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

  async function newPod(cohortId, type) {
    await adminCreatePod(cohortId, type);
    await load();
  }

  if (!pods) return <p className="muted">Loading…</p>;

  const open = requests.filter((r) => r.status === "open");
  const podLabel = (p, i) => `Pod ${i + 1} · ${podTypeLabel(p.type)} (${p.memberIds.length}/${POD_SIZE})`;

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
        return (
          <div key={c.id} className="card">
            <h2>{c.name}</h2>
            {cohortPods.length === 0 && <p className="muted small">No pods yet. Members create them when they tap “Join a pod”.</p>}
            {cohortPods.map((p, i) => (
              <div key={p.id} className="admin-pod">
                <h3>{podLabel(p, i)}</h3>
                <p className="muted small">
                  {p.whatsappGroupLink ? <a href={p.whatsappGroupLink} target="_blank" rel="noreferrer">WhatsApp group linked</a> : "No WhatsApp group yet"}
                </p>
                {p.memberIds.length === 0 && <p className="muted small">Empty</p>}
                <ul className="plain-list">
                  {p.memberIds.map((uid) => {
                    const card = p.cards.find((x) => x.id === uid);
                    return (
                      <li key={uid}>
                        {nameOf(uid)}
                        {card?.phone && <span className="muted small"> · sharing {card.phone}</span>}
                        <button className="link-btn" onClick={() => setMoving({ uid, fromPodId: p.id })}>Move</button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            <div className="share-links" style={{ justifyContent: "flex-start" }}>
              {POD_TYPES.map((t) => (
                <button key={t.id} className="btn btn-ghost btn-small" onClick={() => newPod(c.id, t.id)}>New {t.label.toLowerCase()}</button>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
