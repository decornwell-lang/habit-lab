// Breathe tab: for a craving. Choose a practice:
//   Coherent breathing (CoherentBreathing.jsx) or the 3-Step Breathing Space (BreathingSpace.jsx).
import { useState } from "react";
import CoherentBreathing from "./CoherentBreathing.jsx";
import BreathingSpace from "./BreathingSpace.jsx";

const PRACTICES = [
  { id: "coherent", title: "Coherent breathing", text: "Slow, even breaths with a guide. You choose the pace and length." },
  { id: "space", title: "3-Step Breathing Space", text: "A 3-minute guided pause, from MBCT." },
];

export default function BreatheTab({ settings }) {
  const [practice, setPractice] = useState(null);
  const back = () => setPractice(null);

  return (
    <section className="breathe-screen" aria-label="Breathing">
      {practice === "coherent" && <CoherentBreathing onBack={back} />}
      {practice === "space" && <BreathingSpace url={settings.breathingSpaceUrl} onBack={back} />}
      {!practice && (
        <>
          <h2>Craving?</h2>
          <p className="breathe-hint">Choose a practice.</p>
          <div className="breathe-choices">
            {PRACTICES.map((p) => (
              <button key={p.id} className="breathe-choice" onClick={() => setPractice(p.id)}>
                <strong>{p.title}</strong>
                <span>{p.text}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
