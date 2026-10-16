// This week's meditation video (Practices tab), shown on its own, without a box or title.
import { videoSource } from "../../lib/video.js";
import YouTubePlayer from "../YouTubePlayer.jsx";

export default function TodaysPractice({ content }) {
  const video = videoSource(content.meditationUrl);
  return (
    <section className="meditation" aria-label="This week's meditation">
      {video?.type === "youtube" && <YouTubePlayer id={video.id} title="this week's meditation" />}
      {video?.type === "iframe" && (
        <div className="video">
          <iframe src={video.src} title="This week's meditation" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
        </div>
      )}
      {video?.type === "video" && (
        <div className="video">
          <video src={video.src} controls playsInline preload="metadata" />
        </div>
      )}
      {video?.type === "link" && (
        <a className="btn btn-primary" href={video.src} target="_blank" rel="noreferrer">Open this week's meditation</a>
      )}
      {!video && <div className="video video-empty">Coming soon</div>}
    </section>
  );
}
