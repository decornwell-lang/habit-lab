// "Open (PDF)": opens a PDF inside the app, full screen, with a bar on top: ✕ to close
// (back to where you were) and Download (saves it to the phone or computer, to print or
// fill in). Used for the weekly assignment and the before-you-begin worksheets.
import { useState } from "react";

export default function PdfButton({ url, label = "Open (PDF)", fileName, className = "btn btn-primary" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>{label}</button>
      {open && (
        <div className="pdf-viewer" role="dialog" aria-label="Document">
          <div className="pdf-bar">
            <button type="button" className="btn btn-ghost btn-small" onClick={() => setOpen(false)}>✕ Close</button>
            <a className="btn btn-primary btn-small" href={url} download={fileName || true}>Download</a>
          </div>
          <iframe className="pdf-frame" src={url} title={label} />
        </div>
      )}
    </>
  );
}
