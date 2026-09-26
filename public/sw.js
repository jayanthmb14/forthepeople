// ForThePeople.in Service Worker — Offline + Cache + Push Notifications
//
// v3 (2026-09): precache list now uses locale-prefixed URLs. "/", "/about"
// and "/offline" all redirect (or 404) because every page lives under
// /<locale>/ — cache.addAll() rejects the whole install when any entry is
// not a plain 200, so the service worker never installed and the offline
// page never worked. Bumping CACHE_NAME evicts the old broken cache.
const CACHE_NAME = "ftp-v3";
const OFFLINE_URL = "/en/offline";
const STATIC_ASSETS = [
  "/en",
  "/en/about",
  OFFLINE_URL,
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
];

// ── Install: cache static shell ────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: clear old caches ─────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first for API, cache-first for assets ──
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls: network-first, offline JSON response on failure
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: "offline", cached: false }), {
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    return;
  }

  // Navigation requests: network-first, offline page fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() =>
          caches.match(request).then(
            (cached) => cached ?? caches.match(OFFLINE_URL).then((off) => off ?? caches.match("/en"))
          )
        )
    );
    return;
  }

  // Static assets: cache-first, update in background
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request).then((response) => {
        if (
          response.ok &&
          request.method === "GET" &&
          (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/geo/"))
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return response;
      });
      return cached ?? networkFetch;
    })
  );
});

// ── Push Notifications ─────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = { title: "ForThePeople.in Alert", body: "New district update available.", district: "" };
  try {
    data = { ...data, ...(event.data?.json() ?? {}) };
  } catch {
    if (event.data?.text()) data.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/android-chrome-192x192.png",
      badge: "/android-chrome-192x192.png",
      tag: "ftp-alert",
      renotify: true,
      data: { url: data.district ? `/en/karnataka/${data.district}/alerts` : "/en" },
    })
  );
});

// ── Notification click — open the relevant page ────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/en";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
