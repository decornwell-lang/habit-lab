// "Open the worksheet" (the countdown box): the before-you-begin worksheet for the habit,
// full screen and easy to read on a phone: keeping a diary (what to write in their own
// journal), then their life story (prompts). Download saves the same thing as a two-page
// PDF; ✕ closes it. Wording: src/content/worksheets.js.
import { useEffect, useState } from "react";
import ViewerBar from "./ViewerBar.jsx";
import { worksheetFor, worksheetPdf, DIARY_HEADING, STORY_HEADING, STORY_TEXT } from "../content/worksheets.js";

export default function WorksheetButton({ habitType, label = "Open the worksheet", className = "btn btn-primary" }) {
  const [open, setOpen] = useState(false);
  const w = worksheetFor(habitType);

  // Close with Escape; stop the page behind from scrolling.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>{label}</button>
      {open && (
        <div className="pdf-viewer" role="dialog" aria-label="Before you begin">
          <ViewerBar url={worksheetPdf(habitType)} fileName={`before-you-begin-${habitType || "habit"}.pdf`} onClose={() => setOpen(false)} />
          <article className="worksheet">
            <p className="eyebrow">Before you begin · {w.name}</p>
            <h1>My diary and my life story</h1>

            <h2>{DIARY_HEADING}</h2>
            <p>{w.journal}</p>
            <h3>{w.eachTime.heading}</h3>
            <ul>{w.eachTime.items.map((t) => <li key={t}>{t}</li>)}</ul>
            <h3>{w.endOfDay.heading}</h3>
            <ul>{w.endOfDay.items.map((t) => <li key={t}>{t}</li>)}</ul>

            <h2>{STORY_HEADING}</h2>
            <p>{STORY_TEXT}</p>
            <ol>{w.story.map((t) => <li key={t}>{t}</li>)}</ol>
          </article>
        </div>
      )}
    </>
  );
}
