// A text box with a microphone button: tap it, speak, and the words are added to the box
// (tap again to stop). Uses the browser's own speech recognition (Safari and Chrome);
// where that isn't available the button is hidden and the keyboard's own dictation key
// still works. Takes the same props as <textarea>, except onChange gets the new text.
import { useEffect, useRef, useState } from "react";

const Recognition = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

export default function DictationTextarea({ value, onChange, maxLength, className = "q-textarea", ...rest }) {
  const [listening, setListening] = useState(false);
  const rec = useRef(null);

  useEffect(() => () => rec.current?.abort(), []); // stop listening when the box closes

  function toggle() {
    if (listening) return rec.current?.stop();
    const r = new Recognition();
    r.lang = navigator.language || "en-GB";
    r.continuous = true;
    r.interimResults = true;
    const before = value ? `${value.trimEnd()} ` : "";
    r.onresult = (e) => {
      const spoken = Array.from(e.results, (res) => res[0].transcript).join("").trim();
      const next = before + spoken;
      onChange(maxLength ? next.slice(0, maxLength) : next);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    rec.current = r;
    r.start();
    setListening(true);
  }

  return (
    <div className="dictation">
      <textarea className={className} maxLength={maxLength} value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
      {Recognition && (
        <button type="button" className={`dictation-btn${listening ? " listening" : ""}`} onClick={toggle}
          aria-pressed={listening} aria-label={listening ? "Stop dictation" : "Dictate"}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
          </svg>
        </button>
      )}
    </div>
  );
}
