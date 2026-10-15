// The two tick boxes on each share screen: "Include my text" (on) and "Include my score" (off).
// `hasScore` hides the score box on screens without one.
export default function ShareOptions({ includeText, includeScore, onChange, hasScore = true }) {
  return (
    <div className="share-options">
      <label className="checkbox">
        <input type="checkbox" checked={includeText} onChange={(e) => onChange({ includeText: e.target.checked })} />
        <span>Include my text</span>
      </label>
      {hasScore && (
        <label className="checkbox">
          <input type="checkbox" checked={includeScore} onChange={(e) => onChange({ includeScore: e.target.checked })} />
          <span>Include my score</span>
        </label>
      )}
    </div>
  );
}
