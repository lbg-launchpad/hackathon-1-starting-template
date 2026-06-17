// Self-unregistering service worker.
//
// Earlier versions used a cache-first strategy that pinned stale JS/CSS
// during development. This replacement: skips waiting, clears all caches it
// owned, unregisters itself, and reloads any controlled tabs so the next
// page load fetches a fresh build directly from the network.

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      for (const c of clients) c.navigate(c.url);
    } catch (_err) { /* ignore */ }
  })());
});

self.addEventListener("fetch", (e) => {
  // Pass-through to network only — no caching.
  e.respondWith(fetch(e.request).catch(() => new Response("", { status: 504 })));
});
