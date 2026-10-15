// After Save: the member's answers shown on the page (no longer in boxes), so it's
// clear they've been saved. items: [{ label, value }]; empty values are left out.
export default function SavedAnswers({ items, onEdit }) {
  const shown = items.filter((i) => i.value !== undefined && i.value !== null && i.value !== "");
  return (
    <div className="saved-answers">
      <dl>
        {shown.map((i) => (
          <div key={i.label} className={i.quote ? "quote" : ""}>
            <dt>{i.label}</dt>
            <dd>{i.quote ? `“${i.value}”` : i.value}</dd>
          </div>
        ))}
      </dl>
      <p className="saved-answers-meta">
        ✓ Saved{onEdit && <> · <button type="button" className="link-btn" onClick={onEdit}>Edit</button></>}
      </p>
    </div>
  );
}
