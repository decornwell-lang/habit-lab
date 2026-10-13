// "Breathe with the urge": a one-minute guided breathing pause for the moment
// a craving arrives. In for 4, out for 6, six times. Wording is easy to change below.
import { useEffect, useState } from "react";

const IN_SECONDS = 4;
const OUT_SECONDS = 6;
const ROUNDS = 6; // 6 x 10 seconds = 1 minute

// Short prompts shown under the circle, one per round.
const PROMPTS = [
  "Notice where the urge lives in your body.",
  "Let it be there. You don't have to act on it.",
  "Feel it rise, like a wave.",
  "Waves peak, and then they fall.",
  "Stay with the breath. Stay with yourself.",
  "Notice what has changed, even a little.",
];

export default function BreathePause() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <section className="card breathe-card">
        <div>
          <p className="card-label">Craving?</p>
          <h2>Breathe with the urge</h2>
          <p className="muted small">One minute. Let it pass.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>Start</button>
      </section>
      {open && <BreatheOverlay onClose={() => setOpen(false)} />}
    </>
  );
}

function BreatheOverlay({ onClose }) {
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState("in"); // "in" | "out" | "done"

  useEffect(() => {
    if (phase === "done") return;
    const t = setTimeout(
      () => {
        if (phase === "in") return setPhase("out");
        if (round + 1 >= ROUNDS) return setPhase("done");
        setRound((r) => r + 1);
        setPhase("in");
      },
      (phase === "in" ? IN_SECONDS : OUT_SECONDS) * 1000
    );
    return () => clearTimeout(t);
  }, [phase, round]);

  // Close with Escape
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="breathe-overlay" role="dialog" aria-modal="true" aria-label="Breathing exercise">
      <button className="icon-btn breathe-close" aria-label="Close" onClick={onClose}>
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {phase === "done" ? (
        <div className="breathe-done">
          <p className="breathe-word">The wave passed.</p>
          <p className="breathe-prompt">You're still here.</p>
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </div>
      ) : (
        <>
          <div className={`breathe-circle ${phase}`} style={{ "--in": `${IN_SECONDS}s`, "--out": `${OUT_SECONDS}s` }}>
            <span className="breathe-word">{phase === "in" ? "Breathe in" : "Breathe out"}</span>
          </div>
          <p className="breathe-prompt" aria-live="polite">{PROMPTS[round]}</p>
          <p className="breathe-count">{round + 1} of {ROUNDS}</p>
        </>
      )}
    </div>
  );
}
