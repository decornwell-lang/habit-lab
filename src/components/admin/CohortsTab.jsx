// Admin → Cohorts: create and edit cohorts.
import { useState } from "react";
import { saveCohort } from "../../lib/data.js";
import { HABIT_TYPES, habitLabel, formatPrice } from "../../lib/cohorts.js";
import { todayKey, formatDate } from "../../lib/dates.js";

const EMPTY = { name: "", habitType: "smoking", startDate: "", durationDays: 33, price: 0, currency: "gbp", status: "upcoming" };

// Two ready-made cohorts: the real first cohort, and a free one starting
// today so you can try every feature straight away.
const SAMPLES = [
  { name: "Non-Smoking Cohort, November 2026", habitType: "smoking", startDate: "2026-11-16", durationDays: 33, price: 99, currency: "gbp", status: "upcoming" },
  { name: "Test Cohort (free, starts today)", habitType: "smoking", startDate: todayKey(), durationDays: 33, price: 0, currency: "gbp", status: "active" },
];

export default function CohortsTab({ cohorts, reload }) {
  const [editingId, setEditingId] = useState(null); // null = closed, "new" = new cohort
  const [form, setForm] = useState(EMPTY);
  const [message, setMessage] = useState("");

  function edit(cohort) {
    setEditingId(cohort ? cohort.id : "new");
    setForm(cohort ? { ...EMPTY, ...cohort } : EMPTY);
    setMessage("");
  }

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function handleSave(e) {
    e.preventDefault();
    const data = {
      name: form.name.trim(),
      habitType: form.habitType,
      startDate: form.startDate,
      durationDays: Number(form.durationDays),
      price: Number(form.price),
      currency: form.currency.trim().toLowerCase() || "gbp",
      status: form.status,
    };
    if (!data.name || !data.startDate || !data.durationDays) return setMessage("Please fill in the name, start date and duration.");
    await saveCohort(editingId === "new" ? null : editingId, data);
    setEditingId(null);
    setMessage("Cohort saved.");
    await reload();
  }

  async function addSamples() {
    for (const s of SAMPLES) await saveCohort(null, s);
    setMessage("Sample cohorts added.");
    await reload();
  }

  return (
    <section>
      <div className="toolbar">
        <button className="btn btn-primary btn-small" onClick={() => edit(null)}>New cohort</button>
        {cohorts.length === 0 && <button className="btn btn-ghost btn-small" onClick={addSamples}>Add sample cohorts</button>}
      </div>
      {message && <p className="form-success">{message}</p>}

      {editingId && (
        <form className="card" onSubmit={handleSave}>
          <h2>{editingId === "new" ? "New cohort" : "Edit cohort"}</h2>
          <div className="field"><label>Name</label><input name="name" value={form.name} onChange={update} placeholder="Non-Smoking Cohort, November 2026" /></div>
          <div className="field-row">
            <div className="field">
              <label>Habit type</label>
              <select name="habitType" value={form.habitType} onChange={update}>
                {HABIT_TYPES.map((h) => <option key={h.id} value={h.id}>{h.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Status</label>
              <select name="status" value={form.status} onChange={update}>
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="finished">Finished</option>
              </select>
            </div>
          </div>
          <div className="field-row">
            <div className="field"><label>Start date</label><input type="date" name="startDate" value={form.startDate} onChange={update} /></div>
            <div className="field"><label>Duration (days)</label><input type="number" min="1" name="durationDays" value={form.durationDays} onChange={update} /></div>
          </div>
          <div className="field-row">
            <div className="field"><label>Price (0 = free)</label><input type="number" min="0" step="0.01" name="price" value={form.price} onChange={update} /></div>
            <div className="field"><label>Currency</label><input name="currency" value={form.currency} onChange={update} /></div>
          </div>
          <button className="btn btn-primary">Save cohort</button>
          <button type="button" className="btn btn-text" onClick={() => setEditingId(null)}>Cancel</button>
        </form>
      )}

      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Habit</th><th>Starts</th><th>Days</th><th>Price</th><th>Status</th><th>Members</th><th></th></tr></thead>
          <tbody>
            {cohorts.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{habitLabel(c.habitType)}</td>
                <td>{formatDate(c.startDate, { weekday: undefined })}</td>
                <td>{c.durationDays}</td>
                <td>{formatPrice(c)}</td>
                <td><span className={`tag tag-${c.status}`}>{c.status}</span></td>
                <td>{c.memberIds?.length || 0}</td>
                <td className="actions"><button className="link-btn" onClick={() => edit(c)}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
