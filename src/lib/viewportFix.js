// iPhone Home Screen app: after a video plays full screen, the share sheet closes, or the
// app comes back from the background, Safari sometimes keeps the page measured too short,
// so things pinned to the bottom (the tab bar) are drawn halfway up the screen.
// Two fixes:
//  1. --viewport-gap: how far the real visible bottom of the screen is below the bottom
//     Safari is using. The tab bar is moved down by that much (theme.css), so it sits on
//     the real bottom. Never negative, so the on-screen keyboard doesn't lift the tabs.
//  2. A tiny scroll, which usually makes Safari measure again.
function updateGap() {
  const vv = window.visualViewport;
  if (!vv) return;
  const gap = Math.max(0, Math.round(vv.height + vv.offsetTop - document.documentElement.clientHeight));
  document.documentElement.style.setProperty("--viewport-gap", `${gap}px`);
}

function remeasure() {
  updateGap();
  setTimeout(() => {
    const y = window.scrollY;
    window.scrollTo(window.scrollX, y + 1);
    window.scrollTo(window.scrollX, y);
    window.dispatchEvent(new Event("resize"));
    updateGap();
  }, 250);
}

export function fixViewportOnReturn() {
  updateGap();
  window.visualViewport?.addEventListener("resize", updateGap);
  window.visualViewport?.addEventListener("scroll", updateGap);
  window.addEventListener("resize", updateGap);
  window.addEventListener("orientationchange", remeasure);
  window.addEventListener("focus", remeasure); // also when a video's full screen closes
  window.addEventListener("pageshow", remeasure);
  document.addEventListener("fullscreenchange", remeasure);
  document.addEventListener("webkitfullscreenchange", remeasure);
  document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && remeasure());
}

// After a share sheet or a video pop-up closes.
export const afterShare = remeasure;
export const afterVideo = remeasure;
