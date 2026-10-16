// Layout: the header shown on every page: the menu (left), the logo, and, for signed-in
// members away from the dashboard, a dashboard icon (right) to jump straight back.
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import Menu from "./Menu.jsx";
import UpdateBanner from "./UpdateBanner.jsx";
import NoticeBanner from "./NoticeBanner.jsx";
import { site } from "../content/site.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const showDashboard = user && location.pathname !== "/dashboard";

  // Close the menu whenever the page changes.
  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <>
      <header className="site-header">
        <button
          className="icon-btn"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          onClick={() => setMenuOpen(true)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <Link to="/" className="wordmark" aria-label={`${site.brandName}, home`}>
          <img src={site.logo} alt="" />
        </Link>
        {showDashboard ? (
          <Link to="/dashboard" className="icon-btn" aria-label="Go to my dashboard" title="My dashboard">
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
              <rect x="4" y="4" width="7" height="7" rx="1.5" />
              <rect x="13" y="4" width="7" height="7" rx="1.5" />
              <rect x="4" y="13" width="7" height="7" rx="1.5" />
              <rect x="13" y="13" width="7" height="7" rx="1.5" />
            </svg>
          </Link>
        ) : (
          <span className="header-spacer" />
        )}
      </header>

      <UpdateBanner />
      <NoticeBanner />
      <Menu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <Outlet />
    </>
  );
}
