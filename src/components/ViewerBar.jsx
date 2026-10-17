// The bar on top of a full-screen document (PdfButton, WorksheetButton): Download on the
// left (saves the PDF to the phone or computer), and ✕ on the right to close it and go
// back to where you were.
export default function ViewerBar({ url, fileName, onClose }) {
  return (
    <div className="pdf-bar">
      <a className="btn btn-primary btn-small" href={url} download={fileName || true}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
        </svg>
        Download
      </a>
      <button type="button" className="icon-btn pdf-close" onClick={onClose} aria-label="Close">
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
