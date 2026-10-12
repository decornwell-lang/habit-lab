// Admin → Messages: write a message to all members or one cohort.
// It appears in the app straight away, and is sent as a push notification
// to every member who has turned notifications on.
import { useEffect, useState } from "react";
import { addNotice, getNotices } from "../../lib/data.js";
import { apiPost } from "../../lib/api.js";

export default function MessagesTab({ cohorts, users }) {
  const [form, setForm] = useState({ title: "", body: "", cohortId: "" });
  const [sent, setSent] = useState([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { ok, text }

  const withPush = users.filter((u) => u.fcmTokens?.length).length;
  const load = () => getNotices(30).then(setSent).catch(() => setSent([]));
  useEffect(() => {
    load();
  }, []);

  const cohortName = (id) => cohorts.find((c) => c.id === id)?.name || "Everyone";

  async function handleSend(e) {
    e.preventDefault();
    if (!form.title.trim()) return setResult({ ok: false, text: "Please add a title." });
    setBusy(true);
    setResult(null);
    try {
      const id = await addNotice({
        title: form.title.trim(),
        body: form.body.trim(),
        link: "/dashboard?tab=community",
        cohortId: form.cohortId || null,
      });
      try {
        const { sent: count } = await apiPost("/api/send-message", { noticeId: id });
        setResult({ ok: true, text: `Sent. It's in the app, and went to ${count} ${count === 1 ? "device" : "devices"} as a notification.` });
      } catch (err) {
        setResult({ ok: false, text: `Saved as an in-app message, but the notification wasn't sent: ${err.message}` });
      }
      setForm({ title: "", body: "", cohortId: form.cohortId });
      load();
    } catch (err) {
      console.error(err);
      setResult({ ok: false, text: "Couldn't save the message. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <form className="card" onSubmit={handleSend}>
        <h2>New message</h2>
        <p className="muted small">
          {withPush} {withPush === 1 ? "member has" : "members have"} notifications turned on. Everyone sees the message in
          the app.
        </p>
        <div className="field">
          <label htmlFor="msg-to">Send to</label>
          <select id="msg-to" value={form.cohortId} onChange={(e) => setForm({ ...form, cohortId: e.target.value })}>
            <option value="">All members</option>
            {cohorts.filter((c) => c.status !== "finished").map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="msg-title">Title</label>
          <input id="msg-title" maxLength={60} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Monday's session starts in an hour" />
        </div>
        <div className="field">
          <label htmlFor="msg-body">Message</label>
          <textarea id="msg-body" rows={3} maxLength={240} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Find a quiet spot and join from your dashboard." />
          <p className="hint">Keep it short: phones show about two lines.</p>
        </div>
        {result && <p className={result.ok ? "form-success" : "form-error"}>{result.text}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? "Sending…" : "Send message"}</button>
      </form>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Sent</th><th>To</th><th>Title</th><th>Message</th><th>Devices</th></tr></thead>
          <tbody>
            {sent.length === 0 && <tr><td colSpan={5} className="muted">No messages yet.</td></tr>}
            {sent.map((n) => (
              <tr key={n.id}>
                <td>{n.createdAt?.toDate?.().toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                <td>{cohortName(n.cohortId)}</td>
                <td>{n.title}</td>
                <td>{n.body}</td>
                <td>{n.pushSent ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
