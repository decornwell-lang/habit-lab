// PlaceholderPage: a simple page with a title and a message (used for "Page not found").
export default function PlaceholderPage({ eyebrow, title, children }) {
  return (
    <main className="page">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      <div className="card">
        <p className="muted">{children || "This page is coming soon."}</p>
      </div>
    </main>
  );
}
