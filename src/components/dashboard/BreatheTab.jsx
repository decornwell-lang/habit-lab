// Breathe tab: for a craving. Gentle, quiet, diaphragmatic belly breathing
// through the nose. The in-breath counts up 1 to 7, the out-breath counts down
// 7 to 1. The whole tab is the dark blue breathing screen. Members can change the
// length (1 to 10 minutes) and switch the gong on or off; both are remembered on the device.
import { useEffect, useRef, useState } from "react";
import { playGong, unlockAudio } from "../../lib/gong.js";

const BREATH_SECONDS = 7; // each in-breath and each out-breath
const MIN_MINUTES = 1;
const MAX_MINUTES = 10;
const SETTINGS_KEY = "habitlab:breathe";

function loadSettings() {
  try {
    return { minutes: 3, gong: true, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch {
    return { minutes: 3, gong: true };
  }
}

export default function BreatheTab() {
  const [settings, setSettings] = useState(loadSettings);
  const [startedAt, setStartedAt] = useState(null); // null = not running
  const [elapsed, setElapsed] = useState(0);
  const lastPhase = useRef(null); // to sound the gong when the breath changes
  const totalSeconds = settings.minutes * 60;

  function change(next) {
    const updated = { ...settings, ...next };
    setSettings(updated);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch {
      // Not saved; the defaults return next time.
    }
  }

  useEffect(() => {
    if (startedAt === null) return;
    const timer = setInterval(() => {
      const secs = (Date.now() - startedAt) / 1000;
      setElapsed(Math.min(secs, totalSeconds));
      if (secs >= totalSeconds) {
        setStartedAt(null);
        if (settings.gong) playGong(); // the end
        return;
      }
      const phase = Math.floor(secs / BREATH_SECONDS);
      if (settings.gong && lastPhase.current !== null && phase !== lastPhase.current) playGong({ soft: true });
      lastPhase.current = phase;
    }, 200);
    return () => clearInterval(timer);
  }, [startedAt, totalSeconds, settings.gong]);

  const running = startedAt !== null;
  const finished = !running && elapsed >= totalSeconds;
  const inPhase = elapsed % (BREATH_SECONDS * 2) < BREATH_SECONDS;
  const second = Math.floor(elapsed % BREATH_SECONDS); // 0 to 6 within this breath
  const count = inPhase ? second + 1 : BREATH_SECONDS - second; // in: 1 → 7, out: 7 → 1
  const left = Math.ceil(totalSeconds - elapsed);
  const clock = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;

  function start() {
    unlockAudio();
    if (settings.gong) playGong(); // the beginning
    lastPhase.current = 0;
    setElapsed(0);
    setStartedAt(Date.now());
  }
  function stop() {
    setStartedAt(null);
    setElapsed(0);
  }

  return (
    <section className="breathe-screen" aria-label="Breathing">
      {finished ? (
        <>
          <p className="breathe-done">The wave passed.</p>
          <p className="breathe-hint">You're still here.</p>
          <button className="btn btn-primary" onClick={start}>Breathe again</button>
        </>
      ) : running ? (
        <>
          <div className={`breathe-circle ${inPhase ? "in" : "out"}`} style={{ "--breath": `${BREATH_SECONDS}s` }}>
            <span>
              <span className="breathe-word">{inPhase ? "Breathe in" : "Breathe out"}</span>
              <span className="breathe-count">{count}</span>
            </span>
          </div>
          <p className="breathe-clock">{clock}</p>
          <p className="breathe-hint">Gentle, quiet belly breaths through your nose.</p>
          <button className="btn btn-text breathe-text-btn" onClick={stop}>Stop</button>
        </>
      ) : (
        <>
          <h2>Craving?</h2>
          <p className="breathe-hint">
            Gentle, quiet, diaphragmatic belly breathing through your nose: 7 seconds in, 7 seconds out.
          </p>
          <div className="breathe-circle"><span className="breathe-word">{settings.minutes}:00</span></div>

          <div className="breathe-options">
            <div className="breathe-stepper" role="group" aria-label="Length">
              <button onClick={() => change({ minutes: Math.max(MIN_MINUTES, settings.minutes - 1) })}
                disabled={settings.minutes <= MIN_MINUTES} aria-label="Shorter">−</button>
              <span>{settings.minutes} min</span>
              <button onClick={() => change({ minutes: Math.min(MAX_MINUTES, settings.minutes + 1) })}
                disabled={settings.minutes >= MAX_MINUTES} aria-label="Longer">+</button>
            </div>
            <button className={`breathe-toggle ${settings.gong ? "on" : ""}`} onClick={() => change({ gong: !settings.gong })}
              aria-pressed={settings.gong}>
              {settings.gong ? "🔔 Gong on" : "🔕 Gong off"}
            </button>
          </div>

          <button className="btn btn-primary" onClick={start}>Start</button>
        </>
      )}
    </section>
  );
}
