// iPhone Home Screen app: after the share sheet (or another app) closes, Safari sometimes
// keeps the screen measured too short, so the tab bar and the dark background are drawn
// halfway up the page. A tiny scroll when the app comes back makes Safari measure again.
function remeasure() {
  setTimeout(() => {
    const y = window.scrollY;
    window.scrollTo(window.scrollX, y + 1);
    window.scrollTo(window.scrollX, y);
    window.dispatchEvent(new Event("resize"));
  }, 250);
}

export function fixViewportOnReturn() {
  window.addEventListener("focus", remeasure);
  window.addEventListener("pageshow", remeasure);
  document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && remeasure());
}

// Also after a share sheet closes, which doesn't always count as leaving the app.
export const afterShare = remeasure;
