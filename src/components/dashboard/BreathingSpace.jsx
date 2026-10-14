// Breathe tab → 3-Step Breathing Space (from MBCT): David's recorded 3-minute practice.
// Paste the recording's link in Admin → Content (an audio or video file, YouTube,
// Vimeo or Google Drive). The three steps are shown beside the hourglass that is
// often used to picture this practice: wide awareness, narrowing to the breath,
// then widening again to the whole body.
import { videoSource } from "../../lib/video.js";

const STEPS = [
  { title: "Becoming aware", text: "Pause. Notice what's here: thoughts, feelings, sensations in the body." },
  { title: "Gathering", text: "Bring your attention to the breath, low in the belly. Rest with each breath." },
  { title: "Expanding", text: "Widen your awareness to the whole body, breathing, just as it is." },
];

export default function BreathingSpace({ url, onBack }) {
  const media = videoSource(url);
  return (
    <>
      <button className="breathe-back" onClick={onBack}>← Practices</button>
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
      {!media && <p className="breathe-soon">David's recording is coming soon.</p>}

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
  const outline = "M8,4 H92 C92,70 56,98 56,120 C56,142 92,170 92,236 H8 C8,170 44,142 44,120 C44,98 8,70 8,4 Z";
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
      <text x="50" y="44">1</text>
      <text x="50" y="124">2</text>
      <text x="50" y="204">3</text>
    </svg>
  );
}
