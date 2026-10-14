// Set a new password (My account). Shown at the top, highlighted, straight after
// logging in with an emailed link, so the member can log in with a password again.
import { useState } from "react";
import { useAuth, friendlyAuthError } from "../auth/AuthContext.jsx";

export default function ChangePassword({ highlight = false }) {
  const { changePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (password.length < 8) return setError("Password needs 8+ characters.");
    setBusy(true);
    try {
      await changePassword(password);
      setPassword("");
      setMessage("Password saved.");
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={`card ${highlight ? "card-accent" : ""}`} onSubmit={save}>
      <h2>{highlight ? "You're logged in. Set a new password" : "Password"}</h2>
      <div className="field">
        <label htmlFor="new-password">New password</label>
        <input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <p className="hint">8+ characters</p>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p className="form-success" role="status">{message}</p>}
      <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save password"}</button>
    </form>
  );
}
