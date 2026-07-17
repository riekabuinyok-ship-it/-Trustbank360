"use client"

import { useState, useEffect } from "react"
import { useNetworkStore } from "@/store/network-store"
import { useSyncStore } from "@/store/sync-store"
import { WifiOff, Loader2, X } from "lucide-react"

export function OfflineBanner() {
  const status = useNetworkStore((s) => s.status)
  const isSyncing = useSyncStore((s) => s.isSyncing)
  const [dismissed, setDismissed] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (status === "offline") {
      setVisible(true)
      setDismissed(false)
    } else {
      const timer = setTimeout(() => setVisible(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [status])

  if (!visible || dismissed) return null

  return (
    <div className="sticky top-0 z-40 w-full">
      <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {status === "offline" ? (
            <WifiOff className="h-4 w-4 flex-shrink-0" />
          ) : isSyncing ? (
            <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
          ) : null}
          <span className="font-medium">
            {status === "offline"
              ? "Offline Mode — Changes will sync when connection is restored"
              : isSyncing
              ? "Synchronizing your data..."
              : "Back online — Syncing changes..."}
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="ml-4 p-1 rounded hover:bg-white/20 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
