// Admin → Cohorts: create and edit cohorts. Two views: current (upcoming, active and
// finished) and Archived. Archiving only tidies this list and hides the cohort from
// members' Upcoming tab; members keep everything (their days, streaks and access).
import { useEffect, useState } from "react";
import { saveCohort, syncPublicCohorts } from "../../lib/data.js";
import { HABIT_TYPES, habitLabel, formatPrice } from "../../lib/cohorts.js";
import { cleanGroupLink } from "../../lib/phone.js";
import { todayKey, formatDate } from "../../lib/dates.js";

// Prices are in euros, VAT included.
// capacity: the number of places (empty = no limit).
const EMPTY = { name: "", habitType: "smoking", startDate: "", durationDays: 33, price: 99, capacity: "", status: "upcoming", whatsappGroupLink: "" };

// Two ready-made cohorts: the real first cohort, and a free one starting
// today so you can try every feature straight away.
const SAMPLES = [
  { name: "Non-Smoking Cohort, November 2026", habitType: "smoking", startDate: "2026-11-16", durationDays: 33, price: 99, status: "upcoming" },
  { name: "Test Cohort (free, starts today)", habitType: "smoking", startDate: todayKey(), durationDays: 33, price: 0, status: "active" },
];

export default function CohortsTab({ cohorts, reload }) {
  const [editingId, setEditingId] = useState(null); // null = closed, "new" = new cohort
  const [form, setForm] = useState(EMPTY);
  const [message, setMessage] = useState("");
  const [view, setView] = useState("current"); // "current" or "archived"
  // Keep the public copies (the home page's list) in step with the cohorts.
  useEffect(() => {
    syncPublicCohorts(cohorts).catch(console.error);
  }, [cohorts]);
  const archived = cohorts.filter((c) => c.archived);
  const current = cohorts.filter((c) => !c.archived);
  const shown = view === "archived" ? archived : current;

  async function setArchived(cohort, value) {
    await saveCohort(cohort.id, { archived: value });
    setMessage(value ? `${cohort.name} archived.` : `${cohort.name} is back in the current list.`);
    await reload();
  }

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
      capacity: Number(form.capacity) > 0 ? Number(form.capacity) : null,
      currency: "eur",
      status: form.status,
      whatsappGroupLink: cleanGroupLink(form.whatsappGroupLink || "") || null,
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

      <div className="segmented view-switch" role="tablist" aria-label="Which cohorts">
        <button type="button" role="tab" aria-selected={view === "current"} className={view === "current" ? "selected" : ""} onClick={() => setView("current")}>
          Upcoming &amp; active ({current.length})
        </button>
        <button type="button" role="tab" aria-selected={view === "archived"} className={view === "archived" ? "selected" : ""} onClick={() => setView("archived")}>
          Archived ({archived.length})
        </button>
      </div>

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
            <div className="field"><label>Price in € incl. VAT (0 = free)</label><input type="number" min="0" step="0.01" name="price" value={form.price} onChange={update} /></div>
            <div className="field"><label>Places (empty = no limit)</label><input type="number" min="1" name="capacity" value={form.capacity ?? ""} onChange={update} /></div>
          </div>
          <div className="field">
            <label>WhatsApp group invite link</label>
            <input name="whatsappGroupLink" value={form.whatsappGroupLink || ""} onChange={update} placeholder="https://chat.whatsapp.com/…" />
          </div>
          <button className="btn btn-primary">Save cohort</button>
          <button type="button" className="btn btn-text" onClick={() => setEditingId(null)}>Cancel</button>
        </form>
      )}

      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Habit</th><th>Starts</th><th>Days</th><th>Price</th><th>Status</th><th>Members</th><th></th></tr></thead>
          <tbody>
            {shown.length === 0 && (
              <tr><td colSpan={8} className="muted">{view === "archived" ? "No archived cohorts." : "No cohorts."}</td></tr>
            )}
            {shown.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{habitLabel(c.habitType)}</td>
                <td>{formatDate(c.startDate, { weekday: undefined })}</td>
                <td>{c.durationDays}</td>
                <td>{formatPrice(c)}</td>
                <td><span className={`tag tag-${c.status}`}>{c.status}</span></td>
                <td>{c.memberIds?.length || 0}{c.capacity ? ` / ${c.capacity}` : ""}</td>
                <td className="actions">
                  <button className="link-btn" onClick={() => edit(c)}>Edit</button>
                  <button className="link-btn" onClick={() => setArchived(c, !c.archived)}>{c.archived ? "Unarchive" : "Archive"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
