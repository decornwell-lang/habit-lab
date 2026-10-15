// Home tab: each section in its own full-width frame that opens when tapped (one at a time).
// Each item: { id, icon, tone, title, subtitle, status, highlight, done, locked, content }.
//   subtitle is a short line under the title; status is a chip on the right
//   (e.g. "Ready", "Opens 18:00", "✓ Done"). highlight makes the chip bright,
//   done makes it quiet, and locked tiles can't be opened.
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
              {item.subtitle && <span className="fold-summary">{item.subtitle}</span>}
            </span>
            {item.status && (
              <span className={`fold-chip ${item.highlight ? "highlight" : ""} ${item.done ? "done" : ""} ${item.locked ? "locked" : ""}`}>
                {item.status}
              </span>
            )}
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
