// Live session (Practices tab): every Monday at 18:00 CET (Europe/Madrid), shown with the
// next one in the member's own time zone, and a button that opens the Zoom link.
// The Zoom link, and an optional one-off date, are set in Admin → Content.
import { nextWeeklySession } from "../../lib/dates.js";

const SESSION = { weekday: 1, hour: 18, timeZone: "Europe/Madrid" }; // every Monday, 18:00 CET

export default function LiveSession({ settings }) {
  const oneOff = settings.nextSessionAt ? new Date(settings.nextSessionAt) : null;
  const next = oneOff && oneOff > new Date() ? oneOff : nextWeeklySession(SESSION);
  const day = next?.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const time = next?.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <section className="card">
      <p className="card-label">Live session</p>
      <h2>Every Monday at 18:00 CET</h2>
      {next && <p className="live-next">Next: <strong>{day}, {time}</strong> <span className="muted small">(your time)</span></p>}
      {settings.zoomLink ? (
        <a className="btn btn-primary" href={settings.zoomLink} target="_blank" rel="noreferrer">Join on Zoom</a>
      ) : (
        <p className="muted small">Link coming soon.</p>
      )}
    </section>
  );
}
