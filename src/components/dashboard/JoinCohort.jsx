// Upcoming tab: cohorts that haven't started yet, with a "Join" button.
// Free cohorts are joined straight away. Paid ones first show the price (VAT included),
// the 14-day cancellation terms and a box to tick, then go to Stripe's payment page.
// Alcohol-free cohorts start with a short screening (AlcoholScreening.jsx); only whether
// its advice was shown is saved with the membership.
import { useState } from "react";
import { joinCohortDirectly } from "../../lib/data.js";
import { apiPost } from "../../lib/api.js";
import { formatDate, todayKey } from "../../lib/dates.js";
import { formatPrice } from "../../lib/cohorts.js";
import { JOIN_TERMS } from "../../content/site.js";
import AlcoholScreening from "./AlcoholScreening.jsx";

export default function JoinCohort({ uid, cohorts, memberships, onJoined }) {
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(null); // the paid cohort whose terms are showing
  const [agreed, setAgreed] = useState(false);
  const [screened, setScreened] = useState({}); // cohort id → { advised } once the screening is done
  const needsScreening = (c) => c.habitType === "alcohol" && !screened[c.id];
  const joinedIds = new Set(memberships.map((m) => m.cohortId));
  const open = cohorts
    .filter((c) => c.status !== "finished" && c.startDate >= todayKey())
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  // result: the screening just completed (state may not have updated yet).
  async function handleJoin(cohort, result = screened[cohort.id]) {
    setError("");
    setBusyId(cohort.id);
    try {
      const screening = result ? { advised: result.advised, at: new Date().toISOString() } : null;
      if (!Number(cohort.price)) {
        await joinCohortDirectly(uid, cohort.id, "free", screening ? { screening } : {});
        await onJoined();
      } else {
        const { url, joined } = await apiPost("/api/create-checkout", { cohortId: cohort.id, acceptedTerms: true, screening });
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
      <p className="card-label">Upcoming cohorts</p>
      {open.length === 0 ? (
        <p className="muted">None yet.</p>
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
                <button className="btn btn-primary btn-small" disabled={busyId !== null}
                  onClick={() => (Number(c.price) || needsScreening(c) ? (setConfirming(confirming === c.id ? null : c.id), setAgreed(false)) : handleJoin(c))}>
                  {busyId === c.id ? "Please wait…" : "Join"}
                </button>
              )}
              {confirming === c.id && needsScreening(c) && (
                <div className="join-terms">
                  <AlcoholScreening busy={busyId !== null} onDone={(result) => {
                    setScreened((s) => ({ ...s, [c.id]: result }));
                    if (!Number(c.price)) handleJoin(c, result);
                  }} />
                </div>
              )}
              {confirming === c.id && !needsScreening(c) && Number(c.price) > 0 && (
                <div className="join-terms">
                  <p className="join-price"><strong>{formatPrice(c)}</strong> <span className="muted small">{JOIN_TERMS.price}</span></p>
                  <p className="small">{JOIN_TERMS.cancel}</p>
                  <label className="checkbox">
                    <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /> {JOIN_TERMS.agree}
                  </label>
                  <button className="btn btn-primary" disabled={!agreed || busyId !== null} onClick={() => handleJoin(c)}>
                    {busyId === c.id ? "Please wait…" : "Continue to payment"}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
    </section>
  );
}
