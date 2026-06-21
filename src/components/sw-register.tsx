"use client"

import { useEffect } from "react"

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      let registration: ServiceWorkerRegistration | null = null

      async function register() {
        try {
          registration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
            updateViaCache: "none",
          })

          console.log("[SW] Registered:", registration.scope)

          // Check for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration?.installing
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  try {
                    if (confirm("A new version of TrustBank360 is available. Reload to update?")) {
                      newWorker.postMessage({ type: "SKIP_WAITING" })
                      window.location.reload()
                    }
                  } catch {
                    // confirm() may fail in some offline contexts
                  }
                }
              })
            }
          })
        } catch (error) {
          console.warn("[SW] Registration failed:", error)
        }
      }

      // Listen for messages from SW
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "SYNC_TRIGGER") {
          window.dispatchEvent(new CustomEvent("sync-required"))
        }
        if (event.data?.type === "SYNC_AUDIT_LOGS") {
          window.dispatchEvent(new CustomEvent("sync-audit-logs"))
        }
      })

      // Register on mount
      register()

      // Re-register on network recovery
      window.addEventListener("online", () => {
        if (registration) {
          registration.update().catch(() => {})
        }
      })

      // Periodic update check (every 30 minutes)
      const interval = setInterval(() => {
        if (registration) {
          registration.update().catch(() => {})
        }
      }, 30 * 60 * 1000)

      return () => {
        clearInterval(interval)
      }
    }
  }, [])

  return null
}
