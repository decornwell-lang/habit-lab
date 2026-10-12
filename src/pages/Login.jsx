// Log-in page, with a "Forgot password?" option.
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth, friendlyAuthError } from "../auth/AuthContext.jsx";
import { isFirebaseConfigured } from "../firebase.js";

export default function Login() {
  const { user, logIn, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  // Where to go after logging in (the page they tried to open, or the dashboard)
  const next = location.state?.from || "/dashboard";

  if (user) return <Navigate to={next} replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await logIn(email.trim(), password);
      navigate(next, { replace: true });
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    setError("");
    setMessage("");
    if (!email.trim()) return setError("Enter your email above, then tap “Forgot password?” again.");
    try {
      await resetPassword(email.trim());
      setMessage("If there's an account for that email, we've sent a link to reset your password.");
    } catch (err) {
      setError(friendlyAuthError(err));
    }
  }

  return (
    <main className="page narrow">
      <form className="card" onSubmit={handleSubmit} noValidate>
        <h1 className="h2">Welcome back</h1>
        <p className="muted small">Log in to see today's practice.</p>

        {!isFirebaseConfigured && (
          <p className="notice">Preview mode: log-in will work once Firebase is connected.</p>
        )}

        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}
        {message && <p className="form-success" role="status">{message}</p>}

        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Logging in…" : "Log in"}
        </button>

        <button type="button" className="btn btn-text" onClick={handleReset}>
          Forgot password?
        </button>

        <p className="form-foot">
          New here? <Link to="/">Create an account</Link>
        </p>
      </form>
    </main>
  );
}
