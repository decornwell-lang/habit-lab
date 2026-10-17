// The bar on top of a full-screen document (PdfButton, WorksheetButton): on the left, a
// button to keep the PDF, and ✕ on the right to close and go back to where you were.
// Phones (iPhone and Android): "Save or share" opens the phone's share sheet with the PDF
// (Save to Files, Print, WhatsApp, Mail…), so the app never leaves the page. A Home Screen
// app on iPhone has no back button, so opening the PDF itself would leave members stuck.
// Computers: "Download" saves the file to the Downloads folder.
import { useEffect, useRef, useState } from "react";
import { afterShare } from "../lib/viewportFix.js";

const phone = () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

export default function ViewerBar({ url, fileName, onClose }) {
  const name = fileName || url.split("/").pop();
  const file = useRef(null); // fetched as soon as the document opens, so the tap shares straight away
  const [canShare, setCanShare] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((r) => r.blob())
      .then((blob) => {
        if (cancelled) return;
        file.current = new File([blob], name, { type: "application/pdf" });
        setCanShare(phone() && Boolean(navigator.canShare?.({ files: [file.current] })));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [url, name]);

  async function keep() {
    setNote("");
    if (canShare && file.current) {
      try {
        await navigator.share({ files: [file.current], title: name });
      } catch (err) {
        if (err.name !== "AbortError") setNote("Couldn't open sharing. Please try again.");
      }
      afterShare();
      return;
    }
    // Computers (or no share sheet): save the file without leaving the app.
    const blobUrl = file.current ? URL.createObjectURL(file.current) : url;
    const a = Object.assign(document.createElement("a"), { href: blobUrl, download: name });
    document.body.appendChild(a);
    a.click();
    a.remove();
    if (file.current) setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    setNote("Saved to your Downloads.");
  }

  return (
    <div className="pdf-bar">
      <div className="pdf-keep">
        <button type="button" className="btn btn-primary btn-small" onClick={keep}>
          {canShare ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 15V3M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
            </svg>
          )}
          {canShare ? "Save or share" : "Download"}
        </button>
        {note && <span className="pdf-note" role="status">{note}</span>}
      </div>
      <button type="button" className="icon-btn pdf-close" onClick={onClose} aria-label="Close">
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
