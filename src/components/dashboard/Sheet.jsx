// A full-screen dark panel over Home (intention, evening review, craving), closed with ✕.
export default function Sheet({ label, onClose, children }) {
  return (
    <div className="sheet" role="dialog" aria-label={label}>
      <button className="icon-btn sheet-close" onClick={onClose} aria-label="Close">
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      <div className="sheet-inner">{children}</div>
    </div>
  );
}
