// The sign-up box: name, email, password, optional mobile and reflection consent.
// Used on the home page and in the join steps (Join.jsx).
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, friendlyAuthError } from "../auth/AuthContext.jsx";
import { isFirebaseConfigured } from "../firebase.js";
import { site, REFLECTION_CONSENT } from "../content/site.js";
import { isValidPhone } from "../lib/phone.js";
import PhoneInput from "./PhoneInput.jsx";

// onDone() runs after the account is created (default: go to the dashboard).
// `loginState` is passed to the Log in link, so logging in returns to the same place.
export default function SignUpForm({ title = site.signUpTitle, onDone, loginState }) {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    surname: "",
    email: "",
    password: "",
    phone: "", // full international number from PhoneInput, e.g. "+447700900123"
    reflectionConsent: false, // off by default
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
    if (!form.firstName.trim() || !form.surname.trim()) return setError("Enter your name.");
    if (form.password.length < 8) return setError("Password needs 8+ characters.");
    if (form.phone && !isValidPhone(form.phone)) return setError("Check your mobile number.");

    setBusy(true);
    try {
      await signUp({
        ...form,
        firstName: form.firstName.trim(),
        surname: form.surname.trim(),
        email: form.email.trim(),
        phone: form.phone || null,
      });
      if (onDone) onDone();
      else navigate("/dashboard");
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit} noValidate>
      <h2>{title}</h2>
      {site.signUpSubtitle && <p className="muted small">{site.signUpSubtitle}</p>}

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
        <p className="hint">8+ characters</p>
      </div>

      <div className="field">
        <label htmlFor="phone">Mobile number <span className="muted">(optional)</span></label>
        <PhoneInput value={form.phone} onChange={(phone) => setForm((f) => ({ ...f, phone }))} />
      </div>

      <label className="checkbox">
        <input type="checkbox" name="reflectionConsent" checked={form.reflectionConsent} onChange={update} />
        <span>{REFLECTION_CONSENT}</span>
      </label>

      {error && <p className="form-error" role="alert">{error}</p>}

      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? "Creating your account…" : "Create my account"}
      </button>

      <p className="form-foot">
        Already a member? <Link to="/login" state={loginState}>Log in</Link>
      </p>
    </form>
  );
}
