// Press page (/press): articles (picture, source, title, a line; each opens the article)
// and videos (played here, or on YouTube for those that can't be played elsewhere).
// Wording and links: src/content/press.js.
import { Link } from "react-router-dom";
import { PRESS } from "../content/press.js";
import YouTubePlayer from "../components/YouTubePlayer.jsx";

export default function PressPage() {
  const { articles, videos } = PRESS;
  return (
    <main className="page">
      <p className="eyebrow">{PRESS.eyebrow}</p>
      <h1>{PRESS.title}</h1>
      <p className="intro">{PRESS.intro}</p>

      <section className="info-section">
        <h2>{articles.heading}</h2>
        <div className="press-grid">
          {articles.items.map((a) => (
            <a key={a.href} className="card press-card" href={a.href} target="_blank" rel="noreferrer">
              <img src={a.image} alt="" loading="lazy" />
              <div className="press-card-body">
                <p className="press-source">{a.source}</p>
                <h3>{a.title}</h3>
                <p className="muted small">{a.text}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="info-section">
        <h2>{videos.heading}</h2>
        <div className="press-grid">
          {videos.items.map((v) => (
            <div key={v.id} className="press-video">
              {v.embed === false ? (
                <a className="press-video-link" href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noreferrer" aria-label={`${v.title} (opens YouTube)`}>
                  <img src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`} alt="" loading="lazy" />
                  <span className="press-play" aria-hidden="true">▶</span>
                </a>
              ) : (
                <YouTubePlayer id={v.id} title={v.title} />
              )}
              <h3>{v.title}</h3>
              <p className="muted small">{v.source}{v.embed === false ? " · opens on YouTube" : ""}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="card center">
        <p>Ready to begin?</p>
        <Link to="/" className="btn btn-primary">Join The Habit Lab</Link>
      </div>
    </main>
  );
}
