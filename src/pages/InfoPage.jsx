// InfoPage: shows one of the text pages from src/content/pages.js.
import { Link } from "react-router-dom";
import { pages } from "../content/pages.js";
import { site } from "../content/site.js";

export default function InfoPage({ name }) {
  const page = pages[name];
  return (
    <main className="page">
      {page.photo && <img className="bio-photo" src={site.photo} alt={site.photoAlt} />}
      <p className="eyebrow">{page.eyebrow}</p>
      <h1>{page.title}</h1>
      <p className="intro">{page.intro}</p>
      {page.sections.map((s) => (
        <section key={s.heading} className="info-section">
          <h2>{s.heading}</h2>
          <p>{s.body}</p>
        </section>
      ))}
      <div className="card center">
        <p>Ready to begin?</p>
        <Link to="/" className="btn btn-primary">Join The Habit Lab</Link>
      </div>
    </main>
  );
}
