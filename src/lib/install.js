// "Add to Home Screen" support.
// Android and desktop Chrome/Edge fire a `beforeinstallprompt` event that we
// keep, so a button can open the real install prompt later. iPhones don't
// support this, so for them we show instructions instead.
import { useEffect, useState } from "react";

let deferredPrompt = null;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

// Called once from main.jsx, as early as possible.
export function captureInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // stop the browser's own mini-banner; we show our button instead
    deferredPrompt = e;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

export const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export const isInstalled = () =>
  window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

// Opens the browser's install prompt. Returns true if the member accepted.
export async function promptInstall() {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  notify();
  return outcome === "accepted";
}

// React hook: how this device can install the app.
// "prompt" = one-tap install, "ios" = show instructions, "installed", or null (not possible here).
export function useInstallMode() {
  const get = () => (isInstalled() ? "installed" : deferredPrompt ? "prompt" : isIOS() ? "ios" : null);
  const [mode, setMode] = useState(get);
  useEffect(() => {
    const update = () => setMode(get());
    listeners.add(update);
    return () => listeners.delete(update);
  }, []);
  return mode;
}
