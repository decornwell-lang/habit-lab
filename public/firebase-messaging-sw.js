// Service worker for push notifications. It runs in the background, even
// when the app isn't open, and shows messages sent from Admin → Messages.
// The Firebase settings are passed in by src/lib/push.js when it registers this file.
importScripts("https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js");

const config = JSON.parse(new URL(self.location).searchParams.get("config") || "{}");
firebase.initializeApp(config);
const messaging = firebase.messaging();

// Show the notification when a message arrives in the background.
messaging.onBackgroundMessage((payload) => {
  const { title = "David Ernest Cornwell", body = "", link = "/dashboard", kind = "message" } = payload.data || {};
  return self.registration.showNotification(title, {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: kind === "reminder" ? "checkin-reminder" : "david-message", // a new one replaces the previous one
    renotify: true,
    data: { link },
  });
});

// Open the app when the notification is tapped.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link || "/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => w.url.startsWith(self.location.origin));
      if (open) {
        open.navigate(link);
        return open.focus();
      }
      return clients.openWindow(link);
    })
  );
});
