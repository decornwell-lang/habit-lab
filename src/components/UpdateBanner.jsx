// UpdateBanner: Home Screen apps on iPhone stay open in the background, so
// members can be looking at an old version for days. Each time the app comes
// back into view, this checks whether a newer version has been published and,
// if so, shows a small "Update" banner.
import { useEffect, useState } from "react";

// The current build's main script, e.g. /assets/index-AbC123.js (absent in local dev).
function currentBuild() {
  const script = document.querySelector('script[type="module"][src*="/assets/"]');
  return script ? new URL(script.src).pathname : null;
}

async function latestBuild() {
  const res = await fetch("/", { cache: "no-store" });
  const html = await res.text();
  return html.match(/\/assets\/index-[\w-]+\.js/)?.[0] || null;
}

export default function UpdateBanner() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    const mine = currentBuild();
    if (!mine) return; // local development: nothing to compare

    async function check() {
      if (document.visibilityState !== "visible") return;
      try {
        const latest = await latestBuild();
        if (latest && latest !== mine) setAvailable(true);
      } catch {
        // Offline: try again next time.
      }
    }

    check();
    document.addEventListener("visibilitychange", check);
    const timer = setInterval(check, 30 * 60 * 1000); // and every 30 minutes
    return () => {
      document.removeEventListener("visibilitychange", check);
      clearInterval(timer);
    };
  }, []);

  if (!available) return null;

  return (
    <div className="update-banner" role="status">
      <span>A new version is ready.</span>
      <button onClick={() => window.location.reload()}>Update</button>
    </div>
  );
}
