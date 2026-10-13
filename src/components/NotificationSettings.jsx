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
      {status === "on" && <p className="done-badge">✓ Notifications on</p>}
      {status === "off" && (
        <>
          <h2>Get reminders</h2>
          <button className="btn btn-primary" onClick={turnOn} disabled={busy}>
            {busy ? "Turning on…" : "Turn on notifications"}
          </button>
        </>
      )}
      {status === "needs-install" && (
        <>
          <h2>Get reminders</h2>
          <p className="muted small">First add the app to your Home Screen:</p>
          <IosInstallSteps />
        </>
      )}
      {status === "blocked" && (
        <p className="muted small">
          Notifications are blocked. Allow them in your browser settings.
        </p>
      )}
      {status === "unsupported" && (
        <p className="muted small">Not supported on this browser.</p>
      )}
      {error && <p className="form-error">{error}</p>}
    </section>
  );
}
