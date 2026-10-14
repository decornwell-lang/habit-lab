// Breathe tab → 3-Step Breathing Space (from MBCT): David's recorded 3-minute practice.
// Paste the recording's link in Admin → Content (an audio or video file, YouTube,
// Vimeo or Google Drive). Until then, the three steps are shown as a guide.
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

      <ol className="breathing-steps">
        {STEPS.map((step, i) => (
          <li key={step.title}>
            <span className="breathing-step-number">{i + 1}</span>
            <span>
              <strong>{step.title}</strong>
              <span>{step.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </>
  );
}
