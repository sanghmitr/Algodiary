self.addEventListener("push", (event) => {
  const text = event.data ? event.data.text() : "Algodiary reminder";
  const [title, ...bodyParts] = text.split("\n");
  event.waitUntil(
    self.registration.showNotification(title || "Algodiary", {
      body: bodyParts.join("\n") || "You have a new update.",
      icon: "/favicon.svg",
      badge: "/favicon.svg",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow("/dashboard"));
});

