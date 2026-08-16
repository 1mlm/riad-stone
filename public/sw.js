// bare minimum so Chrome/Android considers the app installable — a
// registered service worker with a fetch handler is one of Chrome's
// installability requirements. No caching here yet: real offline behavior
// is a separate, deliberate follow-up.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // intentionally not intercepting requests yet
});
