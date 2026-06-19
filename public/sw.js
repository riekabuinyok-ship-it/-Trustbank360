// TrustBank360 Service Worker v1.0.0
// Offline-first financial platform for low-connectivity regions

const CACHE_VERSION = "v1"
const STATIC_CACHE = `trustbank360-static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `trustbank360-dynamic-${CACHE_VERSION}`
const API_CACHE = `trustbank360-api-${CACHE_VERSION}`
const ASSET_CACHE = `trustbank360-assets-${CACHE_VERSION}`

const STATIC_ASSETS = [
  "/",
  "/login",
  "/offline",
  "/manifest.json",
  "/images/icons/icon-192.png",
  "/images/icons/icon-512.png",
]

const API_CACHE_ROUTES = [
  "/api/company/dashboard-alerts",
  "/api/exchange-rates",
  "/api/company/announcements",
  "/api/dashboard",
  "/api/heartbeat",
]

const NETWORK_ONLY_ROUTES = [
  "/api/auth/",
  "/api/payments/",
  "/api/sync",
  "/api/transfers",
]

const STALE_WHILE_REVALIDATE_ROUTES = [
  "/api/company/",
  "/api/branches",
  "/api/staff",
  "/api/customers",
  "/api/wallets",
  "/api/notifications",
  "/api/messages",
]

// ---- INSTALL ----
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
})

// ---- ACTIVATE ----
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key !== STATIC_CACHE &&
                key !== DYNAMIC_CACHE &&
                key !== API_CACHE &&
                key !== ASSET_CACHE
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

// ---- FETCH ----
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and browser extension requests
  if (request.method !== "GET" || !url.protocol.startsWith("http")) return
  if (url.origin !== self.location.origin) return

  // Network-only for sensitive routes
  if (NETWORK_ONLY_ROUTES.some((route) => url.pathname.startsWith(route))) {
    return event.respondWith(networkOnlyWithFallback(request))
  }

  // Cache-first for static assets
  if (
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/images/") ||
    url.pathname === "/manifest.json"
  ) {
    return event.respondWith(cacheFirst(request, STATIC_CACHE))
  }

  // Cache-first for navigation (HTML)
  if (request.mode === "navigate") {
    return event.respondWith(networkFirstWithFallback(request, STATIC_CACHE))
  }

  // Network-first for API routes
  if (url.pathname.startsWith("/api/")) {
    if (API_CACHE_ROUTES.some((route) => url.pathname.startsWith(route))) {
      return event.respondWith(networkFirstWithFallback(request, API_CACHE))
    }
    if (STALE_WHILE_REVALIDATE_ROUTES.some((route) => url.pathname.startsWith(route))) {
      return event.respondWith(staleWhileRevalidate(request, API_CACHE))
    }
    return event.respondWith(networkFirstWithFallback(request, API_CACHE))
  }

  // Stale-while-revalidate for everything else
  return event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE))
})

// ---- CACHE STRATEGIES ----

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return caches.match("/offline")
  }
}

async function networkFirstWithFallback(request, cacheName) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    if (request.mode === "navigate") return caches.match("/offline")
    return new Response(JSON.stringify({ offline: true, cached: false }), {
      headers: { "Content-Type": "application/json" },
    })
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone())
      return response
    })
    .catch(() => cached)

  return cached || fetchPromise
}

async function networkOnlyWithFallback(request) {
  try {
    return await fetch(request)
  } catch {
    return new Response(JSON.stringify({ offline: true, error: "Network required" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// ---- BACKGROUND SYNC ----
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-queue") {
    event.waitUntil(processSyncQueue())
  }
  if (event.tag === "sync-audit-logs") {
    event.waitUntil(syncAuditLogs())
  }
})

async function processSyncQueue() {
  try {
    const clients = await self.clients.matchAll({ type: "window" })
    for (const client of clients) {
      client.postMessage({ type: "SYNC_TRIGGER", payload: {} })
    }
  } catch {
    // Silently fail - will retry on next sync
  }
}

async function syncAuditLogs() {
  try {
    const clients = await self.clients.matchAll({ type: "window" })
    for (const client of clients) {
      client.postMessage({ type: "SYNC_AUDIT_LOGS", payload: {} })
    }
  } catch {
    // Silently fail - will retry on next sync
  }
}

// ---- PUSH NOTIFICATIONS ----
self.addEventListener("push", (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()
    const options = {
      body: data.message || data.body || "",
      icon: "/images/icons/icon-192.png",
      badge: "/images/icons/badge-72.png",
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: data.actions || [],
      tag: data.tag || "default",
      renotify: data.renotify || false,
      requireInteraction: data.requireInteraction || false,
    }
    event.waitUntil(
      self.registration.showNotification(
        data.title || "TrustBank360",
        options
      )
    )
  } catch {
    // Malformed push data
  }
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const url = event.notification.data?.url || "/company/dashboard"

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }
    })
  )
})

// ---- MESSAGE HANDLING ----
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
  if (event.data?.type === "CLEAR_CACHES") {
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
    )
  }
})
