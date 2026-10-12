// InstallApp: the "Add to Home Screen" button and the iPhone instructions.
//   <InstallApp />            a card (used on the dashboard; can be dismissed)
//   <InstallApp variant="menu" />  a link-style button (used in the menu)
//   <IosInstallSteps />       just the iPhone instructions
import { useState } from "react";
import { promptInstall, useInstallMode } from "../lib/install.js";

const DISMISS_KEY = "habitlab:installDismissed";

export function IosInstallSteps() {
  return (
    <ol className="steps-list install-steps">
      <li>
        Tap the <strong>Share</strong> button <ShareIcon /> (at the bottom in Safari, or top right in Chrome).
      </li>
      <li>
        Scroll down and tap <strong>Add to Home Screen</strong>.
      </li>
      <li>
        Tap <strong>Add</strong>. The app will appear on your Home Screen like any other app.
      </li>
    </ol>
  );
}

function ShareIcon() {
  return (
    <svg className="inline-icon" width="18" height="18" viewBox="0 0 24 24" aria-label="Share icon">
      <path d="M12 3v12M8 7l4-4 4 4M6 11v9h12v-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function InstallApp({ variant = "card" }) {
  const mode = useInstallMode();
  const [showSteps, setShowSteps] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (!mode || mode === "installed") return null;

  const handleClick = () => (mode === "prompt" ? promptInstall() : setShowSteps((s) => !s));

  if (variant === "menu") {
    return (
      <>
        <button className="menu-link-btn" onClick={handleClick}>📲 Add to Home Screen</button>
        {showSteps && <div className="menu-install"><IosInstallSteps /></div>}
      </>
    );
  }

  if (dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Not saved; it will show again next time.
    }
  }

  return (
    <section className="card install-card">
      <img src="/icons/icon-192.png" alt="" className="install-icon" />
      <div className="install-text">
        <h2>Add the app to your Home Screen</h2>
        <p className="muted small">Open your daily practice in one tap, and get messages from David.</p>
      </div>
      <button className="btn btn-primary" onClick={handleClick}>
        {mode === "prompt" ? "Add to Home Screen" : showSteps ? "Hide instructions" : "Show me how"}
      </button>
      {showSteps && <IosInstallSteps />}
      <button className="btn btn-text" onClick={dismiss}>Not now</button>
    </section>
  );
}
