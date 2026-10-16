// Upcoming tab, top: psychotherapy with David, laid out like the cohort tiles below it.
// "Contact David" emails him. Wording and link: THERAPY in src/content/site.js.
import { THERAPY } from "../../content/site.js";

export default function TherapyTile() {
  return (
    <section className="card cohort-tile therapy-tile">
      <h2>{THERAPY.title}</h2>
      <p className="muted small">{THERAPY.text}</p>
      <a className="btn btn-primary" href={THERAPY.link}>{THERAPY.button}</a>
    </section>
  );
}
