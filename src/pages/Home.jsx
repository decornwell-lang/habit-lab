// Home: temporary placeholder for step 1. Step 2 replaces it with the
// real landing page (photo, intro and sign-up box).
import { isFirebaseConfigured } from "../firebase.js";

export default function Home() {
  return (
    <main className="page">
      <p className="eyebrow">David Ernest Cornwell</p>
      <h1>The Habit Lab</h1>
      <p className="muted">
        Project setup is complete. The landing page, sign-up and menu come next.
      </p>

      <div className="card">
        <h2>Setup check</h2>
        <ul className="checklist">
          <li>✓ React + Vite running</li>
          <li>✓ Fonts and colours loaded</li>
          <li>
            {isFirebaseConfigured ? "✓ Firebase connected" : "○ Firebase not connected yet (placeholders)"}
          </li>
        </ul>
        <button className="btn btn-primary">Example main action</button>
      </div>
    </main>
  );
}
