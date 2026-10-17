// Upcoming tab, top: psychotherapy with David, in a tile beside the camera icon (lined up
// with the cohort tiles below on the left). Title, where, one line about it, and
// "Contact David", which emails him. Wording and link: THERAPY in src/content/site.js.
import { THERAPY } from "../../content/site.js";

export default function TherapyTile() {
  return (
    <section className="card therapy-tile">
      <h2>{THERAPY.title}</h2>
      <p className="therapy-where">{THERAPY.text}</p>
      <p className="muted small">{THERAPY.more}</p>
      <a className="btn btn-primary btn-small" href={THERAPY.link}>{THERAPY.button}</a>
    </section>
  );
}
