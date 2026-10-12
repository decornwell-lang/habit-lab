// NotificationSettings: the "Turn on notifications" button, with help for
// iPhones (which need the app on the Home Screen first).
// `compact` hides it completely once notifications are on (used on the dashboard).
import { useEffect, useState } from "react";
import { pushStatus, enablePush, saveToken } from "../lib/push.js";
import { IosInstallSteps } from "./InstallApp.jsx";

export default function NotificationSettings({ uid, compact = false }) {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    pushStatus().then((s) => {
      setStatus(s);
      // Keep this device's token fresh if notifications are already on.
      if (s === "on") saveToken(uid).catch(console.error);
    });
  }, [uid]);

  async function turnOn() {
    setBusy(true);
    setError("");
    try {
      setStatus(await enablePush(uid));
    } catch (err) {
      console.error(err);
      setError("We couldn't turn on notifications. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!status || status === "not-configured") return null;
  if (compact && ["on", "unsupported", "blocked"].includes(status)) return null;

  return (
    <section className="card">
      <p className="card-label">Notifications</p>
      {status === "on" && <p className="done-badge">✓ Notifications are on for this device.</p>}
      {status === "off" && (
        <>
          <h2>Get messages from David</h2>
          <p className="muted small">Reminders and news about your cohort, straight to this device.</p>
          <button className="btn btn-primary" onClick={turnOn} disabled={busy}>
            {busy ? "Turning on…" : "Turn on notifications"}
          </button>
        </>
      )}
      {status === "needs-install" && (
        <>
          <h2>Get messages from David</h2>
          <p className="muted small">On iPhone, notifications work once The Habit Lab is on your Home Screen:</p>
          <IosInstallSteps />
          <p className="muted small">
            Then open The Habit Lab from your Home Screen, log in, and tap <strong>Turn on notifications</strong> in My account.
          </p>
        </>
      )}
      {status === "blocked" && (
        <p className="muted small">
          Notifications are blocked for this site. To allow them, open your browser's settings for this site and set
          Notifications to Allow, then reload.
        </p>
      )}
      {status === "unsupported" && (
        <p className="muted small">This browser can't receive notifications. Messages will still appear in the app.</p>
      )}
      {error && <p className="form-error">{error}</p>}
    </section>
  );
}
