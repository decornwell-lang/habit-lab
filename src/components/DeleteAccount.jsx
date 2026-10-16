// My account → Delete my membership: permanently deletes the member's account and all
// their data (api/delete-account.js). They type DELETE to confirm.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../lib/api.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function DeleteAccount() {
  const { logOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setBusy(true);
    setError("");
    try {
      await apiPost("/api/delete-account", { confirm: typed.trim() });
      await logOut().catch(() => {});
      navigate("/");
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <section className="card danger-card">
      <h2>Delete my membership</h2>
      {!open ? (
        <>
          <p className="muted small">Close your account and delete all your data.</p>
          <button type="button" className="btn btn-danger btn-small" onClick={() => setOpen(true)}>Delete my membership…</button>
        </>
      ) : (
        <div className="danger-confirm">
          <p className="small">
            This permanently deletes your account and everything in it: your details, cohorts, check-ins,
            reflections, streaks and badges. You'll be logged out and can't undo this. Records of payments are
            kept, as the law requires.
          </p>
          <div className="field">
            <label htmlFor="confirm-delete">Type DELETE to confirm</label>
            <input id="confirm-delete" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="button" className="btn btn-danger" disabled={typed.trim() !== "DELETE" || busy} onClick={remove}>
            {busy ? "Deleting…" : "Delete my membership and data"}
          </button>
          <button type="button" className="btn btn-text" onClick={() => { setOpen(false); setTyped(""); }}>Cancel</button>
        </div>
      )}
    </section>
  );
}
