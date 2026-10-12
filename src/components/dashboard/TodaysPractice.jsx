// 1. Today's Practice: this week's meditation video and "Mark as practised today".
import { useState } from "react";
import { markPractised } from "../../lib/data.js";
import { videoSource } from "../../lib/video.js";

export default function TodaysPractice({ uid, content, practised, today }) {
  const [done, setDone] = useState(practised);
  const [busy, setBusy] = useState(false);
  const video = videoSource(content.meditationUrl);

  async function handleMark() {
    setBusy(true);
    try {
      await markPractised(uid, today, content.week);
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <p className="card-label">Today's Practice</p>
      <h2>{content.title}</h2>
      <p className="muted small">15-minute mindfulness of breathing meditation</p>

      {video?.type === "iframe" && (
        <div className="video">
          <iframe src={video.src} title="This week's meditation" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
        </div>
      )}
      {video?.type === "video" && (
        <div className="video">
          <video src={video.src} controls preload="metadata" />
        </div>
      )}
      {video?.type === "link" && (
        <a className="btn btn-ghost" href={video.src} target="_blank" rel="noreferrer">Open this week's meditation</a>
      )}
      {!video && <div className="video video-empty">This week's meditation will appear here soon.</div>}

      {done ? (
        <p className="done-badge">✓ Practised today. Well done.</p>
      ) : (
        <button className="btn btn-primary" onClick={handleMark} disabled={busy}>
          {busy ? "Saving…" : "Mark as practised today"}
        </button>
      )}
    </section>
  );
}
