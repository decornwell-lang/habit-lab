// Breathe tab → 3-Step Breathing Space (from MBCT): David's recorded practice.
// The recording is public/audio/three-step-breathing-space.m4a. To use a different one,
// paste its link in Admin → Content (an audio or video file, YouTube, Vimeo or Google Drive). The three steps are shown beside the hourglass that is
// often used to picture this practice: wide awareness, narrowing to the breath,
// then widening again to the whole body.
import { useRef, useState } from "react";
import { videoSource } from "../../lib/video.js";
import Explainer from "../Explainer.jsx";

const STEPS = [
  { title: "Becoming aware", text: "Pause. Notice what's here: thoughts, feelings, sensations in the body." },
  { title: "Gathering", text: "Bring your attention to the breath, low in the belly. Rest with each breath." },
  { title: "Expanding", text: "Widen your awareness to the whole body, breathing, just as it is." },
];

const RECORDING = "/audio/three-step-breathing-space.m4a";

export default function BreathingSpace({ url, explainer }) {
  const media = videoSource(url || RECORDING);
  return (
    <>
      <div className="title-with-explainer">
        <h2>3-Step Breathing Space</h2>
        <Explainer url={explainer} label="About the 3-Step Breathing Space" />
      </div>
      <p className="breathe-hint">Three minutes, three steps.</p>

      {media?.type === "audio" && <AudioPlayer src={media.src} />}
      {media?.type === "video" && <video className="breathing-space-video" src={media.src} controls playsInline preload="metadata" />}
      {media?.type === "iframe" && (
        <div className="video breathing-space-video">
          <iframe src={media.src} title="3-Step Breathing Space" allow="autoplay; fullscreen" allowFullScreen />
        </div>
      )}
      {media?.type === "link" && <a className="btn btn-primary" href={media.src} target="_blank" rel="noreferrer">Play the practice</a>}

      <div className="hourglass">
        <Hourglass />
        <ol className="hourglass-steps">
          {STEPS.map((step) => (
            <li key={step.title}>
              <strong>{step.title}</strong>
              <span>{step.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}

// The hourglass: three equal parts, numbered 1 to 3, lined up with the steps.
function Hourglass() {
  const outline = "M12,8 H88 C88,72 61,98 61,120 C61,142 88,168 88,232 H12 C12,168 39,142 39,120 C39,98 12,72 12,8 Z";
  return (
    <svg className="hourglass-shape" viewBox="0 0 100 240" aria-hidden="true">
      <defs>
        <clipPath id="hourglass-clip"><path d={outline} /></clipPath>
      </defs>
      <g clipPath="url(#hourglass-clip)">
        <rect x="0" y="0" width="100" height="80" className="hourglass-part one" />
        <rect x="0" y="80" width="100" height="80" className="hourglass-part two" />
        <rect x="0" y="160" width="100" height="80" className="hourglass-part three" />
        <line x1="0" y1="80" x2="100" y2="80" className="hourglass-divider" />
        <line x1="0" y1="160" x2="100" y2="160" className="hourglass-divider" />
      </g>
      <path d={outline} className="hourglass-outline" />
      <rect x="2" y="0" width="96" height="8" rx="3" className="hourglass-cap" />
      <rect x="2" y="232" width="96" height="8" rx="3" className="hourglass-cap" />
      <text x="50" y="44">1</text>
      <text x="50" y="124">2</text>
      <text x="50" y="204">3</text>
    </svg>
  );
}

// The recording: a Start button that becomes a countdown of the time left.
function AudioPlayer({ src }) {
  const audio = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [left, setLeft] = useState(null); // seconds left, once the length is known

  const clock = (secs) => `${Math.floor(secs / 60)}:${String(Math.floor(secs % 60)).padStart(2, "0")}`;
  const update = () => {
    const a = audio.current;
    if (a?.duration) setLeft(Math.max(0, Math.round(a.duration - a.currentTime)));
  };

  function start() {
    audio.current.currentTime = 0;
    audio.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }
  function stop() {
    audio.current.pause();
    audio.current.currentTime = 0;
    setPlaying(false);
    update();
  }

  return (
    <div className="breathing-space-player">
      <audio ref={audio} src={src} preload="metadata" onLoadedMetadata={update} onTimeUpdate={update}
        onEnded={() => { setPlaying(false); audio.current.currentTime = 0; update(); }} />
      {/* One button: "Start · 3:00", then the countdown inside the same button (tap to stop). */}
      <button className="btn btn-primary breathing-space-button" onClick={playing ? stop : start} aria-label={playing ? "Stop" : "Start"}>
        {playing ? (left !== null ? clock(left) : "…") : `Start${left !== null ? ` · ${clock(left)}` : ""}`}
      </button>
      {playing && <p className="muted small breathing-space-hint">Tap to stop</p>}
    </div>
  );
}
