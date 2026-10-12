// Pod encouragement notes: short, kind messages between pod members.
// Not a chat: one-tap notes or a short line (140 characters), shown for 7 days.
import { useEffect, useState } from "react";
import { getPodNotes, addPodNote, deletePodNote } from "../../lib/data.js";
import Avatar from "../Avatar.jsx";

// One-tap notes. Change or add to these freely.
const QUICK_NOTES = ["🌿 Keep going", "🙏 Thinking of you today", "🌊 Ride the wave", "✨ Proud of us"];
const MAX_LENGTH = 140;
const SHOW_FOR_DAYS = 7;

export default function PodNotes({ uid, profile, cohortId, podIds }) {
  const [notes, setNotes] = useState(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const podKey = podIds.join(",");

  async function load() {
    try {
      const cutoff = Date.now() / 1000 - SHOW_FOR_DAYS * 86400;
      const all = await getPodNotes(cohortId);
      setNotes(all.filter((n) => podKey.split(",").includes(n.uid) && (n.createdAt?.seconds || Infinity) > cutoff));
    } catch (err) {
      console.error(err);
      setNotes([]);
    }
  }

  useEffect(() => {
    load();
  }, [cohortId, podKey]); // eslint-disable-line react-hooks/exhaustive-deps

  async function send(message) {
    const clean = message.trim().slice(0, MAX_LENGTH);
    if (!clean) return;
    setBusy(true);
    setError("");
    try {
      await addPodNote({ cohortId, uid, firstName: profile?.firstName || "A pod member", avatar: profile?.avatar || null, text: clean });
      setText("");
      await load();
    } catch (err) {
      console.error(err);
      setError("Your note couldn't be sent. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    await deletePodNote(id).catch(console.error);
    load();
  }

  return (
    <div className="pod-notes">
      <h3>Notes from your pod</h3>
      {notes && notes.length === 0 && <p className="muted small">No notes yet this week. Be the first to send one.</p>}
      {notes?.length > 0 && (
        <ul className="note-list">
          {notes.map((n) => (
            <li key={n.id}>
              <Avatar id={n.avatar} name={n.firstName} size={34} />
              <div>
                <p className="note-text">{n.text}</p>
                <p className="muted small">
                  {n.uid === uid ? "You" : n.firstName}
                  {n.uid === uid && (
                    <button className="link-btn note-remove" onClick={() => remove(n.id)}>Remove</button>
                  )}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="quick-notes">
        {QUICK_NOTES.map((q) => (
          <button key={q} type="button" className="chip" disabled={busy} onClick={() => send(q)}>{q}</button>
        ))}
      </div>
      <form
        className="note-form"
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
      >
        <input
          aria-label="Write a note to your pod"
          placeholder="Or write a short note…"
          maxLength={MAX_LENGTH}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn btn-primary btn-small" disabled={busy || !text.trim()}>Send</button>
      </form>
      <p className="muted small">Your first name and avatar are shown with your note. Only your pod can see it.</p>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
