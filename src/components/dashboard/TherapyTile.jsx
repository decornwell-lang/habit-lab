// Upcoming tab, top: a one-to-one psychotherapy session with David (photo, text that
// wraps under it, "Contact David" emails him). Wording and link: THERAPY in src/content/site.js. Later this can
// show David's free times from his calendar.
import { site, THERAPY } from "../../content/site.js";

export default function TherapyTile() {
  return (
    <section className="card therapy-tile">
      <img className="therapy-photo" src={site.photo} alt={site.photoAlt} />
      <p className="card-label">One-to-one</p>
      <h2>{THERAPY.title}</h2>
      <p className="muted small">{THERAPY.text}</p>
      <a className="btn btn-primary" href={THERAPY.link}>{THERAPY.button}</a>
    </section>
  );
}
