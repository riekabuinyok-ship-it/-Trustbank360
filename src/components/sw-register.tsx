"use client"

import { useEffect } from "react"

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return

    // The user's request: check for service worker support
    if (!("serviceWorker" in navigator)) {
      console.log("[SW] Service workers are not supported in this browser")
      return
    }

    let registration: ServiceWorkerRegistration | null = null
    let updateInterval: ReturnType<typeof setInterval> | null = null

    async function register() {
      try {
        registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        })

        // Log success
        console.log("[SW] Registered successfully:", {
          scope: registration.scope,
          scriptURL: registration.active?.scriptURL || "/sw.js",
        })

        // Check for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration?.installing
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New version available — auto-activate on next page load
                console.log("[SW] New version installed, will activate on next page load")
                try {
                  if (window.confirm("A new version of TrustBank360 is available. Reload to update?")) {
                    newWorker.postMessage({ type: "SKIP_WAITING" })
                    window.location.reload()
                  }
                } catch {
                  // confirm() may fail in some contexts
                }
              }
            })
          }
        })
      } catch (error) {
        // Log failure
        console.error("[SW] Registration failed:", error)
      }
    }

    // Listen for messages from SW
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "SYNC_TRIGGER") {
        window.dispatchEvent(new CustomEvent("sync-required"))
      }
    })

    // Register on mount
    register()

    // Re-register / refresh on network recovery
    window.addEventListener("online", () => {
      if (registration) {
        registration.update().catch(() => {})
      }
    })

    // Periodic update check (every 30 minutes)
    updateInterval = setInterval(() => {
      if (registration) {
        registration.update().catch(() => {})
      }
    }, 30 * 60 * 1000)

    return () => {
      if (updateInterval) clearInterval(updateInterval)
    }
  }, [])

  return null
}
