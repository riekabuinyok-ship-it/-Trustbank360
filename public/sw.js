// TrustBank360 Service Worker v7.0.0
// Offline-first PWA — ChunkLoadError-free deployment strategy
//
// Key design principle: NEVER cache Next.js hashed assets (/_next/static/*)
// or HTML pages with cache-first. Let the browser's built-in HTTP cache
// handle hashed chunks. The SW focuses on:
//   - Static app assets (icons, fonts, images, logos, manifest)
//   - Offline fallback (/offline.html)
//   - API pass-through (never caches authenticated routes)
//   - Graceful degradation (never returns 503)
//
// Strategies:
//  - Cache-first: static app assets only (icons, fonts, images, logos, manifest)
//  - Network-only (pass-through): /_next/static/*, HTML pages, auth routes, user API routes
//  - Network-first with fallback: only used for API routes that benefit from caching
//  - Graceful offline: /offline.html for failed navigations, empty 200 for sub-resources

const CACHE_VERSION = "v7"
const STATIC_CACHE = `tb360-static-${CACHE_VERSION}`
const API_CACHE = `tb360-api-${CACHE_VERSION}`

// ---- PRECACHE LIST ----
// Only truly static assets that we control and never change with deployments
const PRECACHE_URLS = [
  // Offline fallback (self-contained static HTML, zero JS dependencies)
  "/offline.html",

  // PWA manifest + SW itself
  "/manifest.json",

  // ALL manifest icons (7 sizes)
  "/images/icons/icon-72.png",
  "/images/icons/icon-96.png",
  "/images/icons/icon-128.png",
  "/images/icons/icon-144.png",
  "/images/icons/icon-152.png",
  "/images/icons/icon-192.png",
  "/images/icons/icon-512.png",

  // PWA shortcut icons
  "/images/icons/dashboard-192.png",
  "/images/icons/transfer-192.png",
  "/images/icons/sync-192.png",

  // Logos
  "/images/logo.svg",
  "/images/logo-white.svg",

  // Placeholder image for offline missing assets
  "/images/icons/icon.svg",
]

// ---- INSTALL ----
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

// ---- ACTIVATE ----
// Wipe ALL old-versioned caches, then claim clients
self.addEventListener("activate", (event) => {
  const expectedCaches = new Set([STATIC_CACHE, API_CACHE])
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

// ---- HELPER: get offline.html from cache ----
async function getOfflinePage() {
  const cached = await caches.match("/offline.html")
  if (cached) return cached
  // Last resort: bare-minimum HTML response
  return new Response(
    "<!DOCTYPE html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width'><title>Offline</title></head><body style='display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui;text-align:center;padding:24px'><div><h1>You're Offline</h1><p>Check your connection and try again.</p></div></body></html>",
    { headers: { "Content-Type": "text/html" } }
  )
}

// ---- CACHE-FIRST: static app assets (icons, fonts, images, logos) ----
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      try {
        const cache = await caches.open(cacheName)
        cache.put(request, response.clone())
      } catch {}
    }
    return response
  } catch {
    // Network failed and not in cache
    if (request.mode === "navigate") {
      return getOfflinePage()
    }
    return new Response("", {
      status: 200,
      headers: { "Content-Type": getMimeType(request.url) },
    })
  }
}

// ---- NETWORK-ONLY: pass-through with offline fallback ----
// Uses Promise.resolve().then(fetch) to ensure the fetch rejection is caught
// before the browser logs it as a failed request in DevTools.
function networkOnlyFallback(request) {
  return new Response("", {
    status: 200,
    headers: { "Content-Type": getMimeType(request.url) },
  })
}

async function networkOnly(request) {
  try {
    const response = await fetch(request)
    return response
  } catch {
    try {
      if (request.mode === "navigate") {
        return getOfflinePage()
      }
      return networkOnlyFallback(request)
    } catch {
      return new Response("", { status: 200 })
    }
  }
}

// Guess MIME type from URL for offline fallback responses
function getMimeType(url) {
  const ext = url.split(".").pop()?.toLowerCase() || ""
  const types = {
    js: "application/javascript",
    css: "text/css",
    json: "application/json",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    svg: "image/svg+xml",
    ico: "image/x-icon",
    webp: "image/webp",
    gif: "image/gif",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    otf: "font/otf",
    eot: "application/vnd.ms-fontobject",
    html: "text/html",
  }
  return types[ext] || "application/octet-stream"
}

