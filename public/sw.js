// TrustBank360 Service Worker v3.5.0
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
  "/login",
  "/signup",
  "/features",
  "/pricing",
  "/about",
  "/contact",
  "/help",
  "/track",
  "/privacy",
  "/terms",
  "/forgot-password",
  "/manifest.json",
  "/images/icons/icon-192.png",
  "/images/icons/icon-512.png",
  "/images/logo.svg",
  "/images/logo-white.svg",
]

// Public static pages that are identical for all users (SSG).
// These use cache-first so they load instantly offline.
const PUBLIC_PAGES = new Set([
  "/", "/offline", "/login", "/signup", "/features",
  "/pricing", "/about", "/contact", "/help", "/track",
  "/privacy", "/terms", "/forgot-password", "/exchange-rates", "/tutorials",
])

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
// Never throws — returns 503 for uncached resources when offline.
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
    if (request.mode === "navigate") {
      const offline = await caches.match("/offline")
      if (offline) return offline
    }
    return new Response("", { status: 503, statusText: "Offline" })
  }
}

// Network-first: try network, fall back to cache, fall back to offline page.
// Best for dynamic/API content where freshness matters more than speed.
// Never throws — returns 503 for uncached resources when offline.
async function networkFirst(request, cacheName) {
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
    if (request.mode === "navigate") {
      const offline = await caches.match("/offline")
      if (offline) return offline
    }
    return new Response("", { status: 503, statusText: "Offline" })
  }
}

// ---- FETCH ROUTER ----
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests and cross-origin requests
  if (request.method !== "GET") return
  if (url.origin !== self.location.origin) return

  // Skip HMR only
  if (url.pathname.startsWith("/_next/webpack-hmr")) return

  // Skip auth routes entirely — never cache or intercept login/session/CSRF calls
  if (url.pathname.startsWith("/api/auth")) return

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

  // 2. NEXT.JS DATA FETCHES (client-side navigation) — network-first with cache
  if (url.pathname.startsWith("/_next/data")) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE))
    return
  }

  // 3. API/DYNAMIC CONTENT — network-only for authenticated routes, network-first with cache for public
  if (url.pathname.startsWith("/api/")) {
    // Never cache auth routes
    if (url.pathname.startsWith("/api/auth")) {
      event.respondWith(fetch(request))
      return
    }
    // Never cache user-specific API routes (company-scoped data)
    // These must always fetch fresh to prevent cross-company data leaks
    const NO_CACHE_APIS = [
      "/api/transfers", "/api/customers", "/api/staff", "/api/branches",
      "/api/dashboard", "/api/exchange-rates", "/api/commissions",
      "/api/company", "/api/user", "/api/audit-logs", "/api/fraud-alerts",
      "/api/notifications", "/api/messages", "/api/reports", "/api/sync",
      "/api/admin/", "/api/plan",
    ]
    const shouldSkipCache = NO_CACHE_APIS.some((prefix) => url.pathname.startsWith(prefix))
    if (shouldSkipCache) {
      event.respondWith(fetch(request))
      return
    }
    event.respondWith(networkFirst(request, API_CACHE))
    return
  }

  // 4. HTML PAGES (navigation requests)
  if (request.mode === "navigate") {
    // Clear API cache when navigating to login/logout to prevent cross-company data leaks
    if (url.pathname === "/login" || url.pathname === "/") {
      caches.delete(API_CACHE)
    }
    // Public SSG pages → cache-first (load instantly, always fresh from precache)
    if (PUBLIC_PAGES.has(url.pathname)) {
      event.respondWith(cacheFirst(request, STATIC_CACHE))
      return
    }
    // Authenticated/dynamic pages → network-first with offline fallback
    event.respondWith(networkFirst(request, DYNAMIC_CACHE))
    return
  }

  // 5. Everything else (images loaded via Next/Image, etc.) — cache-first
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
