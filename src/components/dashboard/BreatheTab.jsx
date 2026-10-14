// Breathe tab: for a craving. Slow breaths through the nose, 7 seconds in and
// 7 seconds out, with a 3-minute countdown. Change the timings below.
import { useEffect, useState } from "react";

const IN_SECONDS = 7;
const OUT_SECONDS = 7;
const TOTAL_SECONDS = 3 * 60;

export default function BreatheTab() {
  const [startedAt, setStartedAt] = useState(null); // null = not running
  const [elapsed, setElapsed] = useState(0);

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
  }
  function stop() {
    setStartedAt(null);
    setElapsed(0);
  }

  if (finished) {
    return (
      <section className="card breathe-screen">
        <p className="breathe-word">The wave passed.</p>
        <p className="muted">You're still here.</p>
        <button className="btn btn-primary" onClick={start}>Breathe again</button>
      </section>
    );
  }

  return (
    <section className="card breathe-screen">
      {!running && (
        <>
          <h2>Craving?</h2>
          <p className="muted">Breathe slowly through your nose: 7 seconds in, 7 seconds out, for three minutes.</p>
        </>
      )}

      <div className={`breathe-circle ${running ? (inPhase ? "in" : "out") : ""}`} style={{ "--in": `${IN_SECONDS}s`, "--out": `${OUT_SECONDS}s` }}>
        {running ? (
          <span>
            <span className="breathe-word">{inPhase ? "Breathe in" : "Breathe out"}</span>
            <span className="breathe-count">{phaseLeft}</span>
          </span>
        ) : (
          <span className="breathe-word">3:00</span>
        )}
      </div>

      {running ? (
        <>
          <p className="breathe-clock" aria-live="off">{clock}</p>
          <p className="muted small">Through your nose, slowly.</p>
          <button className="btn btn-ghost" onClick={stop}>Stop</button>
        </>
      ) : (
        <button className="btn btn-primary" onClick={start}>Start</button>
      )}
    </section>
  );
}
