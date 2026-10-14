// A gong made in the browser (no sound file): a few sine tones that fade slowly,
// pitched like a singing bowl so phone speakers can play it clearly.
// `soft` is a quieter, shorter, higher tone (used to mark each change of breath).
let ctx = null;

// Call from a tap (Start), so phones allow sound. Resolves once sound is ready.
export async function unlockAudio() {
  // iPhone: play like a music app, even when the silent switch is on (Safari 16.4+).
  if (navigator.audioSession) navigator.audioSession.type = "playback";
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  ctx = ctx || new AudioContext();
  if (ctx.state !== "running") await ctx.resume().catch(() => {});
  // A silent moment of sound "wakes up" audio on older iPhones.
  const silence = ctx.createBufferSource();
  silence.buffer = ctx.createBuffer(1, 1, 22050);
  silence.connect(ctx.destination);
  silence.start();
}

export function playGong({ soft = false } = {}) {
  if (!ctx || ctx.state !== "running") return;
  const now = ctx.currentTime + 0.02;
  const base = soft ? 528 : 264; // Hz
  const volume = soft ? 0.18 : 0.3;
  const length = soft ? 2.5 : 7; // seconds to fade out
  // The base note plus "off" overtones give the bowl its shimmer.
  for (const [ratio, level] of [[1, 1], [2.01, 0.6], [2.76, 0.4], [5.4, 0.15]]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = base * ratio;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume * level, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + length / Math.sqrt(ratio));
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + length);
  }
}
