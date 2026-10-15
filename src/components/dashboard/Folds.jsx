// Home tab: each section in its own full-width frame that opens when tapped (one at a time).
// Each item: { id, icon, tone, title, summary, highlight, done, locked, content }.
//   tone "gold" tints the icon; done turns it aqua with a ✓ summary style;
//   locked shows the tile dimmed and it can't be opened.
// `initialOpen` opens one frame to start with (used when a notification is tapped).
import { useState } from "react";

export default function Folds({ items, initialOpen = null }) {
  const [open, setOpen] = useState(initialOpen);
  if (!items.length) return null;
  return (
    <div className="folds">
      {items.map((item) => (
        <section key={item.id} className={`fold ${open === item.id && !item.locked ? "open" : ""} ${item.locked ? "locked" : ""}`}>
          <button
            className="fold-row"
            aria-expanded={open === item.id && !item.locked}
            aria-disabled={item.locked || undefined}
            onClick={(e) => {
              if (item.locked) return;
              const row = e.currentTarget;
              setOpen(open === item.id ? null : item.id);
              setTimeout(() => row.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
            }}
          >
            <span className={`fold-icon ${item.done ? "done" : item.tone || ""}`} aria-hidden="true">{item.icon}</span>
            <span className="fold-text">
              <span className="fold-title">{item.title}</span>
              {item.summary && (
                <span className={`fold-summary ${item.highlight ? "highlight" : ""} ${item.done ? "done" : ""}`}>{item.summary}</span>
              )}
            </span>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {open === item.id && !item.locked && <div className="fold-body">{item.content}</div>}
        </section>
      ))}
    </div>
  );
}
