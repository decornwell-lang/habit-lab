// 4. Monday Live Session: date, time and a button that opens the Zoom link.
// Both are set by the owner in Admin → Content.
import { formatDateTime } from "../../lib/dates.js";

export default function LiveSession({ settings }) {
  const when = formatDateTime(settings.nextSessionAt);
  return (
    <section className="card">
      <p className="card-label">Monday Live Session</p>
      <h2>{when || "Date to be confirmed"}</h2>
      <p className="muted small">One hour together on Zoom, to share what came up during the week.</p>
      {settings.zoomLink ? (
        <a className="btn btn-primary" href={settings.zoomLink} target="_blank" rel="noreferrer">Join on Zoom</a>
      ) : (
        <p className="muted small">The Zoom link will appear here before the session.</p>
      )}
    </section>
  );
}
