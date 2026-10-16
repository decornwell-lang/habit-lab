// Upcoming tab, top: book a one-to-one psychotherapy session with David (photo, price,
// "Book a session"). Wording and link: THERAPY in src/content/site.js. Later this can
// show David's free times from his calendar.
import { site, THERAPY } from "../../content/site.js";

export default function TherapyTile() {
  return (
    <section className="card therapy-tile">
      <img className="therapy-photo" src={site.photo} alt={site.photoAlt} />
      <div className="therapy-body">
        <p className="card-label">One-to-one</p>
        <h2>{THERAPY.title}</h2>
        <p className="therapy-details">{THERAPY.details}</p>
        <p className="muted small">{THERAPY.text}</p>
        <a className="btn btn-primary" href={THERAPY.link} target="_blank" rel="noreferrer">{THERAPY.button}</a>
      </div>
    </section>
  );
}
