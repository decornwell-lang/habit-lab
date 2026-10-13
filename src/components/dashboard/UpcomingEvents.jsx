// Upcoming events: the next live session, the member's cohort start dates,
// and a pointer to retreats and other offerings. Sorted by date.
import { Link } from "react-router-dom";
import { formatDate, formatDateTime, parseKey, todayKey } from "../../lib/dates.js";

export default function UpcomingEvents({ settings, cohorts, memberships, onOpenTab }) {
  const now = new Date();
  const joined = new Set(memberships.map((m) => m.cohortId));
  const events = [];

  if (settings.nextSessionAt && new Date(settings.nextSessionAt) > now) {
    events.push({
      when: new Date(settings.nextSessionAt),
      label: formatDateTime(settings.nextSessionAt),
      title: "Live session",
      detail: "Zoom",
      action: { text: "Details", onClick: () => onOpenTab("week") },
    });
  }

  for (const c of cohorts) {
    if (c.status === "finished" || c.startDate < todayKey()) continue;
    events.push({
      when: parseKey(c.startDate),
      label: formatDate(c.startDate),
      title: joined.has(c.id) ? `Your cohort begins: ${c.name}` : `${c.name} begins`,
      detail: `${c.durationDays} days`,
    });
  }

  events.sort((a, b) => a.when - b.when);

  return (
    <section className="card">
      <p className="card-label">Upcoming</p>
      {events.length === 0 ? (
        <p className="muted">Nothing yet.</p>
      ) : (
        <ul className="event-list">
          {events.map((e) => (
            <li key={e.title + e.label}>
              <p className="event-date">{e.label}</p>
              <h3>{e.title}</h3>
              {e.detail && <p className="muted small">{e.detail}</p>}
              {e.action && <button className="link-btn" onClick={e.action.onClick}>{e.action.text}</button>}
            </li>
          ))}
        </ul>
      )}
      <p className="small">
        <Link to="/offerings" className="text-link">Retreats →</Link>
      </p>
    </section>
  );
}
