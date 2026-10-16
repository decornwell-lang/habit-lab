// Breathe tab: for a craving. Choose a practice: Coherent breathing (CoherentBreathing.jsx),
// the 3-Step Breathing Space (BreathingSpace.jsx) or Nervous system regulation (NervousSystem.jsx).
import { useState } from "react";
import CoherentBreathing from "./CoherentBreathing.jsx";
import BreathingSpace from "./BreathingSpace.jsx";
import Explainer from "../Explainer.jsx";
import NervousSystem from "./NervousSystem.jsx";

const PRACTICES = [
  { id: "coherent", title: "Coherent breathing", text: "Slow, even breaths with a guide. You choose the pace and length." },
  { id: "space", title: "3-Step Breathing Space", text: "A 3-minute guided pause, from MBCT." },
  { id: "regulation", title: "Nervous system regulation", text: "A guided practice to help your body settle." },
];

// explainers: explainer video links (Admin → Content): a camera icon at the top right, with
// its own video on the chooser and on each practice.
const EXPLAINER_IDS = { coherent: "coherent", space: "breathingSpace", regulation: "regulation" };
export default function BreatheTab({ settings, explainers = {} }) {
  const [practice, setPractice] = useState(null); // tapping the Breathe tab again returns here (see Dashboard.jsx)

  return (
    <section className="breathe-screen" aria-label="Breathing">
      {/* The camera icon plays this screen's own video: the Breathe one, or the chosen practice's. */}
      <div className="breathe-explainer">
        <Explainer key={practice || "breathe"} url={explainers[EXPLAINER_IDS[practice] || "breathe"]}
          label={practice ? `About ${PRACTICES.find((p) => p.id === practice).title}` : "About the breathing practices"} />
      </div>
      <div className="breathe-inner">
        {practice === "coherent" && <CoherentBreathing />}
        {practice === "space" && <BreathingSpace url={settings.breathingSpaceUrl} />}
        {practice === "regulation" && <NervousSystem url={settings.regulationUrl} />}
        {!practice && (
          // The two practices sit in the middle of the screen, with the title just above.
          <div className="breathe-chooser">
            <div className="breathe-chooser-head">
              <h2>Craving?</h2>
              <p className="breathe-hint">Choose a practice.</p>
            </div>
            <div className="breathe-choices">
              {PRACTICES.map((p) => (
                <button key={p.id} className="breathe-choice" onClick={() => setPractice(p.id)}>
                  <strong>{p.title}</strong>
                  <span>{p.text}</span>
                </button>
              ))}
            </div>
            <div />
          </div>
        )}
      </div>
    </section>
  );
}
