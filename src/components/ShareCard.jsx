// ShareCard: shares an image plus a short message that invites people to
// join (so every share also promotes the app).
// On phones, "Share" opens the phone's own share sheet (Instagram, WhatsApp,
// Facebook, Messages...) with the image attached. On computers it offers the
// image to download plus share links.
//   <ShareCard image={{ badge, title, subtitle }} text="..." fileName="..." />
import { useEffect, useState } from "react";
import { makeShareImage } from "../lib/shareImage.js";

// `simple` hides "Download image" and "Copy text" (used on the streak card).
export default function ShareCard({ image, text, fileName, simple = false }) {
  const [blob, setBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [message, setMessage] = useState("");

  const siteUrl = window.location.origin;
  const fullText = `${text}\nJoin me: ${siteUrl}`;
  const imageKey = `${image.badge?.id}|${image.title}|${image.subtitle}`;

  useEffect(() => {
    let url = "";
    makeShareImage(image).then((b) => {
      if (!b) return;
      setBlob(b);
      url = URL.createObjectURL(b);
      setPreviewUrl(url);
    });
    return () => url && URL.revokeObjectURL(url);
  }, [imageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const file = blob ? new File([blob], fileName, { type: "image/png" }) : null;
  const canShareImage = Boolean(file && navigator.canShare?.({ files: [file] }));

  async function shareNative() {
    try {
      await navigator.share({ files: [file], text: fullText });
    } catch (err) {
      if (err.name !== "AbortError") setMessage("Sharing didn't work here. Try downloading the image instead.");
    }
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(fullText);
      setMessage("Copied. Paste it into your post.");
    } catch {
      setMessage("Couldn't copy. You can type it yourself.");
    }
  }

  const enc = encodeURIComponent;
  const links = [
    { label: "WhatsApp", href: `https://wa.me/?text=${enc(fullText)}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(siteUrl)}&quote=${enc(text)}` },
    { label: "X", href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(siteUrl)}` },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(siteUrl)}` },
  ];

  return (
    <div className="share-panel">
      {previewUrl ? <img className="share-preview" src={previewUrl} alt={`${image.title} ${image.subtitle}`} /> : <p className="muted small">Preparing your image…</p>}

      {canShareImage && (
        <button type="button" className="btn btn-primary" onClick={shareNative}>Share</button>
      )}

      <div className="share-links">
        {!simple && previewUrl && <a className="btn btn-ghost btn-small" href={previewUrl} download={fileName}>Download image</a>}
        {!simple && <button type="button" className="btn btn-ghost btn-small" onClick={copyText}>Copy text</button>}
        {!canShareImage &&
          links.map((l) => (
            <a key={l.label} className="btn btn-ghost btn-small" href={l.href} target="_blank" rel="noreferrer">{l.label}</a>
          ))}
      </div>
      {!canShareImage && !simple && (
        <p className="muted small">For Instagram, download the image and post it from your phone.</p>
      )}
      {message && <p className="small muted" role="status">{message}</p>}
    </div>
  );
}
