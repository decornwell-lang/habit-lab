// A small camera icon that opens an explainer video full screen (e.g. David explaining
// why the intention matters). Links are set in Admin → Content → Explainer videos
// (settings.explainers, ids in src/content/site.js). Without a link, members see nothing
// and the owner sees a faded icon that opens Admin → Content.
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { videoSource } from "../lib/video.js";
import YouTubePlayer from "./YouTubePlayer.jsx";
import { afterVideo } from "../lib/viewportFix.js";

export default function Explainer({ url, label = "Watch the explainer" }) {
  const [open, setOpen] = useState(false);
  const close = () => {
    setOpen(false);
    afterVideo(); // iPhone: keep the tab bar on the bottom of the screen
  };
  const { isAdmin } = useAuth();
  const video = videoSource(url);
  if (!video) {
    return isAdmin ? (
      <Link to="/admin?tab=Content" className="explainer-btn explainer-empty" title="No video yet: add one in Admin → Content" aria-label="Add an explainer video">
        <CameraIcon />
      </Link>
    ) : null;
  }
  return (
    <>
      <button type="button" className="explainer-btn" onClick={() => setOpen(true)} aria-label={label} title={label}>
        <CameraIcon />
      </button>
      {open && (
        <div className="video-modal" role="dialog" aria-label={label} onClick={(e) => e.target === e.currentTarget && close()}>
          <button className="icon-btn video-modal-close" onClick={close} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <div className="video-modal-player">
            {video.type === "youtube" && <YouTubePlayer id={video.id} title={label} />}
            {video.type === "iframe" && <div className="video"><iframe src={video.src} title={label} allow="autoplay; fullscreen" allowFullScreen /></div>}
            {(video.type === "video" || video.type === "audio") && <div className="video"><video src={video.src} controls autoPlay playsInline /></div>}
            {video.type === "link" && <a className="btn btn-primary" href={video.src} target="_blank" rel="noreferrer">Open the video</a>}
          </div>
        </div>
      )}
    </>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <rect x="3" y="6" width="13" height="12" rx="2.5" />
      <path d="M16 10.5l5-3v9l-5-3z" />
    </svg>
  );
}
