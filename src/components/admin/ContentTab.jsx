// Admin → Content: Zoom link, next session, each week's meditation and PDF, the 3-Step
// Breathing Space recording (Breathe tab), and an explainer video for each screen.
import { useState } from "react";
import { saveContentSettings } from "../../lib/data.js";
import { weekPrompts, WEEKS_IN_PROGRAMME } from "../../lib/content.js";
import { EXPLAINERS } from "../../content/site.js";

const weekNumbers = Array.from({ length: WEEKS_IN_PROGRAMME }, (_, i) => i + 1);

export default function ContentTab({ settings, reload }) {
  const [form, setForm] = useState({
    zoomLink: settings.zoomLink || "",
    nextSessionAt: settings.nextSessionAt || "",
    currentWeek: settings.currentWeek || 1,
    breathingSpaceUrl: settings.breathingSpaceUrl || "",
    explainers: Object.fromEntries(EXPLAINERS.map((x) => [x.id, settings.explainers?.[x.id] || ""])),
    weeks: Object.fromEntries(weekNumbers.map((w) => [w, { title: "", meditationUrl: "", reflectionUrl: "", ...settings.weeks?.[w] }])),
  });
  const [message, setMessage] = useState("");

  const setWeek = (w, field, value) =>
    setForm((f) => ({ ...f, weeks: { ...f.weeks, [w]: { ...f.weeks[w], [field]: value } } }));

  async function handleSave(e) {
    e.preventDefault();
    await saveContentSettings({ ...form, currentWeek: Number(form.currentWeek) || 1 });
    setMessage("Content saved. Members will see it next time they open their dashboard.");
    await reload();
  }

  return (
    <form onSubmit={handleSave}>
      <section className="card">
        <h2>Monday live session</h2>
        <div className="field">
          <label>Zoom link</label>
          <input value={form.zoomLink} onChange={(e) => setForm({ ...form, zoomLink: e.target.value })} placeholder="https://zoom.us/j/…" />
        </div>
        <div className="field">
          <label>Next session date and time</label>
          <input type="datetime-local" value={form.nextSessionAt} onChange={(e) => setForm({ ...form, nextSessionAt: e.target.value })} />
        </div>
      </section>

      <section className="card">
        <h2>3-Step Breathing Space</h2>
        <div className="field">
          <label>Recording link (Breathe tab)</label>
          <input value={form.breathingSpaceUrl} onChange={(e) => setForm({ ...form, breathingSpaceUrl: e.target.value })} placeholder="Leave empty to use David's recording in the app" />
        </div>
      </section>

      <section className="card">
        <h2>Explainer videos</h2>
        <p className="muted small">
          A link for a screen adds a small video icon there; members tap it to watch. YouTube, Vimeo, Google Drive or a
          video file. Leave a box empty for no icon.
        </p>
        {EXPLAINERS.map((x) => (
          <div className="field" key={x.id}>
            <label htmlFor={`explainer-${x.id}`}>{x.label}</label>
            <input id={`explainer-${x.id}`} value={form.explainers[x.id]} placeholder="https://www.youtube.com/watch?v=…"
              onChange={(e) => setForm({ ...form, explainers: { ...form.explainers, [x.id]: e.target.value.trim() } })} />
          </div>
        ))}
      </section>

      <section className="card">
        <h2>Weekly meditations and reflections</h2>
        <p className="muted small">
          Paste a link for each week: YouTube, Vimeo, Google Drive or a direct video file for the meditation, and a link to
          the PDF for the reflection. Leave a box empty to use the default. Members in a cohort see their cohort's week.
          Everyone else sees the week chosen here:
        </p>
        <div className="field">
          <label>Week shown to members not in an active cohort</label>
          <select value={form.currentWeek} onChange={(e) => setForm({ ...form, currentWeek: e.target.value })}>
            {weekNumbers.map((w) => <option key={w} value={w}>Week {w}: {weekPrompts("smoking", w).theme}</option>)}
          </select>
        </div>

        {weekNumbers.map((w) => (
          <fieldset key={w} className="week-box">
            <legend>Week {w}: {weekPrompts("smoking", w).theme}</legend>
            <div className="field">
              <label>Title shown to members (optional)</label>
              <input value={form.weeks[w].title} onChange={(e) => setWeek(w, "title", e.target.value)} placeholder={`Week ${w}: ${weekPrompts("smoking", w).theme}`} />
            </div>
            <div className="field">
              <label>Meditation video link</label>
              <input value={form.weeks[w].meditationUrl} onChange={(e) => setWeek(w, "meditationUrl", e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
            </div>
            <div className="field">
              <label>Reflection PDF link</label>
              <input value={form.weeks[w].reflectionUrl} onChange={(e) => setWeek(w, "reflectionUrl", e.target.value)} placeholder={`Default: /assets/reflections/week-${w}.pdf`} />
            </div>
          </fieldset>
        ))}
      </section>

      {message && <p className="form-success">{message}</p>}
      <button className="btn btn-primary">Save content</button>
    </form>
  );
}
