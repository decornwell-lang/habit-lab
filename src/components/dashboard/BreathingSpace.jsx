// Breathe tab → 3-Step Breathing Space (from MBCT): David's recorded practice.
// The recording is public/audio/three-step-breathing-space.m4a. To use a different one,
// paste its link in Admin → Content (an audio or video file, YouTube, Vimeo or Google Drive). The three steps are shown beside the hourglass that is
// often used to picture this practice: wide awareness, narrowing to the breath,
// then widening again to the whole body.
import { videoSource } from "../../lib/video.js";

const STEPS = [
  { title: "Becoming aware", text: "Pause. Notice what's here: thoughts, feelings, sensations in the body." },
  { title: "Gathering", text: "Bring your attention to the breath, low in the belly. Rest with each breath." },
  { title: "Expanding", text: "Widen your awareness to the whole body, breathing, just as it is." },
];

const RECORDING = "/audio/three-step-breathing-space.m4a";

export default function BreathingSpace({ url }) {
  const media = videoSource(url || RECORDING);
  return (
    <>
      <h2>3-Step Breathing Space</h2>
      <p className="breathe-hint">Three minutes, three steps.</p>

      {media?.type === "audio" && <audio className="breathing-space-audio" src={media.src} controls preload="metadata" />}
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
