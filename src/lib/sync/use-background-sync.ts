// TrustBank360 Background Sync Hook
// Automatically syncs pending offline data when connectivity returns

"use client"

import { useEffect, useRef } from "react"
import { useNetworkStore } from "@/store/network-store"
import { useSyncStore } from "@/store/sync-store"
import { syncAll } from "./sync-engine"

const SYNC_INTERVAL = 5 * 60 * 1000 // 5 minutes
const IMMEDIATE_SYNC_DELAY = 3000 // 3 seconds after coming online

export function useBackgroundSync() {
  const mounted = useRef(false)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()
  const syncInProgress = useRef(false)

  useEffect(() => {
    if (mounted.current) return
    mounted.current = true

    const performSync = async () => {
      if (syncInProgress.current) return
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

    // Sync when coming back online
    const handleOnline = () => {
      setTimeout(performSync, IMMEDIATE_SYNC_DELAY)
    }

    // Listen for manual sync triggers
    const handleTriggerSync = () => {
      const state = useNetworkStore.getState()
      if (state.isOnline) {
        performSync()
      }
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("trigger-sync", handleTriggerSync)

    // Periodic sync
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
