// Upcoming tab, top right: a small "Psychotherapy with David" button beside the camera
// icon, so the cohorts below get most of the screen. It emails David. Wording and link:
// THERAPY in src/content/site.js.
import { THERAPY } from "../../content/site.js";

export default function TherapyTile() {
  return (
    <a className="therapy-pill" href={THERAPY.link} title={`${THERAPY.text}. ${THERAPY.button}`}>
      <span>{THERAPY.title}</span>
      <small>{THERAPY.text}</small>
    </a>
  );
}
