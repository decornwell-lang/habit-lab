// One button that does two jobs: "Save" until the answers are saved, then the same
// button becomes "Share to WhatsApp". Changing an answer turns it back into "Save".
import ShareButton from "./ShareButton.jsx";

export default function SaveShareButton({ saved, canSave = true, busy = false, onSave, shareText }) {
  if (saved) return <ShareButton text={shareText}>Share to WhatsApp</ShareButton>;
  return (
    <button type="button" className="btn btn-primary save-share" onClick={onSave} disabled={!canSave || busy}>
      {busy ? "Saving…" : "Save"}
    </button>
  );
}
