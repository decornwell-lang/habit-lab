// Join steps, from the home page's "Join" (/join/<cohortId>). As few steps as possible
// before paying:
//   1. Payment (Stripe's form, here on the page; a visitor gives their email to Stripe)
//   2. Your details (a visitor creates their account, filled in from the payment;
//      or logs in). Free cohorts start here instead.
//   3. How others see you   4. Add to Home Screen   5. Notifications   → the dashboard
// Steps 3 to 5 can be skipped. A visitor's payment is remembered on this device until
// their account is created, so closing the page after paying loses nothing
// (src/lib/pendingPayment.js).
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
import LeaderboardInvite from "../components/dashboard/LeaderboardInvite.jsx";
import InstallApp from "../components/InstallApp.jsx";
import NotificationSettings from "../components/NotificationSettings.jsx";
import PaymentPopup from "../components/PaymentPopup.jsx";
import { getPendingPayment, setPendingPayment, clearPendingPayment } from "../lib/pendingPayment.js";

const AFTER = ["leaderboard", "install", "notifications", "done"]; // the steps after joining, in order


export default function Join() {
  const { cohortId } = useParams();
  const [params, setParams] = useSearchParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const installMode = useInstallMode();
  const [cohort, setCohort] = useState(undefined); // undefined = loading, null = not found
  const [joined, setJoined] = useState(null);
  const [payment, setPayment] = useState(null); // a visitor's completed payment: { sessionId, email, firstName, surname }
  const [after, setAfter] = useState(0); // which of AFTER we're on
  const [busy, setBusy] = useState(false);
  const [paying, setPaying] = useState(true); // the payment pop-up opens as soon as the payment step shows
  const [error, setError] = useState("");

  useEffect(() => {
    getPublicCohort(cohortId).then(setCohort).catch(() => setCohort(null));
  }, [cohortId]);

  // Back from Stripe's own page (or a bank check): remember the payment.
  useEffect(() => {
    const sessionId = params.get("session_id");
    if (params.get("checkout") === "success" && sessionId) setPendingPayment(cohortId, sessionId);
    if (params.get("checkout") === "cancelled") setError("Payment cancelled. You haven't been charged.");
    if (params.get("checkout")) setParams({}, { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // A visitor who has paid: fetch the email and name they gave Stripe, for "Your details".
  useEffect(() => {
    const sessionId = getPendingPayment(cohortId);
    if (user || !sessionId || payment) return;
    apiPost("/api/checkout-status", { sessionId })
      .then((s) => (s.paid && s.cohortId === cohortId ? setPayment({ sessionId, ...s }) : clearPendingPayment(cohortId)))
      .catch(() => {});
  }, [user, cohortId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Signed in: link a payment made before signing up, then check whether they're in the cohort.
  useEffect(() => {
    if (!user) return;
    (async () => {
      const sessionId = getPendingPayment(cohortId);
      if (sessionId) {
        try {
          await apiPost("/api/confirm-checkout", { sessionId });
          clearPendingPayment(cohortId);
        } catch (err) {
          setError(err.message);
        }
      }
      const memberships = await getMemberships(user.uid);
      setJoined(memberships.some((m) => m.cohortId === cohortId));
    })().catch(() => setJoined(false));
  }, [user, cohortId]);

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
  const loginState = { from: `/join/${cohortId}` };

  // Free cohorts, for signed-in members.
  async function join() {
    setBusy(true);
    setError("");
    try {
      if (!paid) {
        await joinCohortDirectly(user.uid, cohortId, "free");
        setJoined(true);
      }
    } catch (err) {
      setError(err.message || "We couldn't join you to this cohort. Please try again.");
    }
    setBusy(false);
  }

  async function paidHere(sessionId) {
    if (user || !sessionId) return setJoined(true); // signed in: already confirmed
    setPendingPayment(cohortId, sessionId);
    setPaying(false);
    const s = await apiPost("/api/checkout-status", { sessionId }).catch(() => ({}));
    setPayment({ sessionId, ...s });
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
  // The payment pop-up opens straight away; closing it leaves a button to open it again.
  const paymentStep = (
    <section className="card">
      <h2>Payment</h2>
      <p>{formatPrice(cohort)} <span className="muted small">{JOIN_TERMS.price}</span></p>
      <button className="btn btn-primary" onClick={() => setPaying(true)}>Pay {formatPrice(cohort)}</button>
      {!user && <p className="form-foot">Already a member? <Link to="/login" state={loginState}>Log in</Link> first.</p>}
      {paying && <PaymentPopup cohort={cohort} onPaid={paidHere} onClose={() => setPaying(false)} />}
    </section>
  );

  let body;
  if (!user) {
    if (payment) {
      body = (
        <SignUpForm title="Your details" lockEmail onDone={() => {}} loginState={loginState}
          intro="✓ Payment received. Create your account to finish joining (use the email you paid with)."
          initial={{ email: payment.email, firstName: payment.firstName, surname: payment.surname }} />
      );
    } else if (!paid) {
      body = <SignUpForm title="Your details" onDone={() => {}} loginState={loginState} />;
    } else {
      body = paymentStep;
    }
  } else if (joined === null) {
    body = <p className="muted">One moment…</p>;
  } else if (!joined) {
    body = paid ? paymentStep : (
      <section className="card">
        <h2>Join</h2>
        <button className="btn btn-primary" disabled={busy} onClick={join}>{busy ? "Please wait…" : "Join this cohort"}</button>
      </section>
    );
  } else if (step === "leaderboard") {
    body = (
      <>
        <p className="join-done">✓ You're in. A few quick choices, then you're ready.</p>
        {profile && <LeaderboardInvite uid={user.uid} profile={profile} />}
        {skip}
      </>
    );
  } else if (step === "install") {
    body = (
      <>
        <InstallApp />
        <button className="btn btn-primary" onClick={next}>Next</button>
        {skip}
      </>
    );
  } else if (step === "notifications") {
    body = (
      <>
        <section className="card">
          <h2>Daily reminders</h2>
          <p className="muted small">A gentle notification at 06:00, 08:00 and 21:00 for your morning check-in, intention and evening review.</p>
        </section>
        <NotificationSettings uid={user.uid} />
        <button className="btn btn-primary" onClick={next}>Next</button>
        {skip}
      </>
    );
  } else {
    body = (
      <section className="card center">
        <h2>You're all set</h2>
        <p className="muted">Your cohort is waiting on your dashboard.</p>
        <button className="btn btn-primary" onClick={finish}>Go to my dashboard</button>
      </section>
    );
  }

  return (
    <main className="page join-steps">
      <p className="eyebrow">Joining</p>
      <h1>{cohort.name}</h1>
      <p className="muted">
        {habitInfo(cohort.habitType).tab} · Starts {formatDate(cohort.startDate, { weekday: "short" })} · {cohort.durationDays} days · {formatPrice(cohort)}
      </p>
      {error && <p className="form-error" role="alert">{error}</p>}
      {body}
    </main>
  );
}
