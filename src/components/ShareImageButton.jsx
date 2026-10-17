// The round share icon used on Home (Badges earned, My streak). It prepares the picture
// in the background, so a tap opens the phone's share sheet straight away with it attached.
// On computers, where that isn't possible, it shows the picture with share links instead.
//   image: { badge, label } or { days, label } (see lib/shareImage.js)
import { useEffect, useState } from "react";
import { makeShareImage } from "../lib/shareImage.js";
import ShareCard from "./ShareCard.jsx";
import { afterShare } from "../lib/viewportFix.js";

export default function ShareImageButton({ image, text, fileName, label = "Share" }) {
  const [file, setFile] = useState(null);
  const [fallback, setFallback] = useState(false);
  const key = `${image.badge?.id || ""}|${image.days ?? ""}|${image.label}`;

  useEffect(() => {
    let cancelled = false;
    makeShareImage(image).then((blob) => !cancelled && blob && setFile(new File([blob], fileName, { type: "image/png" })));
    return () => { cancelled = true; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  function share() {
    if (file && navigator.canShare?.({ files: [file] })) {
      navigator.share({ files: [file], text: `${text}\nJoin me: ${window.location.origin}` }).catch(() => {}).finally(afterShare);
    } else {
      setFallback((f) => !f);
    }
  }

  return (
    <>
      <button className="streak-share" onClick={share} aria-label={label}>
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {fallback && (
        <div className="share-fallback">
          <ShareCard image={image} text={text} simple fileName={fileName} />
        </div>
      )}
    </>
  );
}
