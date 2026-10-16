// Join steps, from the home page's "Join" (/join/<cohortId>):
//   1. Your details (create an account, or log in)   2. Screening (alcohol-free cohorts)
//   3. Payment (Stripe; free cohorts skip it)         4. How others see you (leaderboard)
//   5. Add to Home Screen                             6. Notifications   → the dashboard
// Steps 4 to 6 can be skipped. Each step is worked out from where the member is, so
// coming back from Stripe (or reloading) picks up at the right place.
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { getPublicCohort, getMemberships, joinCohortDirectly } from "../lib/data.js";
import { apiPost } from "../lib/api.js";
import { formatPrice, habitInfo } from "../lib/cohorts.js";
import { formatDate } from "../lib/dates.js";
import { JOIN_TERMS } from "../content/site.js";
import { useInstallMode } from "../lib/install.js";
import SignUpForm from "../components/SignUpForm.jsx";
import AlcoholScreening from "../components/dashboard/AlcoholScreening.jsx";
import LeaderboardInvite from "../components/dashboard/LeaderboardInvite.jsx";
import InstallApp from "../components/InstallApp.jsx";
import NotificationSettings from "../components/NotificationSettings.jsx";

const AFTER = ["leaderboard", "install", "notifications", "done"]; // the steps after joining, in order

export default function Join() {
  const { cohortId } = useParams();
  const [params, setParams] = useSearchParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const installMode = useInstallMode();
  const [cohort, setCohort] = useState(undefined); // undefined = loading, null = not found
  const [joined, setJoined] = useState(null);
  const [screening, setScreening] = useState(null);
  const [after, setAfter] = useState(0); // which of AFTER we're on
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getPublicCohort(cohortId).then(setCohort).catch(() => setCohort(null));
  }, [cohortId]);

  // Once signed in: are they in this cohort yet? Coming back from Stripe, confirm the payment first.
  useEffect(() => {
    if (!user) return;
    (async () => {
      const sessionId = params.get("session_id");
      if (params.get("checkout") === "success" && sessionId) {
        setParams({}, { replace: true });
        await apiPost("/api/confirm-checkout", { sessionId }).catch((err) => setError(err.message));
      } else if (params.get("checkout") === "cancelled") {
        setParams({}, { replace: true });
        setError("Payment cancelled. You haven't been charged.");
      }
      const memberships = await getMemberships(user.uid);
      setJoined(memberships.some((m) => m.cohortId === cohortId));
    })().catch(() => setJoined(false));
  }, [user, cohortId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Skip the steps that don't apply: leaderboard already answered, app already installed.
  const step = AFTER[after];
  useEffect(() => {
    if (!joined) return;
    if (step === "leaderboard" && profile && profile.leaderboardOptIn !== null && profile.leaderboardOptIn !== undefined) setAfter((a) => a + 1);
    if (step === "install" && (!installMode || installMode === "installed")) setAfter((a) => a + 1);
  }, [joined, step, profile, installMode]);

  if (cohort === undefined) return <main className="page"><p className="muted">Loading…</p></main>;
  if (!cohort || cohort.archived) {
    return (
      <main className="page">
        <h1>This cohort isn't open</h1>
        <Link to="/" className="btn btn-primary">See the cohorts</Link>
      </main>
    );
  }

  const paid = Number(cohort.price) > 0;
  const needsScreening = cohort.habitType === "alcohol" && !screening;

  async function join() {
    setBusy(true);
    setError("");
    try {
      const result = screening ? { advised: screening.advised, at: new Date().toISOString() } : null;
      if (!paid) {
        await joinCohortDirectly(user.uid, cohortId, "free", result ? { screening: result } : {});
        setJoined(true);
      } else {
        const { url, joined: already } = await apiPost("/api/create-checkout", { cohortId, screening: result, returnPath: `/join/${cohortId}` });
        if (already) setJoined(true);
        else window.location.href = url; // off to Stripe's secure payment page; it brings them back here
        return;
      }
    } catch (err) {
      setError(err.message || "We couldn't join you to this cohort. Please try again.");
    }
    setBusy(false);
  }

  function finish() {
    try {
      localStorage.setItem("habitlab:cohort", cohortId); // open the dashboard on this cohort
    } catch {
      // Not remembered; the dashboard picks a cohort itself.
    }
    navigate("/dashboard");
  }

  const next = () => setAfter((a) => a + 1);
  const skip = <button className="btn btn-text" onClick={next}>Skip for now</button>;

  return (
    <main className="page join-steps">
      <p className="eyebrow">Joining</p>
      <h1>{cohort.name}</h1>
      <p className="muted">
        {habitInfo(cohort.habitType).tab} · Starts {formatDate(cohort.startDate, { weekday: "short" })} · {cohort.durationDays} days · {formatPrice(cohort)}
      </p>
      {error && <p className="form-error" role="alert">{error}</p>}

      {!user ? (
        <SignUpForm title="Your details" onDone={() => {}} loginState={{ from: `/join/${cohortId}` }} />
      ) : joined === null ? (
        <p className="muted">One moment…</p>
      ) : !joined && needsScreening ? (
        <section className="card"><AlcoholScreening busy={busy} onDone={setScreening} /></section>
      ) : !joined ? (
        <section className="card">
          <h2>{paid ? "Payment" : "Join"}</h2>
          {paid && <p>{formatPrice(cohort)} <span className="muted small">{JOIN_TERMS.price}</span></p>}
          <button className="btn btn-primary" disabled={busy} onClick={join}>
            {busy ? "Please wait…" : paid ? "Continue to payment" : "Join this cohort"}
          </button>
        </section>
      ) : step === "leaderboard" ? (
        <>
          <p className="join-done">✓ You're in. A few quick choices, then you're ready.</p>
          {profile && <LeaderboardInvite uid={user.uid} profile={profile} />}
          {skip}
        </>
      ) : step === "install" ? (
        <>
          <InstallApp />
          <button className="btn btn-primary" onClick={next}>Next</button>
          {skip}
        </>
      ) : step === "notifications" ? (
        <>
          <section className="card">
            <h2>Daily reminders</h2>
            <p className="muted small">A gentle notification at 06:00, 08:00 and 21:00 for your morning check-in, intention and evening review.</p>
          </section>
          <NotificationSettings uid={user.uid} />
          <button className="btn btn-primary" onClick={next}>Next</button>
          {skip}
        </>
      ) : (
        <section className="card center">
          <h2>You're all set</h2>
          <p className="muted">Your cohort is waiting on your dashboard.</p>
          <button className="btn btn-primary" onClick={finish}>Go to my dashboard</button>
        </section>
      )}
    </main>
  );
}
