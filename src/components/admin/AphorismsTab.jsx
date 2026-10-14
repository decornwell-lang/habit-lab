// Admin → Aphorisms: review AI-drafted lines before any member can see them.
// Approve, edit or reject each pending draft. This works while `npm run dev` runs
// on the owner's computer (it edits the files in /data); approved lines go live
// when the change is pushed. See README → Aphorisms.
import { useEffect, useState } from "react";
import approvedLive from "../../../data/aphorisms-approved.json";
import { todayKey } from "../../lib/dates.js";

const LOW = 7; // warn when fewer approved lines than this are left

async function call(body) {
  const res = await fetch("/dev-api/aphorisms", body ? { method: "POST", body: JSON.stringify(body) } : undefined);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Review isn't available here.");
  return data;
}

export default function AphorismsTab() {
  const [state, setState] = useState(null);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // { id, text }

  useEffect(() => {
    call().then(setState).catch(() => setOffline(true));
  }, []);

  async function act(body) {
    setError("");
    try {
      setState(await call(body));
      setEditing(null);
    } catch (err) {
      setError(err.message);
    }
  }

  // On the live site: show what's scheduled, and how to review.
  if (offline) {
    const remaining = approvedLive.filter((a) => a.showOn >= todayKey()).length;
    return (
      <section>
        <h2>Review aphorisms</h2>
        <Counter remaining={remaining} />
        <p className="muted small">
          Reviewing runs on your computer: run <code>npm run draft-aphorisms</code>, then <code>npm run dev</code> and
          open this page at localhost:5173/admin. Approved lines go live when you push.
        </p>
      </section>
    );
  }
  if (!state) return <p className="muted">Loading…</p>;

  return (
    <section>
      <h2>Review aphorisms</h2>
      <Counter remaining={state.remaining} />
      {state.libraryTotal === 0 && state.remaining < LOW && (
        <p className="muted small">Your fallback library (data/aphorisms-library.json) is empty, so no line shows when approved ones run out.</p>
      )}
      {error && <p className="form-error">{error}</p>}

      <h3>Pending drafts ({state.pending.length})</h3>
      {state.pending.length === 0 && (
        <p className="muted small">None. Run <code>npm run draft-aphorisms</code> to draft more.</p>
      )}
      <ul className="aphorism-list">
        {state.pending.map((d) => (
          <li key={d.id}>
            {editing?.id === d.id ? (
              <div className="field">
                <textarea rows={3} value={editing.text} onChange={(e) => setEditing({ id: d.id, text: e.target.value })} />
                <p className="hint">{editing.text.trim().split(/\s+/).filter(Boolean).length} / 25 words</p>
              </div>
            ) : (
              <p className="aphorism-text">{d.text}</p>
            )}
            <p className="muted small">{d.theme} · drafted {d.created.slice(0, 10)}</p>
            <div className="toolbar">
              {editing?.id === d.id ? (
                <>
                  <button className="btn btn-primary btn-small" onClick={() => act({ action: "edit", id: d.id, text: editing.text })}>Save edit</button>
                  <button className="btn btn-text btn-small" onClick={() => setEditing(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <button className="btn btn-primary btn-small" onClick={() => act({ action: "approve", id: d.id })}>Approve</button>
                  <button className="btn btn-ghost btn-small" onClick={() => setEditing({ id: d.id, text: d.text })}>Edit</button>
                  <button className="btn btn-text btn-small" onClick={() => act({ action: "reject", id: d.id })}>Reject</button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Counter({ remaining }) {
  return (
    <>
      <p className="stat-line">
        <strong>{remaining}</strong> approved {remaining === 1 ? "line" : "lines"} left before the fallback library is used.
      </p>
      {remaining < LOW && <p className="notice">Fewer than {LOW} approved lines left. Draft and approve some more.</p>}
    </>
  );
}
