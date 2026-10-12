// PlaceholderPage: a simple page used for menu pages that aren't written yet
// (About, Contact, The Habit Lab, Offerings). Step 8 replaces these.
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
