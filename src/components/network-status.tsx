"use client"

import { useEffect, useState } from "react"
import { useNetworkStore, type NetworkStatus } from "@/store/network-store"
import { Wifi, WifiOff, RefreshCw, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function NetworkStatusIndicator() {
  const status = useNetworkStore((s) => s.status)
  const isSyncing = useNetworkStore((s) => s.isSyncing)
  const lastOnlineAt = useNetworkStore((s) => s.lastOnlineAt)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (status === "offline") {
      setVisible(true)
      setDismissed(false)
    } else if (status === "online" && !isSyncing) {
      // Auto-hide after 3 seconds when back online
      const timer = setTimeout(() => setVisible(false), 3000)
      return () => clearTimeout(timer)
    } else if (status === "syncing") {
      setVisible(true)
    }
  }, [status, isSyncing])

  if (!visible || dismissed) return null

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-sm font-medium transition-all duration-300",
        status === "online" && "bg-emerald-600 text-white",
        status === "offline" && "bg-red-600 text-white",
        status === "syncing" && "bg-amber-500 text-white"
      )}
    >
      {status === "online" && (
        <>
          <Wifi className="h-4 w-4" />
          <span>Online</span>
          <button
            onClick={() => setDismissed(true)}
            className="ml-1 opacity-70 hover:opacity-100"
          >
            &times;
          </button>
        </>
      )}
      {status === "offline" && (
        <>
          <WifiOff className="h-4 w-4" />
          <span>You are offline — cached content shown</span>
        </>
      )}
      {status === "syncing" && (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Synchronizing your data...</span>
        </>
      )}
    </div>
  )
}

export function SyncBadge() {
  // Small badge for sidebar nav items showing pending count
  return null
}
