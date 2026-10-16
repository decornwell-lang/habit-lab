// Breathe → Nervous system regulation: David's guided video, in the middle of the screen,
// with the title above it and a short line below (the same layout as the practice chooser). Its link is set in
// Admin → Content (settings.regulationUrl).
import { videoSource } from "../../lib/video.js";
import YouTubePlayer from "../YouTubePlayer.jsx";

export default function NervousSystem({ url }) {
  const video = videoSource(url);
  return (
    <div className="breathe-chooser">
      <div className="breathe-chooser-head">
        <h2>Nervous system regulation exercise</h2>
      </div>
      <div className="regulation-video">
        {video?.type === "youtube" ? (
          <YouTubePlayer id={video.id} title="Nervous system regulation" />
        ) : video ? (
          <div className="video"><video src={video.src} controls playsInline /></div>
        ) : (
          <p className="breathe-hint">The video will be here soon.</p>
        )}
      </div>
      <p className="breathe-hint regulation-caption">A guided practice to help your nervous system regulate and feel safe.</p>
    </div>
  );
}
