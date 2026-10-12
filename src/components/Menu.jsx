// Menu: the slide-out drawer opened by the hamburger icon.
// To add or rename a link, edit the `links` list below.
import { useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/habit-lab", label: "The Habit Lab" },
  { to: "/offerings", label: "Offerings / Retreats" },
];

export default function Menu({ open, onClose }) {
  const { user, logOut } = useAuth();
  const navigate = useNavigate();
  const closeRef = useRef(null);

  // Close with the Escape key, stop the page scrolling behind the menu,
  // and move keyboard focus into the menu when it opens.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  async function handleLogOut() {
    await logOut();
    onClose();
    navigate("/");
  }

  return (
    <>
      <div className={`menu-overlay ${open ? "open" : ""}`} onClick={onClose} aria-hidden="true" />
      <nav
        id="site-menu"
        className={`menu-drawer ${open ? "open" : ""}`}
        aria-label="Main menu"
        aria-hidden={!open}
      >
        <button ref={closeRef} className="icon-btn menu-close" aria-label="Close menu" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <ul className="menu-links">
          {user && (
            <li><NavLink to="/dashboard">My dashboard</NavLink></li>
          )}
          {links.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} end>{l.label}</NavLink>
            </li>
          ))}
          <li className="menu-divider" />
          <li>
            {user ? (
              <button className="menu-link-btn" onClick={handleLogOut}>Log out</button>
            ) : (
              <NavLink to="/login">Log in</NavLink>
            )}
          </li>
        </ul>
      </nav>
    </>
  );
}
