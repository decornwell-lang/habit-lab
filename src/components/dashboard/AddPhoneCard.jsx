// Asks members who signed up without a mobile number to add one.
// Shown on the dashboard after log-in until they add it or tap "Not now".
import { useState } from "react";
import { updateUserProfile } from "../../lib/data.js";
import { isValidPhone, normalizePhone } from "../../lib/phone.js";

const DISMISS_KEY = "habitlab:phoneDismissed";

export default function AddPhoneCard({ uid, profile }) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (!profile || profile.phone || hidden) return null;

  async function save(e) {
    e.preventDefault();
    if (!isValidPhone(phone)) return setError("Add country code, e.g. +44.");
    setBusy(true);
    try {
      await updateUserProfile(uid, { phone: normalizePhone(phone) }); // the profile updates live, hiding this card
    } catch (err) {
      console.error(err);
      setError("Couldn't save. Please try again.");
      setBusy(false);
    }
  }

  function dismiss() {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Not saved; it will show again next time.
    }
  }

  return (
    <section className="card card-accent">
      <h2>Add your mobile</h2>
      <p className="muted small">Private. For your pod's WhatsApp.</p>
      <form className="note-form" onSubmit={save}>
        <input type="tel" autoComplete="tel" aria-label="Mobile number" placeholder="+44 7700 900123" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <button className="btn btn-primary btn-small" disabled={busy}>Save</button>
      </form>
      {error && <p className="form-error">{error}</p>}
      <button className="btn btn-text" onClick={dismiss}>Not now</button>
    </section>
  );
}