// ---- FETCH ROUTER ----
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle GET requests from same origin
  if (request.method !== "GET") return
  if (url.origin !== self.location.origin) return

  // Skip HMR
  if (url.pathname.startsWith("/_next/webpack-hmr")) return

  // 1. NEXT.JS HASHED ASSETS — network-only (NEVER cache)
  //    Next.js sets immutable cache headers on these. The browser's built-in
  //    HTTP cache handles them correctly across deployments. Caching them in
  //    the SW causes ChunkLoadError when old cached chunks reference removed files.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(networkOnly(request))
    return
  }

  // 2. NEXT.JS DATA FETCHES — network-only (never cache stale data)
  if (url.pathname.startsWith("/_next/data/")) {
    event.respondWith(networkOnly(request))
    return
  }

  // 3. AUTH ROUTES — pass through to network
  //    IMPORTANT: Do NOT intercept /api/auth/csrf — the browser must handle
  //    Set-Cookie directly. SW interception can prevent CSRF cookies from
  //    being applied to the document, which breaks signIn.
  if (url.pathname === "/api/auth/csrf") return

  if (url.pathname.startsWith("/api/auth")) {
    event.respondWith(
      Promise.resolve().then(() => fetch(request)).catch(() =>
        new Response(JSON.stringify({ error: "Offline" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    )
    return
  }

  // 4. USER-SCOPED API ROUTES — never cache (prevent cross-company leaks)
  if (url.pathname.startsWith("/api/")) {
    const NO_CACHE_APIS = [
      "/api/transfers", "/api/customers", "/api/staff", "/api/branches",
      "/api/dashboard", "/api/exchange-rates", "/api/commissions",
      "/api/company", "/api/user", "/api/audit-logs", "/api/fraud-alerts",
      "/api/notifications", "/api/messages", "/api/reports", "/api/sync",
      "/api/admin/", "/api/plan", "/api/providers",
    ]
    const shouldSkipCache = NO_CACHE_APIS.some((prefix) => url.pathname.startsWith(prefix))
    if (shouldSkipCache) {
      event.respondWith(
        Promise.resolve().then(() => fetch(request)).catch(() =>
          new Response(JSON.stringify({ error: "Offline" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      )
      return
    }
    // Other API routes (public rates, stats, etc.) — network-only
    event.respondWith(networkOnly(request))
    return
  }

  // 5. STATIC APP ASSETS — cache-first (icons, fonts, images, logos, manifest)
  //    These files don't change between deployments and are safe to cache permanently.
  const isStaticAppAsset =
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname === "/manifest.json" ||
    url.pathname === "/sw.js" ||
    /\.(woff2?|ttf|otf|eot|png|jpg|jpeg|gif|webp|ico|svg)$/i.test(url.pathname)

  if (isStaticAppAsset) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // 6. HTML PAGES / NAVIGATIONS — network-only with offline fallback
  //    NEVER serve cached HTML — stale HTML references old chunk filenames
  //    that no longer exist on the server, causing ChunkLoadError.
  if (request.mode === "navigate") {
    event.respondWith(networkOnly(request))
    return
  }

  // 7. Everything else — network-only
  event.respondWith(networkOnly(request))
})

// ---- MESSAGE HANDLING ----
self.addEventListener("message", (event) => {
  const { data } = event

  if (data?.type === "SKIP_WAITING") {
    self.skipWaiting()
  }

  if (data?.type === "CLEAR_CACHES") {
    event.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
    )
  }

  if (data?.type === "GET_VERSION") {
    // Respond to version queries from the client
    event.source?.postMessage({ type: "SW_VERSION", version: CACHE_VERSION })
  }

  if (data?.type === "SYNC_BEFORE_UPDATE") {
    // Acknowledge after a safety timeout — the client handles actual sync
    event.waitUntil(
      new Promise((resolve) => {
        setTimeout(() => {
          event.source?.postMessage({ type: "SYNC_COMPLETE" })
          resolve()
        }, 10000)
      })
    )
  }
})
