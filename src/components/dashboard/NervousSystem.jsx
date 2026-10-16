// Breathe → Nervous system regulation: David's guided practice. The recording's link is
// set in Admin → Content (an audio file plays with the Start/countdown button; a YouTube
// or other video link plays in the clean video player).
import { videoSource } from "../../lib/video.js";
import { AudioPlayer } from "./BreathingSpace.jsx";
import YouTubePlayer from "../YouTubePlayer.jsx";

export default function NervousSystem({ url }) {
  const media = videoSource(url);
  return (
    <>
      <h2>Nervous system regulation</h2>
      <p className="breathe-hint">A guided practice to help your body settle and feel safe.</p>
      {!media && <p className="breathe-hint">The recording will be here soon.</p>}
      {media?.type === "audio" && <AudioPlayer src={media.src} />}
      {media?.type === "youtube" && <div className="regulation-video"><YouTubePlayer id={media.id} title="Nervous system regulation" /></div>}
      {media?.type === "video" && <div className="regulation-video video"><video src={media.src} controls playsInline /></div>}
      {(media?.type === "iframe" || media?.type === "link") && (
        <a className="btn btn-primary" href={media.src} target="_blank" rel="noreferrer">Open the practice</a>
      )}
    </>
  );
}
