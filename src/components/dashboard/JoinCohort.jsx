// 6. Join a Cohort: upcoming cohorts with a "Join" button.
// Free cohorts are joined straight away; paid ones go to Stripe Checkout.
import { useState } from "react";
import { joinCohortDirectly } from "../../lib/data.js";
import { apiPost } from "../../lib/api.js";
import { formatDate } from "../../lib/dates.js";
import { formatPrice } from "../../lib/cohorts.js";

export default function JoinCohort({ uid, cohorts, memberships, onJoined }) {
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const joinedIds = new Set(memberships.map((m) => m.cohortId));
  const open = cohorts.filter((c) => c.status !== "finished");

  async function handleJoin(cohort) {
    setError("");
    setBusyId(cohort.id);
    try {
      if (!Number(cohort.price)) {
        await joinCohortDirectly(uid, cohort.id);
        await onJoined();
      } else {
        const { url, joined } = await apiPost("/api/create-checkout", { cohortId: cohort.id });
        if (joined) await onJoined();
        else window.location.href = url; // off to Stripe's secure payment page
        return;
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "We couldn't join you to this cohort. Please try again.");
    }
    setBusyId(null);
  }

  return (
    <section className="card">
      <p className="card-label">Join a Cohort</p>
      {open.length === 0 ? (
        <p className="muted">New cohorts will be announced here soon.</p>
      ) : (
        <ul className="cohort-list">
          {open.map((c) => (
            <li key={c.id}>
              <div>
                <h3>{c.name}</h3>
                <p className="muted small">
                  Starts {formatDate(c.startDate, { weekday: "short" })} · {c.durationDays} days · {formatPrice(c)}
                </p>
              </div>
              {joinedIds.has(c.id) ? (
                <span className="joined">✓ Joined</span>
              ) : (
                <button className="btn btn-primary btn-small" onClick={() => handleJoin(c)} disabled={busyId !== null}>
                  {busyId === c.id ? "Please wait…" : "Join"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
    </section>
  );
}
