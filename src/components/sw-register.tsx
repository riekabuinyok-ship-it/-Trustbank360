"use client"

import { useEffect, useRef, useCallback } from "react"
import { useOfflineStore } from "@/store/offline-store"
import { useNetworkStore } from "@/store/network-store"
import { getPendingCount } from "@/lib/db/sync-queue"
import { isNewVersion, setStoredVersion, logUpdate, APP_VERSION } from "@/lib/app-version"

// Pages where auto-refresh is safe (no active forms or editable data)
const SAFE_AUTO_REFRESH_PATHS = new Set([
  "/login",
  "/signup",
  "/",
  "/features",
  "/pricing",
  "/about",
  "/contact",
  "/help",
  "/track",
  "/offline",
  "/try-demo",
  "/company/dashboard",
])

// Pages with active forms — never auto-refresh here
const FORM_PAGE_PATTERNS = [
  "/company/transfers/new",
  "/company/deposit",
  "/company/withdrawal",
  "/company/settings",
  "/company/branches/new",
  "/company/staff/new",
  "/company/commissions",
  "/company/exchange-rates",
  "/company/announcements/",
  "/company/report-problem",
]

const IDLE_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes
const SYNC_TIMEOUT_MS = 10 * 1000 // 10 seconds

export function ServiceWorkerRegister() {
  const lastActivityRef = useRef<number>(Date.now())
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null)
  const updateCheckRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Track user activity (mouse, keyboard, touch, scroll)
  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
  }, [])

  // Determine if auto-refresh is safe
  const canAutoRefresh = useCallback(async (): Promise<boolean> => {
    const path = window.location.pathname

    // Login and public pages — always safe
    if (SAFE_AUTO_REFRESH_PATHS.has(path)) return true

    // Public pages (exact match)
    const PUBLIC_PATHS = ["/features", "/pricing", "/about", "/contact", "/help", "/track", "/privacy", "/terms", "/forgot-password", "/exchange-rates", "/tutorials"]
    if (PUBLIC_PATHS.includes(path)) return true

    // Form pages — never auto-refresh
    if (FORM_PAGE_PATTERNS.some((p) => path.startsWith(p))) return false

    // Check for pending sync queue — never auto-refresh with pending data
    try {
      const pending = await getPendingCount()
      if (pending > 0) return false
    } catch {
      // If we can't check, err on the side of caution
      return false
    }

    // Check idle time
    const idleTime = Date.now() - lastActivityRef.current
    if (idleTime < IDLE_THRESHOLD_MS) return false

    // Dashboard with no pending changes — safe
    if (path.startsWith("/company/dashboard")) return true

    // Any other company page — only safe if idle
    if (path.startsWith("/company/")) return true

    return false
  }, [])

  // Perform the actual update (sync first, then activate)
  const performUpdate = useCallback(async (worker: ServiceWorker) => {
    // Step 1: Request sync of pending data
    if (useNetworkStore.getState().isOnline) {
      worker.postMessage({ type: "SYNC_BEFORE_UPDATE" })
      try {
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(resolve, SYNC_TIMEOUT_MS)
          const handler = (event: MessageEvent) => {
            if (event.data?.type === "SYNC_COMPLETE") {
              clearTimeout(timeout)
              navigator.serviceWorker.removeEventListener("message", handler)
              resolve()
            }
          }
          navigator.serviceWorker.addEventListener("message", handler)
        })
      } catch {
        // Timeout or error — proceed anyway after 10s
      }
    }

    // Step 2: Activate new SW
    worker.postMessage({ type: "SKIP_WAITING" })

    // Step 3: Log the update
    const oldVersion = localStorage.getItem("tb360_app_version") || "unknown"
    logUpdate(oldVersion, APP_VERSION)
    setStoredVersion(APP_VERSION)

    // Step 4: Reload
    setTimeout(() => window.location.reload(), 200)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return

    // Register user activity listeners
    const activityEvents = ["mousedown", "keydown", "touchstart", "scroll"]
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    async function register() {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        })
        registrationRef.current = registration

        console.log("[SW] Registered:", registration.scope)

        // Check for updates when SW is already installed
        if (registration.waiting) {
          handleWaitingWorker(registration.waiting)
        }

        // Listen for new SW installing
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New SW is waiting — decide whether to auto-refresh or show banner
              handleWaitingWorker(newWorker)
            }
          })
        })

        // Check for updates periodically (every 30 minutes)
        updateCheckRef.current = setInterval(() => {
          registration.update().catch(() => {})
        }, 30 * 60 * 1000)
      } catch (error) {
        console.error("[SW] Registration failed:", error)
      }
    }

    async function handleWaitingWorker(worker: ServiceWorker) {
      // Set update available in store (shows banner)
      useOfflineStore.getState().setUpdateAvailable(true, worker)

      // Decide: auto-refresh or show banner
      const safe = await canAutoRefresh()

      if (safe) {
        console.log("[SW] Safe to auto-refresh — performing silent update")
        await performUpdate(worker)
      } else {
        console.log("[SW] Active session detected — showing update banner")
        // Banner is already shown via store — user clicks "Refresh Now"
      }
    }

    // Listen for messages from SW
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "SYNC_TRIGGER") {
        window.dispatchEvent(new CustomEvent("sync-required"))
      }
    })

    // Re-register on network recovery
    const handleOnline = () => {
      if (registrationRef.current) {
        registrationRef.current.update().catch(() => {})
      }
    }
    window.addEventListener("online", handleOnline)

    register()

    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity)
      })
      window.removeEventListener("online", handleOnline)
      if (updateCheckRef.current) clearInterval(updateCheckRef.current)
    }
  }, [handleActivity, canAutoRefresh, performUpdate])

  return null
}
