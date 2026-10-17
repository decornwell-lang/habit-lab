// Admin → Practices: the practice library (Practices → Library). Edit each practice's title,
// length, description, audio link (an .mp3 or similar; empty shows "Coming soon"), picture
// link and whether it's published. Saved to the database (practices/{id}).
import { useEffect, useState } from "react";
import { getPractices, savePractice } from "../../lib/data.js";
import { DEFAULT_PRACTICES } from "../../content/practices.js";
import { PRACTICE_LENGTHS } from "../../lib/mindful.js";

export default function PracticesAdminTab() {
  const [list, setList] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getPractices().catch(() => []).then((saved) =>
      setList(DEFAULT_PRACTICES.map((p) => ({ ...p, ...saved.find((x) => x.id === p.id) })).concat(saved.filter((x) => !DEFAULT_PRACTICES.some((p) => p.id === x.id))))
    );
  }, []);

  const set = (id, key, value) => setList(list.map((p) => (p.id === id ? { ...p, [key]: value } : p)));
  async function save(p) {
    const { id, ...data } = p;
    await savePractice(id, { ...data, audioUrl: data.audioUrl?.trim() || null, thumbnailUrl: data.thumbnailUrl?.trim() || null, durationMinutes: Number(data.durationMinutes) });
    setMessage(`"${p.title}" saved.`);
  }

  if (!list) return <section className="card"><p className="muted">Loading…</p></section>;
  return (
    <section className="card">
      <h2>Practice library</h2>
      {message && <p className="form-success">{message}</p>}
      {list.map((p) => (
        <details key={p.id} className="week-admin">
          <summary>{p.durationMinutes} min · {p.title}{p.audioUrl ? " · audio ✓" : " · coming soon"}{p.published === false ? " · hidden" : ""}</summary>
          <div className="field"><label>Title</label><input value={p.title} onChange={(e) => set(p.id, "title", e.target.value)} /></div>
          <div className="field">
            <label>Length</label>
            <select value={p.durationMinutes} onChange={(e) => set(p.id, "durationMinutes", Number(e.target.value))}>
              {PRACTICE_LENGTHS.map((m) => <option key={m} value={m}>{m} minutes</option>)}
            </select>
          </div>
          <div className="field"><label>Description</label><input value={p.description || ""} onChange={(e) => set(p.id, "description", e.target.value)} /></div>
          <div className="field"><label>Audio link (.mp3)</label><input value={p.audioUrl || ""} placeholder="Empty: shows Coming soon" onChange={(e) => set(p.id, "audioUrl", e.target.value)} /></div>
          <div className="field"><label>Picture link</label><input value={p.thumbnailUrl || ""} placeholder="Empty: David's photo" onChange={(e) => set(p.id, "thumbnailUrl", e.target.value)} /></div>
          <label className="checkbox"><input type="checkbox" checked={p.published !== false} onChange={(e) => set(p.id, "published", e.target.checked)} /> Published</label>
          <button type="button" className="btn btn-primary" onClick={() => save(p)}>Save</button>
        </details>
      ))}
    </section>
  );
}
