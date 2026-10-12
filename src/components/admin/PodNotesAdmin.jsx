// Admin → Messages → Pod notes: everything members have sent their pods,
// newest first, with a Remove button for anything that isn't right.
import { useEffect, useState } from "react";
import { getAllPodNotes, deletePodNote } from "../../lib/data.js";

export default function PodNotesAdmin({ cohorts }) {
  const [notes, setNotes] = useState(null);
  const load = () => getAllPodNotes().then(setNotes).catch(() => setNotes([]));
  useEffect(() => {
    load();
  }, []);

  const cohortName = (id) => cohorts.find((c) => c.id === id)?.name || "";

  async function remove(id) {
    if (!window.confirm("Remove this note? Members will no longer see it.")) return;
    await deletePodNote(id);
    load();
  }

  return (
    <section>
      <h2>Pod notes</h2>
      <p className="muted small">Short notes members send to their pods. Remove anything that isn't supportive.</p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Sent</th><th>From</th><th>Cohort</th><th>Note</th><th></th></tr></thead>
          <tbody>
            {notes === null && <tr><td colSpan={5} className="muted">Loading…</td></tr>}
            {notes?.length === 0 && <tr><td colSpan={5} className="muted">No notes yet.</td></tr>}
            {notes?.map((n) => (
              <tr key={n.id}>
                <td>{n.createdAt?.toDate?.().toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                <td>{n.firstName}</td>
                <td>{cohortName(n.cohortId)}</td>
                <td>{n.text}</td>
                <td className="actions"><button className="link-btn" onClick={() => remove(n.id)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
