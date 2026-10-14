// Home tab: each section in its own frame that opens when tapped (one at a time).
// Each item: { id, icon, tone, title, summary, highlight, done, content }.
//   tone "gold" tints the icon; done turns it aqua with a ✓ summary style.
// `initialOpen` opens one frame to start with (used when a notification is tapped).
import { useState } from "react";

export default function Folds({ items, initialOpen = null }) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <div className="folds">
      {items.map((item) => (
        <section key={item.id} className={`fold ${open === item.id ? "open" : ""}`}>
          <button
            className="fold-row"
            aria-expanded={open === item.id}
            onClick={(e) => {
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
          {open === item.id && <div className="fold-body">{item.content}</div>}
        </section>
      ))}
    </div>
  );
}
