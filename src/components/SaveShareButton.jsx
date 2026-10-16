// One button that does two jobs: "Save" until the answers are saved, then the same
// button becomes "Share to WhatsApp". Changing an answer turns it back into "Save".
// `group` names the cohort's WhatsApp group to pick in the share sheet, e.g. "Smoke-free".
import ShareButton from "./ShareButton.jsx";

export default function SaveShareButton({ saved, canSave = true, busy = false, onSave, shareText, group }) {
  const hint = saved && group && <p className="share-hint">Post it in your {group} group</p>;
  if (saved && !shareText) {
    // Saved, but nothing chosen to share (e.g. "Include my text" unticked, or nothing written).
    return <button type="button" className="btn btn-whatsapp" disabled>Share to WhatsApp</button>;
  }
  if (saved) return <><ShareButton text={shareText}>Share to WhatsApp</ShareButton>{hint}</>;
  return (
    <button type="button" className="btn btn-primary save-share" onClick={onSave} disabled={!canSave || busy}>
      {busy ? "Saving…" : "Save"}
    </button>
  );
}
