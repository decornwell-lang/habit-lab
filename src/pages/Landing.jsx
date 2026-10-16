// Landing page: photo, name and intro, then the cohorts open to join. "Join" on a paid
// cohort opens the payment pop-up right here; once paid, the join steps (Join.jsx) ask for
// their details, picture and name, Home Screen and notifications. Alcohol-free and free
// cohorts go to the join steps first (screening, or account details).
// Signed-in members see a link to their dashboard instead. Wording: src/content/site.js.
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { site } from "../content/site.js";
import { getPublicCohorts } from "../lib/data.js";
import { formatPrice, habitInfo, startsIn } from "../lib/cohorts.js";
import { formatDate, todayKey } from "../lib/dates.js";
import SignUpForm from "../components/SignUpForm.jsx";
import PaymentPopup from "../components/PaymentPopup.jsx";
import { setPendingPayment } from "../lib/pendingPayment.js";

export default function Landing() {
  const { user } = useAuth();

  return (
    <main className="landing">
      <div className="landing-photo">
        <img src={site.photo} alt={site.photoAlt} />
      </div>

      <div className="landing-body">
        <p className="eyebrow">{site.brandRole}</p>
        <h1>{site.brandName}</h1>
        <p className="intro">{site.intro}</p>
        <Link to="/about" className="text-link">About →</Link>

        <section className="product-intro">
          <p className="card-label">{site.productName}</p>
          <h2>{site.productTagline}</h2>
          <p>{site.productIntro}</p>
          <Link to="/habit-lab" className="text-link">How it works →</Link>
        </section>

        {user ? (
          <div className="card">
            <h2>Welcome back</h2>
            <Link to="/dashboard" className="btn btn-primary">Open dashboard</Link>
          </div>
        ) : (
          <OpenCohorts />
        )}
      </div>
    </main>
  );
}

// Cohorts open to join (from publicCohorts, readable without signing in).
function OpenCohorts() {
  const [cohorts, setCohorts] = useState(null);
  const [paying, setPaying] = useState(null); // the cohort whose payment pop-up is open
  const navigate = useNavigate();
  const payHere = (c) => Number(c.price) > 0 && c.habitType !== "alcohol"; // alcohol-free: screening first

  useEffect(() => {
    getPublicCohorts()
      .then((all) => setCohorts(all.filter((c) => !c.archived && c.status !== "finished" && c.startDate >= todayKey())))
      .catch(() => setCohorts([]));
  }, []);

  if (!cohorts) return <p className="muted">Loading cohorts…</p>;
  if (cohorts.length === 0) return <SignUpForm />; // none open yet: sign up now, join one later

  return (
    <section className="card">
      <h2>Join a cohort</h2>
      <ul className="cohort-list">
        {cohorts.map((c) => (
          <li key={c.id}>
            <div>
              <h3>{c.name}</h3>
              <p className="muted small">
                <strong className="cohort-countdown">{startsIn(c.startDate, todayKey())}</strong>
                <br />
                {habitInfo(c.habitType).tab} · {formatDate(c.startDate, { weekday: "short" })} · {c.durationDays} days · {formatPrice(c)}{c.capacity ? ` · ${c.capacity} places` : ""}
              </p>
            </div>
            {payHere(c) ? (
              <button className="btn btn-primary btn-small" onClick={() => setPaying(c)}>Join</button>
            ) : (
              <Link to={`/join/${c.id}`} className="btn btn-primary btn-small">Join</Link>
            )}
          </li>
        ))}
      </ul>
      <p className="form-foot">
        Already a member? <Link to="/login">Log in</Link>
      </p>
      {paying && (
        <PaymentPopup cohort={paying} onClose={() => setPaying(null)}
          onPaid={(sessionId) => {
            if (sessionId) setPendingPayment(paying.id, sessionId);
            navigate(`/join/${paying.id}`); // next: their details
          }} />
      )}
    </section>
  );
}
