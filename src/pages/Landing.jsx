// Landing page: photo, name, intro and the sign-up box.
// Wording and photo are set in src/content/site.js.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, friendlyAuthError } from "../auth/AuthContext.jsx";
import { isFirebaseConfigured } from "../firebase.js";
import { site } from "../content/site.js";

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
        <Link to="/about" className="text-link">About David →</Link>

        <section className="product-intro">
          <p className="card-label">{site.productName}</p>
          <h2>{site.productTagline}</h2>
          <p>{site.productIntro}</p>
          <Link to="/habit-lab" className="text-link">How The Habit Lab works →</Link>
        </section>

        {user ? (
          <div className="card">
            <h2>Welcome back, {user.displayName || "friend"}</h2>
            <Link to="/dashboard" className="btn btn-primary">Go to my dashboard</Link>
          </div>
        ) : (
          <SignUpForm />
        )}
      </div>
    </main>
  );
}

function SignUpForm() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    surname: "",
    email: "",
    password: "",
    leaderboardOptIn: false, // off by default, as the brief requires
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Simple checks before contacting Firebase
    if (!form.firstName.trim() || !form.surname.trim()) return setError("Please enter your first name and surname.");
    if (form.password.length < 8) return setError("Please choose a password with at least 8 characters.");

    setBusy(true);
    try {
      await signUp({
        ...form,
        firstName: form.firstName.trim(),
        surname: form.surname.trim(),
        email: form.email.trim(),
      });
      navigate("/dashboard");
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit} noValidate>
      <h2>{site.signUpTitle}</h2>
      <p className="muted small">{site.signUpSubtitle}</p>

      {!isFirebaseConfigured && (
        <p className="notice">Preview mode: accounts will work once Firebase is connected.</p>
      )}

      <div className="field-row">
        <div className="field">
          <label htmlFor="firstName">First name</label>
          <input id="firstName" name="firstName" autoComplete="given-name" value={form.firstName} onChange={update} required />
        </div>
        <div className="field">
          <label htmlFor="surname">Surname</label>
          <input id="surname" name="surname" autoComplete="family-name" value={form.surname} onChange={update} required />
        </div>
      </div>

      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={update} required />
      </div>

      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} value={form.password} onChange={update} required />
        <p className="hint">At least 8 characters.</p>
      </div>

      <label className="checkbox">
        <input type="checkbox" name="leaderboardOptIn" checked={form.leaderboardOptIn} onChange={update} />
        <span>Show me on the Habit Lab leaderboard (first name and avatar only)</span>
      </label>

      {error && <p className="form-error" role="alert">{error}</p>}

      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? "Creating your account…" : "Create my account"}
      </button>

      <p className="form-foot">
        Already a member? <Link to="/login">Log in</Link>
      </p>
    </form>
  );
}
