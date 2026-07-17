"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCw, X } from "lucide-react"
import { useOfflineStore } from "@/store/offline-store"
import { useNetworkStore } from "@/store/network-store"

const DISMISS_KEY = "tb360_update_dismissed"

export function UpdateBanner() {
  const updateAvailable = useOfflineStore((s) => s.updateAvailable)
  const waitingWorker = useOfflineStore((s) => s.waitingWorker)
  const isOnline = useNetworkStore((s) => s.isOnline)
  const [dismissed, setDismissed] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const dismissedVersion = sessionStorage.getItem(DISMISS_KEY)
      if (dismissedVersion === "true") setDismissed(true)
    } catch {}
  }, [])

  const handleRefresh = useCallback(async () => {
    setUpdating(true)
    try {
      // Sync pending data before activating
      if (waitingWorker && isOnline) {
        waitingWorker.postMessage({ type: "SYNC_BEFORE_UPDATE" })
        // Wait for sync or timeout after 10s
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(resolve, 10000)
          const handler = (event: MessageEvent) => {
            if (event.data?.type === "SYNC_COMPLETE") {
              clearTimeout(timeout)
              navigator.serviceWorker.removeEventListener("message", handler)
              resolve()
            }
          }
          navigator.serviceWorker.addEventListener("message", handler)
        })
      }

      // Activate new SW
      if (waitingWorker) {
        waitingWorker.postMessage({ type: "SKIP_WAITING" })
      }
      window.location.reload()
    } catch {
      window.location.reload()
    }
  }, [waitingWorker, isOnline])

  const handleDismiss = useCallback(() => {
    setDismissed(true)
    try {
      sessionStorage.setItem(DISMISS_KEY, "true")
    } catch {}
  }, [])

  if (!updateAvailable || dismissed) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-emerald-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <RefreshCw className="h-3.5 w-3.5" />
            </div>
            <p className="text-sm font-medium truncate">
              TrustBank360 has been updated with improvements and fixes.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleRefresh}
              disabled={updating}
              className="px-3.5 py-1.5 bg-white text-emerald-700 text-sm font-semibold rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-60"
            >
              {updating ? (
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Updating...
                </span>
              ) : (
                "Refresh Now"
              )}
            </button>
            <button
              onClick={handleDismiss}
              disabled={updating}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-60"
              aria-label="Dismiss update notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
