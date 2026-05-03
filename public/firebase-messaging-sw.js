importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyB4DTCXQWrMzrio1OmxwVPjKeGdX7vTHZ4",
  authDomain: "sportner-4746a.firebaseapp.com",
  projectId: "sportner-4746a",
  storageBucket: "sportner-4746a.firebasestorage.app",
  messagingSenderId: "318493173925",
  appId: "1:318493173925:web:5f84875d3de02d2e1b454c"
});

const messaging = firebase.messaging();

// 🔔 BACKGROUND MESSAGE
messaging.onBackgroundMessage(function(payload) {
  console.log('Background message received:', payload);

  // ❗ АКО Firebase вече е показал notification → нищо не правим
  if (payload.notification) {
    return;
  }

  const data = payload.data || {};

  const title = data.title || "Sportner";
  const body = data.body || "";

  self.registration.showNotification(title, {
    body: body,
    icon: "/icon-192.png",
    data: {
      url: data.link || "/"
    }
  });
});

self.addEventListener("notificationclick", function(event) {
  event.notification.close();

  const url =
    event.notification?.data?.url ||
    "https://sportner.online/notifications-list";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {

        for (const client of clientList) {
          if (client.url.includes("sportner.online")) {

            // 🔥 опит 1
            if ("navigate" in client) {
              return client.navigate(url).then(() => client.focus());
            }

            // 🔥 fallback
            client.postMessage({ type: "NAVIGATE", url });
            return client.focus();
          }
        }

        return clients.openWindow(url);
      })
  );
});
