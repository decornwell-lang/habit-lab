// Breathe tab → Coherent breathing. Gentle, quiet, diaphragmatic belly breathing
// through the nose. The inhale counts up 0 to 7 as the ball grows, the exhale
// counts down 7 to 0 as it shrinks. Members can change the breath (3 to 10 seconds),
// the length (1 to 10 minutes) and the gong; all are remembered on the device.
import { useEffect, useRef, useState } from "react";
import { playGong, unlockAudio } from "../../lib/gong.js";
import Explainer from "../Explainer.jsx";

const DEFAULTS = { breath: 7, minutes: 3, gong: true }; // breath = seconds for each in- and out-breath
const BREATH_RANGE = [3, 10];
const MINUTES_RANGE = [1, 10];
const SETTINGS_KEY = "habitlab:breathe";

function loadSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch {
    return DEFAULTS;
  }
}

export default function CoherentBreathing({ explainer }) {
  const [settings, setSettings] = useState(loadSettings);
  const [startedAt, setStartedAt] = useState(null); // null = not running
  const [elapsed, setElapsed] = useState(0);
  const lastPhase = useRef(null); // to sound the gong when the breath changes
  const [grown, setGrown] = useState(false); // false for a moment at the start, so the ball starts small and grows
  const breath = settings.breath;
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
      const phase = Math.floor(secs / breath);
      if (settings.gong && lastPhase.current !== null && phase !== lastPhase.current) playGong({ soft: true });
      lastPhase.current = phase;
    }, 200);
    return () => clearInterval(timer);
  }, [startedAt, breath, totalSeconds, settings.gong]);

  const running = startedAt !== null;
  const finished = !running && elapsed >= totalSeconds;
  const inPhase = elapsed % (breath * 2) < breath;
  const intoBreath = elapsed % breath; // seconds into this inhale or exhale
  const count = Math.round(inPhase ? intoBreath : breath - intoBreath); // inhale 0 → 7, exhale 7 → 0
  const left = Math.ceil(totalSeconds - elapsed);
  const clock = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;

  function start() {
    if (settings.gong) unlockAudio().then(() => playGong()); // the beginning
    lastPhase.current = 0;
    setGrown(false);
    setElapsed(0);
    setStartedAt(Date.now());
    setTimeout(() => setGrown(true), 50);
  }
  function stop() {
    setStartedAt(null);
    setElapsed(0);
  }

  // The same layout before, during and after, so the ball never moves:
  // title and hint, then the ball in a fixed spot, then the controls in a fixed-height area.
  const ballClass = running ? (grown && inPhase ? "in" : "out") : "out";
  return (
    <>
      <div className="title-with-explainer">
        <h2>Coherent breathing</h2>
        <Explainer url={explainer} label="About coherent breathing" />
      </div>
      <p className="breathe-hint">Gentle, quiet, diaphragmatic belly breathing through your nose.</p>

      <div className="breathe-stage">
        {/* The ball is the start button: tap it to begin. */}
        <button type="button" className={`breathe-circle ${ballClass}`} style={{ "--breath": `${breath}s` }}
          onClick={running ? undefined : start} aria-label={running ? undefined : "Start"} tabIndex={running ? -1 : 0}>
          {running ? (
            <span>
              <span className="breathe-word">{inPhase ? "Inhale" : "Exhale"}</span>
              <span className="breathe-count">{count}</span>
            </span>
          ) : (
            <span>
              <span className="breathe-word resting">{finished ? "✓" : `${settings.minutes}:00`}</span>
              {!finished && <span className="breathe-tap">Tap to start</span>}
            </span>
          )}
        </button>
      </div>

      <div className="breathe-controls">
        {running && (
          <>
            <p className="breathe-clock">{clock} left</p>
            <button className="btn btn-text breathe-text-btn" onClick={stop}>Stop</button>
          </>
        )}
        {finished && (
          <>
            <p className="breathe-done">The wave passed.</p>
            <p className="breathe-hint">You're still here.</p>
            <button className="btn btn-primary" onClick={start}>Breathe again</button>
          </>
        )}
        {!running && !finished && (
          <>
            <div className="breathe-settings">
              <Stepper label="Inhale and exhale" value={`${breath} sec`} range={BREATH_RANGE} current={breath}
                onChange={(v) => change({ breath: v })} />
              <Stepper label="Length" value={`${settings.minutes} min`} range={MINUTES_RANGE} current={settings.minutes}
                onChange={(v) => change({ minutes: v })} />
              <div className="breathe-setting">
                <span>Gong</span>
                <button className={`breathe-toggle ${settings.gong ? "on" : ""}`} onClick={() => change({ gong: !settings.gong })}
                  aria-pressed={settings.gong}>
                  {settings.gong ? "🔔 On" : "🔕 Off"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// One settings row: label, then − value +.
function Stepper({ label, value, range: [min, max], current, onChange }) {
  return (
    <div className="breathe-setting">
      <span>{label}</span>
      <div className="breathe-stepper" role="group" aria-label={label}>
        <button onClick={() => onChange(Math.max(min, current - 1))} disabled={current <= min} aria-label={`Less: ${label}`}>−</button>
        <span>{value}</span>
        <button onClick={() => onChange(Math.min(max, current + 1))} disabled={current >= max} aria-label={`More: ${label}`}>+</button>
      </div>
    </div>
  );
}
