// Log-in page. "Forgot password?" emails a one-tap log-in link (a "magic link").
// Opening that link comes back here, logs the member in, and takes them to
// My account to set a new password.
import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth, friendlyAuthError } from "../auth/AuthContext.jsx";
import { isFirebaseConfigured } from "../firebase.js";

export default function Login() {
  const { user, logIn, sendLoginLink, linkEmail, finishLinkLogin, isLoginLink } = useAuth();
  const location = useLocation();
  const [fromLink] = useState(isLoginLink); // opened from the emailed link?
  const [email, setEmail] = useState(() => (fromLink ? linkEmail() : ""));
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false); // "Forgot password?" view: email only

  // Where to go after logging in: after a link, set a new password; otherwise the page they wanted.
  const next = fromLink ? "/account?newPassword=1" : location.state?.from || "/dashboard";

  async function run(action) {
    setError("");
    setBusy(true);
    try {
      await action();
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  // Opened the link on the same device: log straight in.
  useEffect(() => {
    if (fromLink && email && !user) run(() => finishLinkLogin(email));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (user) return <Navigate to={next} replace />;

  function sendLink() {
    if (!email.trim()) return setError("Enter your email.");
    run(async () => {
      await sendLoginLink(email.trim());
      setSentTo(email.trim());
    });
  }

  if (fromLink) {
    return (
      <main className="page narrow">
        <form className="card" onSubmit={(e) => { e.preventDefault(); run(() => finishLinkLogin(email.trim())); }}>
          <h1 className="h2">Logging you in</h1>
          {busy ? (
            <p className="muted">One moment…</p>
          ) : (
            <>
              <div className="field">
                <label htmlFor="email">Confirm your email</label>
                <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="btn btn-primary">Log in</button>
              <p className="form-foot"><Link to="/login" reloadDocument>Back to log in</Link></p>
            </>
          )}
        </form>
      </main>
    );
  }

  if (sentTo) {
    return (
      <main className="page narrow">
        <section className="card center">
          <h1 className="h2">Check your email</h1>
          <p className="muted">We've sent a log-in link to <strong>{sentTo}</strong>. Tap it to log in.</p>
          <button className="btn btn-text" onClick={() => { setSentTo(""); setForgot(false); }}>Back to log in</button>
        </section>
      </main>
    );
  }

  if (forgot) {
    return (
      <main className="page narrow">
        <form className="card" onSubmit={(e) => { e.preventDefault(); sendLink(); }} noValidate>
          <h1 className="h2">Forgot password?</h1>
          <p className="muted small">We'll email you a link to log in.</p>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Sending…" : "Email me a log-in link"}
          </button>
          <button type="button" className="btn btn-text" onClick={() => { setForgot(false); setError(""); }}>
            Back to log in
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="page narrow">
      <form className="card" onSubmit={(e) => { e.preventDefault(); run(() => logIn(email.trim(), password)); }} noValidate>
        <h1 className="h2">Welcome back</h1>

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

        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Logging in…" : "Log in"}
        </button>

        <button type="button" className="btn btn-text" onClick={() => { setForgot(true); setError(""); }}>
          Forgot password?
        </button>

        <p className="form-foot">
          New here? <Link to="/">Create an account</Link>
        </p>
      </form>
    </main>
  );
}
