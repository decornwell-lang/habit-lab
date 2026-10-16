// Breathe → Nervous system regulation: David's guided video practice. Its link is set in
// Admin → Content (YouTube or a video file, shown in a 16:9 frame; an audio file plays with
// the Start/countdown button). Until then, the frame shows "Video coming soon".
import { videoSource } from "../../lib/video.js";
import { AudioPlayer } from "./BreathingSpace.jsx";
import YouTubePlayer from "../YouTubePlayer.jsx";

export default function NervousSystem({ url }) {
  const media = videoSource(url);
  return (
    <>
      <h2>Nervous system regulation</h2>
      <p className="breathe-hint">A guided practice to help your body settle and feel safe.</p>
      {!media && <div className="regulation-video video-placeholder"><span>Video coming soon</span></div>}
      {media?.type === "audio" && <AudioPlayer src={media.src} />}
      {media?.type === "youtube" && <div className="regulation-video"><YouTubePlayer id={media.id} title="Nervous system regulation" /></div>}
      {media?.type === "video" && <div className="regulation-video video"><video src={media.src} controls playsInline /></div>}
      {(media?.type === "iframe" || media?.type === "link") && (
        <a className="btn btn-primary" href={media.src} target="_blank" rel="noreferrer">Open the practice</a>
      )}
    </>
  );
}
