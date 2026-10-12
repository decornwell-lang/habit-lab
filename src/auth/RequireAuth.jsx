// RequireAuth: wrap a page in this to make it members-only.
// Visitors who aren't logged in are sent to the log-in page.
// Add `admin` to make it owner-only:  <RequireAuth admin>...</RequireAuth>
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

export default function RequireAuth({ children, admin = false }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="page muted">Loading…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (admin && !isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}
