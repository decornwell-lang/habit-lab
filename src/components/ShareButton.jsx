// "Share in the group": on phones it opens the share sheet over the app (pick the
// WhatsApp group there and you stay in the app). Elsewhere it opens WhatsApp
// with the message ready.
import WhatsAppIcon from "./WhatsAppIcon.jsx";

export const whatsAppShareLink = (text) => `https://wa.me/?text=${encodeURIComponent(text)}`;

export default function ShareButton({ text, onShare, children = "Share in the group" }) {
  function handleClick(e) {
    onShare?.();
    if (navigator.share) {
      e.preventDefault();
      navigator.share({ text }).catch(() => {}); // closed without sharing: nothing to do
    }
  }
  return (
    <a className="btn btn-whatsapp" href={whatsAppShareLink(text)} target="_blank" rel="noreferrer" onClick={handleClick}>
      <WhatsAppIcon /> {children}
    </a>
  );
}
