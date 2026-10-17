// "Open (PDF)": opens a PDF inside the app, full screen, with a bar on top: Download
// (saves it to the phone or computer) and ✕ to close (back to where you were).
// Used for the weekly assignment.
import { useState } from "react";
import ViewerBar from "./ViewerBar.jsx";

export default function PdfButton({ url, label = "Open (PDF)", fileName, className = "btn btn-primary" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>{label}</button>
      {open && (
        <div className="pdf-viewer" role="dialog" aria-label="Document">
          <ViewerBar url={url} fileName={fileName} onClose={() => setOpen(false)} />
          <iframe className="pdf-frame" src={url} title={label} />
        </div>
      )}
    </>
  );
}
