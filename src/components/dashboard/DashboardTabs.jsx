// The tab bar fixed to the bottom of the dashboard (like a phone app).
// To rename a tab or change its icon, edit TABS below.
export const TABS = [
  { id: "home", label: "Home", icon: "M3 11l9-7 9 7M5 9.5V20h5v-6h4v6h5V9.5" },
  { id: "upcoming", label: "Upcoming", icon: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4" },
];

export const DEFAULT_TAB = "home";

export default function DashboardTabs({ active, onChange }) {
  return (
    <nav className="tabbar" aria-label="Dashboard sections" style={{ gridTemplateColumns: `repeat(${TABS.length}, 1fr)` }}>
      {TABS.map((t) => (
        <button
          key={t.id}
          className={active === t.id ? "active" : ""}
          aria-current={active === t.id ? "page" : undefined}
          onClick={() => onChange(t.id)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            <path d={t.icon} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
