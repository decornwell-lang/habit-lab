// Breathe tab: for a craving. Gentle, quiet, diaphragmatic belly breathing
// through the nose: 7 seconds in, 7 seconds out, for 3 minutes.
// While it runs it fills the whole screen. Change the timings below.
import { useEffect, useState } from "react";

const IN_SECONDS = 7;
const OUT_SECONDS = 7;
const TOTAL_SECONDS = 3 * 60;

export default function BreatheTab() {
  const [startedAt, setStartedAt] = useState(null); // null = not running
  const [elapsed, setElapsed] = useState(0);
  const [open, setOpen] = useState(false); // full-screen view showing

  useEffect(() => {
    if (startedAt === null) return;
    const timer = setInterval(() => {
      const secs = (Date.now() - startedAt) / 1000;
      setElapsed(Math.min(secs, TOTAL_SECONDS));
      if (secs >= TOTAL_SECONDS) setStartedAt(null);
    }, 200);
    return () => clearInterval(timer);
  }, [startedAt]);

  const running = startedAt !== null;
  const finished = !running && elapsed >= TOTAL_SECONDS;
  const cycle = IN_SECONDS + OUT_SECONDS;
  const inPhase = elapsed % cycle < IN_SECONDS;
  const phaseLeft = Math.ceil(inPhase ? IN_SECONDS - (elapsed % cycle) : cycle - (elapsed % cycle));
  const left = Math.ceil(TOTAL_SECONDS - elapsed);
  const clock = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;

  function start() {
    setElapsed(0);
    setStartedAt(Date.now());
    setOpen(true);
  }
  function close() {
    setStartedAt(null);
    setElapsed(0);
    setOpen(false);
  }

  return (
    <>
      <section className="breathe-intro">
        <h2>Craving?</h2>
        <p className="muted">
          Gentle, quiet, diaphragmatic belly breathing through your nose: 7 seconds in, 7 seconds out, for three minutes.
        </p>
        <div className="breathe-circle"><span className="breathe-word">3:00</span></div>
        <button className="btn btn-primary" onClick={start}>Start</button>
      </section>

      {open && (
        <div className="breathe-full" role="dialog" aria-label="Breathing">
          <button className="icon-btn breathe-close" onClick={close} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {finished ? (
            <>
              <p className="breathe-done">The wave passed.</p>
              <p className="breathe-hint">You're still here.</p>
              <button className="btn btn-primary" onClick={start}>Breathe again</button>
              <button className="btn btn-text breathe-text-btn" onClick={close}>Done</button>
            </>
          ) : (
            <>
              <div className={`breathe-circle ${inPhase ? "in" : "out"}`} style={{ "--in": `${IN_SECONDS}s`, "--out": `${OUT_SECONDS}s` }}>
                <span>
                  <span className="breathe-word">{inPhase ? "Breathe in" : "Breathe out"}</span>
                  <span className="breathe-count">{phaseLeft}</span>
                </span>
              </div>
              <p className="breathe-clock">{clock}</p>
              <p className="breathe-hint">Gentle, quiet belly breaths through your nose.</p>
            </>
          )}
        </div>
      )}
    </>
  );
}
