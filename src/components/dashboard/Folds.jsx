// A compact list of rows that open when tapped (one at a time), so the
// Home tab fits on one screen. Each item: { id, title, summary, content }.
import { useState } from "react";

export default function Folds({ items }) {
  const [open, setOpen] = useState(null);
  return (
    <section className="card folds">
      {items.map((item) => (
        <div key={item.id} className={`fold ${open === item.id ? "open" : ""}`}>
          <button
            className="fold-row"
            aria-expanded={open === item.id}
            onClick={(e) => {
              const row = e.currentTarget;
              setOpen(open === item.id ? null : item.id);
              setTimeout(() => row.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
            }}
          >
            <span className="fold-title">{item.title}</span>
            {item.summary && <span className={`fold-summary ${item.highlight ? "highlight" : ""}`}>{item.summary}</span>}
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {open === item.id && <div className="fold-body">{item.content}</div>}
        </div>
      ))}
    </section>
  );
}
