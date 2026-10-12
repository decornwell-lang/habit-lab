// The tab bar fixed to the bottom of the dashboard (like a phone app).
// To rename a tab or change its icon, edit TABS below.
export const TABS = [
  { id: "community", label: "Community", icon: "M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20c0-3 2.7-5 6-5s6 2 6 5M14 15.3c.6-.2 1.3-.3 2-.3 3.3 0 6 2 6 5" },
  { id: "week", label: "This week", icon: "M12 21c4-2.5 7-5.6 7-9.5A7 7 0 0 0 12 4.5a7 7 0 0 0-7 7c0 3.9 3 7 7 9.5zM12 8v5l3 2" },
  { id: "practice", label: "My practice", icon: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM8 12.5l2.7 2.7L16 9.8" },
  { id: "upcoming", label: "Upcoming", icon: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4" },
];

export const DEFAULT_TAB = "practice";

export default function DashboardTabs({ active, onChange }) {
  return (
    <nav className="tabbar" aria-label="Dashboard sections">
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
