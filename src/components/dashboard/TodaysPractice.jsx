// This week's meditation video. The "How was it?" answer below it is in DailyPrompts.jsx.
import { videoSource } from "../../lib/video.js";

export default function TodaysPractice({ content }) {
  const video = videoSource(content.meditationUrl);
  return (
    <section className="card">
      <p className="card-label">Meditation</p>
      <h2>{content.title}</h2>

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
      {!video && <div className="video video-empty">Coming soon</div>}
    </section>
  );
}
