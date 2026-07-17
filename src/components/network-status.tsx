"use client"

import { useEffect, useState } from "react"
import { useNetworkStore } from "@/store/network-store"
import { useSyncStore } from "@/store/sync-store"
import { Wifi, WifiOff, RefreshCw, Loader2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

function timeAgo(timestamp: number | null): string {
  if (!timestamp) return "Never"
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(timestamp).toLocaleDateString()
}

export function NetworkStatusBar() {
  const status = useNetworkStore((s) => s.status)
  const isSyncing = useNetworkStore((s) => s.isSyncing)
  const lastSyncAt = useSyncStore((s) => s.lastSyncAt)
  const pendingCount = useSyncStore((s) => s.syncStats.pendingCount)
  const [dismissed, setDismissed] = useState(false)

  // Re-show when status changes
  useEffect(() => {
    if (status === "offline" || status === "syncing") {
      setDismissed(false)
    }
  }, [status])

  if (status === "online" && !isSyncing && pendingCount === 0 && dismissed) return null
  if (status === "online" && !isSyncing && pendingCount === 0) {
    // Auto-hide after 5 seconds when fully synced
    const [autoHide, setAutoHide] = useState(false)
    useEffect(() => {
      const t = setTimeout(() => setAutoHide(true), 5000)
      return () => clearTimeout(t)
    }, [])
    if (autoHide) return null
  }

  return (
    <div
      className={cn(
        "sticky top-0 z-50 w-full flex items-center justify-between gap-3 px-4 py-1.5 text-xs font-medium transition-all duration-300 border-b",
        status === "online" && !isSyncing && "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900",
        status === "offline" && "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900",
        status === "syncing" && "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900"
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {status === "online" && !isSyncing && (
          <>
            <Wifi className="h-3.5 w-3.5 shrink-0" />
            <span>Online</span>
            {pendingCount > 0 && (
              <span className="opacity-75">— {pendingCount} pending sync</span>
            )}
          </>
        )}
        {status === "offline" && (
          <>
            <WifiOff className="h-3.5 w-3.5 shrink-0" />
            <span>Offline — working from local data</span>
            {pendingCount > 0 && (
              <span className="opacity-75">({pendingCount} pending)</span>
            )}
          </>
        )}
        {isSyncing && (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
            <span>Synchronizing...</span>
            {pendingCount > 0 && (
              <span className="opacity-75">({pendingCount} remaining)</span>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="opacity-60 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Last sync: {timeAgo(lastSyncAt)}
        </span>
        {status === "online" && !isSyncing && pendingCount === 0 && (
          <button
            onClick={() => setDismissed(true)}
            className="opacity-50 hover:opacity-100 text-xs"
          >
            &times;
          </button>
        )}
      </div>
    </div>
  )
}

export function NetworkStatusIndicator() {
  return <NetworkStatusBar />
}

export function SyncBadge() {
  const pendingCount = useSyncStore((s) => s.syncStats.pendingCount)
  if (pendingCount === 0) return null
  return (
    <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[8px] font-bold flex items-center justify-center">
      {pendingCount > 9 ? "9+" : pendingCount}
    </span>
  )
}
