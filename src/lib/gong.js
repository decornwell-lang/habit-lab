// A gong made in the browser (no sound file): a few sine tones that fade slowly.
// `soft` is a quieter, shorter tone (used to mark each change of breath).
let ctx = null;

// Call from a tap (Start), so phones allow sound.
export function unlockAudio() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  ctx = ctx || new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
}

export function playGong({ soft = false } = {}) {
  if (!ctx) return;
  const now = ctx.currentTime;
  const volume = soft ? 0.12 : 0.35;
  const length = soft ? 2.5 : 6;
  // Base note and slightly "off" overtones give the metallic gong colour.
  for (const [ratio, level] of [[1, 1], [2.02, 0.5], [2.74, 0.35], [4.1, 0.2]]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 110 * ratio * (soft ? 2 : 1);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume * level, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + length / ratio ** 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + length);
  }
}
