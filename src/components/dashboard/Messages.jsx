// Messages from David: the latest messages sent from Admin → Messages,
// shown at the top of the dashboard for 14 days.
import { useEffect, useState } from "react";
import { getNotices } from "../../lib/data.js";

const SHOW_FOR_DAYS = 14;

export default function Messages({ cohortIds }) {
  const [notices, setNotices] = useState([]);
  const key = cohortIds.join(",");

  useEffect(() => {
    const cutoff = Date.now() - SHOW_FOR_DAYS * 86400000;
    getNotices()
      .then((all) =>
        setNotices(
          all
            .filter((n) => !n.cohortId || key.split(",").includes(n.cohortId))
            .filter((n) => (n.createdAt?.toMillis?.() || Date.now()) > cutoff)
            .slice(0, 3)
        )
      )
      .catch(() => setNotices([]));
  }, [key]);

  if (notices.length === 0) return null;

  return (
    <section className="card card-message">
      <p className="card-label">Messages from David</p>
      {notices.map((n) => (
        <div key={n.id} className="message">
          <h3>{n.title}</h3>
          {n.body && <p>{n.body}</p>}
          <p className="muted small">
            {n.createdAt?.toDate?.().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
          </p>
        </div>
      ))}
    </section>
  );
}
