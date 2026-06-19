import { create } from "zustand"

export type NetworkStatus = "online" | "offline" | "syncing"

interface NetworkState {
  status: NetworkStatus
  lastOnlineAt: number | null
  lastOfflineAt: number | null
  isOnline: boolean
  isSyncing: boolean
  connectionType: string | null
  effectiveBandwidth: number | null

  setOnline: () => void
  setOffline: () => void
  setSyncing: (syncing: boolean) => void
  setConnectionInfo: (type: string, bandwidth: number) => void
}

export const useNetworkStore = create<NetworkState>((set) => {
  // Detect initial state
  const isOnline =
    typeof navigator !== "undefined" ? navigator.onLine : true

  // Listen for network changes
  if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
      useNetworkStore.getState().setOnline()
    })
    window.addEventListener("offline", () => {
      useNetworkStore.getState().setOffline()
    })

    // Listen for custom sync events
    window.addEventListener("sync-required", () => {
      const state = useNetworkStore.getState()
      if (state.isOnline && !state.isSyncing) {
        window.dispatchEvent(new CustomEvent("trigger-sync"))
      }
    })
  }

  return {
    status: isOnline ? "online" : "offline",
    lastOnlineAt: isOnline ? Date.now() : null,
    lastOfflineAt: isOnline ? null : Date.now(),
    isOnline,
    isSyncing: false,
    connectionType: null,
    effectiveBandwidth: null,

    setOnline: () =>
      set({
        status: "online",
        isOnline: true,
        lastOnlineAt: Date.now(),
        lastOfflineAt: null,
        isSyncing: false,
      }),

    setOffline: () =>
      set({
        status: "offline",
        isOnline: false,
        lastOfflineAt: Date.now(),
        isSyncing: false,
      }),

    setSyncing: (syncing: boolean) =>
      set((state) => ({
        isSyncing: syncing,
        status: syncing ? "syncing" : state.isOnline ? "online" : "offline",
      })),

    setConnectionInfo: (type: string, bandwidth: number) =>
      set({
        connectionType: type,
        effectiveBandwidth: bandwidth,
      }),
  }
})

// Connection info helper
export function initConnectionMonitoring() {
  if (typeof navigator === "undefined") return

  const connection = (navigator as any).connection
  if (connection) {
    useNetworkStore.getState().setConnectionInfo(
      connection.effectiveType || "unknown",
      connection.downlink || null
    )

    connection.addEventListener("change", () => {
      useNetworkStore.getState().setConnectionInfo(
        connection.effectiveType || "unknown",
        connection.downlink || null
      )
    })
  }
}
