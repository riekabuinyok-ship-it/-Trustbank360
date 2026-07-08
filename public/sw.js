// TrustBank360 Service Worker v3.0.0
// Basic PWA: offline-first financial platform for low-connectivity regions
//
// Strategies:
//  - Cache-first, falling back to network (static assets: HTML, CSS, JS, images, fonts)
//  - Network-first, falling back to cache (dynamic/API content)
//  - Custom offline fallback page when both cache and network fail
//  - Versioned cache names with automatic cleanup of old caches on activate

const CACHE_VERSION = "v3"
const STATIC_CACHE = `tb360-static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `tb360-dynamic-${CACHE_VERSION}`
const API_CACHE = `tb360-api-${CACHE_VERSION}`

// ---- PRECACHE LIST ----
// Core static assets: HTML pages, manifest, icons, and key images.
// These are precached on install so the shell works offline immediately.
const PRECACHE_URLS = [
  "/",
  "/offline",
  "/manifest.json",
  "/images/icons/icon-192.png",
  "/images/icons/icon-512.png",
  "/images/logo.svg",
  "/images/logo-white.svg",
]

// ---- INSTALL ----
// Precache the shell. skipWaiting() activates the new SW immediately.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

// ---- ACTIVATE ----
// Clean up old caches that don't match the current version, then claim clients.
self.addEventListener("activate", (event) => {
  const expectedCaches = new Set([STATIC_CACHE, DYNAMIC_CACHE, API_CACHE])
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !expectedCaches.has(key))
            .map((key) => {
              console.log("[SW] Deleting old cache:", key)
              return caches.delete(key)
            })
        )
      )
      .then(() => self.clients.claim())
  )
})

// ---- FETCH STRATEGIES ----

// Cache-first: try cache, fall back to network, fall back to offline page.
// Best for static assets that don't change often (HTML, CSS, JS, images, fonts).
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
  } catch (err) {
    // For navigation requests, serve the offline page
    if (request.mode === "navigate") {
      const offline = await caches.match("/offline")
      if (offline) return offline
    }
    throw err
  }
}

// Network-first: try network, fall back to cache, fall back to offline page.
// Best for dynamic/API content where freshness matters more than speed.
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch (err) {
    const cached = await caches.match(request)
    if (cached) return cached
    if (request.mode === "navigate") {
      const offline = await caches.match("/offline")
      if (offline) return offline
    }
    throw err
  }
}

// ---- FETCH ROUTER ----
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests and cross-origin requests
  if (request.method !== "GET") return
  if (url.origin !== self.location.origin) return

  // Skip browser-internal requests
  if (url.pathname.startsWith("/_next/webpack-hmr")) return
  if (url.pathname.startsWith("/_next/data")) return

  // 1. STATIC ASSETS — cache-first
  //   Includes Next.js static chunks, public images, manifest, fonts
  const isStaticAsset =
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname === "/manifest.json" ||
    url.pathname === "/sw.js" ||
    /\.(css|js|woff2?|ttf|otf|eot|svg|png|jpg|jpeg|gif|webp|ico)$/i.test(url.pathname)

  if (isStaticAsset) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // 2. API/DYNAMIC CONTENT — network-first
  //   Includes all /api/* routes and Next.js server-rendered pages
  const isApi = url.pathname.startsWith("/api/")
  if (isApi) {
    event.respondWith(networkFirst(request, API_CACHE))
    return
  }

  // 3. HTML PAGES (navigation requests) — network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE))
    return
  }

  // 4. Everything else (images loaded via Next/Image, etc.) — cache-first
  event.respondWith(cacheFirst(request, DYNAMIC_CACHE))
})

// ---- MESSAGE HANDLING ----
// Allows the page to send commands to the SW (e.g. SKIP_WAITING on update).
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
  if (event.data?.type === "CLEAR_CACHES") {
    event.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
    )
  }
})
