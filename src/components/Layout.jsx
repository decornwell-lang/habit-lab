// Layout: the header (with the hamburger menu) shown on every page.
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import Menu from "./Menu.jsx";
import UpdateBanner from "./UpdateBanner.jsx";
import { site } from "../content/site.js";

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

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
          <span>{site.brandName}</span>
        </Link>
        <span className="header-spacer" />
      </header>

      <UpdateBanner />
      <Menu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <Outlet />
    </>
  );
}
