// The red number on the app's Home Screen icon: how many of today's tiles (morning,
// intention, evening review) are ready but not done yet. Works when the app is added
// to the Home Screen with notifications on (iPhone: iOS 16.4 or later). The number is
// also set by the notification itself (public/firebase-messaging-sw.js), so it
// appears even when the app is closed.
import { useEffect } from "react";

function setAppBadge(count) {
  try {
    if (!("setAppBadge" in navigator)) return;
    (count > 0 ? navigator.setAppBadge(count) : navigator.clearAppBadge()).catch(() => {});
  } catch {
    // Not supported here; nothing to show.
  }
}

// Keeps the icon's number in step with Home: <AppBadge count={2} /> (renders nothing).
export default function AppBadge({ count }) {
  useEffect(() => setAppBadge(count), [count]);
  return null;
}
