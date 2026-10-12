// Dashboard: members-only. Step 3 fills this with the six sections.
import { useAuth } from "../auth/AuthContext.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <main className="page">
      <p className="eyebrow">My dashboard</p>
      <h1>Hello, {user?.displayName || "friend"}</h1>
      <div className="card">
        <p className="muted">Your practice, check-ins and cohort will appear here in the next step.</p>
      </div>
    </main>
  );
}
