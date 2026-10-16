// Upcoming tab: cohorts that haven't started yet, each in its own tile with a "Join" button.
// Free cohorts are joined straight away. For paid ones, "Join" opens the payment pop-up
// (PaymentPopup.jsx).
import { useEffect, useState } from "react";
import { joinCohortDirectly } from "../../lib/data.js";
import { formatDate, todayKey } from "../../lib/dates.js";
import { formatPrice, startsIn, habitInfo } from "../../lib/cohorts.js";
import PaymentPopup from "../PaymentPopup.jsx";

export default function JoinCohort({ uid, cohorts, memberships, onJoined }) {
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(null); // the cohort whose payment form is open

  // When a tile opens its payment, bring the tile to the top of the screen,
  // so what opened beneath it is in view.
  const openId = paying?.cohort.id;
  useEffect(() => {
    if (!openId) return;
    const timer = setTimeout(() => document.getElementById(`cohort-${openId}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    return () => clearTimeout(timer);
  }, [openId]);
  const joinedIds = new Set(memberships.map((m) => m.cohortId));
  const open = cohorts
    .filter((c) => !c.archived && c.status !== "finished" && c.startDate >= todayKey())
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  async function handleJoin(cohort) {
    setError("");
    setBusyId(cohort.id);
    try {
      if (!Number(cohort.price)) {
        await joinCohortDirectly(uid, cohort.id, "free");
        await onJoined();
      } else {
        setPaying({ cohort }); // the payment pop-up
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "We couldn't join you to this cohort. Please try again.");
    }
    setBusyId(null);
  }

  // One tile per cohort, in its habit's colour.
  return (
    <>
      <p className="card-label upcoming-title">Upcoming cohorts</p>
      {open.length === 0 && <section className="card"><p className="muted">None yet.</p></section>}
      {open.map((c) => (
        <section key={c.id} id={`cohort-${c.id}`} className="card cohort-tile" style={{ "--cohort": habitInfo(c.habitType).accent }}>
          <p className="card-label">{habitInfo(c.habitType).tab}</p>
          <h2>{c.name}</h2>
          <p className="cohort-countdown">{startsIn(c.startDate, todayKey())}</p>
          <p className="muted small">
            {formatDate(c.startDate, { weekday: "long" })} · {c.durationDays} days · {formatPrice(c)}{Number(c.price) > 0 && " incl. VAT"}
            {c.capacity ? ` · ${c.capacity} places` : ""}
          </p>
          {joinedIds.has(c.id) ? (
            <p className="joined">✓ Joined</p>
          ) : paying?.cohort.id === c.id ? null : ( // hidden while its payment is open below
            <button className="btn btn-primary" disabled={busyId !== null || Boolean(paying)}
              onClick={() => handleJoin(c)}>
              {busyId === c.id ? "Please wait…" : "Join"}
            </button>
          )}
          {paying?.cohort.id === c.id && (
            <PaymentPopup inline cohort={c}
              onPaid={async () => { setPaying(null); await onJoined(); }}
              onClose={() => setPaying(null)} />
          )}
        </section>
      ))}
      {error && <p className="form-error" role="alert">{error}</p>}
    </>
  );
}
