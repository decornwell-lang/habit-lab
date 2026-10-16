// A full-screen dark panel over Home (intention, evening review), closed with ✕ (top left).
// `explainer`: a link to an explainer video, shown as a camera icon at the top right.
import Explainer from "../Explainer.jsx";

export default function Sheet({ label, onClose, explainer, children }) {
  return (
    <div className="sheet" role="dialog" aria-label={label}>
      {explainer !== undefined && <div className="sheet-explainer"><Explainer url={explainer} label={`About: ${label}`} /></div>}
      <button className="icon-btn sheet-close" onClick={onClose} aria-label="Close">
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      <div className="sheet-inner">{children}</div>
    </div>
  );
}
