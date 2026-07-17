// TrustBank360 Background Sync Hook
// v2: Adds visibility/focus triggers, faster interval

"use client"

import { useEffect, useRef } from "react"
import { useNetworkStore } from "@/store/network-store"
import { useSyncStore } from "@/store/sync-store"
import { syncAll } from "./sync-engine"

const SYNC_INTERVAL = 3 * 60 * 1000
const IMMEDIATE_SYNC_DELAY = 2000

export function useBackgroundSync() {
  const mounted = useRef(false)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()
  const syncInProgress = useRef(false)

  useEffect(() => {
    if (mounted.current) return
    mounted.current = true

    const performSync = async () => {
      if (syncInProgress.current) return
      const networkState = useNetworkStore.getState()
      if (!networkState.isOnline || networkState.isSyncing) return

      syncInProgress.current = true
      try {
        await syncAll()
      } catch {
        // Silent fail - retry next cycle
      } finally {
        syncInProgress.current = false
      }
    }

    // Sync on mount (if online)
    const networkState = useNetworkStore.getState()
    if (networkState.isOnline) {
      setTimeout(performSync, 2000)
    }

    const handleOnline = () => {
      setTimeout(performSync, IMMEDIATE_SYNC_DELAY)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const networkState = useNetworkStore.getState()
        if (networkState.isOnline && !networkState.isSyncing) {
          performSync()
        }
      }
    }

    const handleFocus = () => {
      const networkState = useNetworkStore.getState()
      if (networkState.isOnline && !networkState.isSyncing) {
        performSync()
      }
    }

    const handleTriggerSync = () => {
      const state = useNetworkStore.getState()
      if (state.isOnline) {
        performSync()
      }
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("trigger-sync", handleTriggerSync)
    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("focus", handleFocus)

    intervalRef.current = setInterval(() => {
      const state = useNetworkStore.getState()
      if (state.isOnline && !state.isSyncing) {
        performSync()
      }
    }, SYNC_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("trigger-sync", handleTriggerSync)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", handleFocus)
    }
  }, [])
}

export async function triggerManualSync() {
  const networkState = useNetworkStore.getState()
  if (!networkState.isOnline) {
    throw new Error("Cannot sync while offline")
  }

  return syncAll()
}
