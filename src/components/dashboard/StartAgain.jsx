// The "Start again" path, shown after a "No" or "Not right now".
// Gentle by design: history and badges are always kept.
import { useState } from "react";
import { updateMembership } from "../../lib/data.js";
import { todayKey } from "../../lib/dates.js";

export default function StartAgain({ uid, current, onDone }) {
  const [busy, setBusy] = useState(false);
  const canRestart = current?.progress.state === "active" && current.progress.day > 1;

  async function restart() {
    setBusy(true);
    try {
      await updateMembership(uid, current.cohort.id, { personalStartDate: todayKey() });
      onDone(true);
    } catch (err) {
      console.error(err);
      setBusy(false);
    }
  }

  return (
    <section className="card card-gentle">
      <h2>Every return is part of the practice.</h2>
      <p className="muted">
        Nothing is lost. Your check-ins and badges are kept, and you can pick up again whenever you're ready.
      </p>
      <button className="btn btn-primary" onClick={() => onDone(false)} disabled={busy}>
        Continue the cohort from today
      </button>
      {canRestart && (
        <button className="btn btn-ghost" onClick={restart} disabled={busy}>
          {busy ? "Restarting…" : "Restart the cohort from day 1"}
        </button>
      )}
    </section>
  );
}
