import { create } from "zustand"

interface OfflineState {
  isEnabled: boolean
  offlineMode: "auto" | "forced" | "disabled"
  lastSyncAt: number | null
  queuedOperations: number
  cachedDataStale: boolean

  setEnabled: (enabled: boolean) => void
  setOfflineMode: (mode: "auto" | "forced" | "disabled") => void
  setLastSync: (time: number) => void
  setQueuedOperations: (count: number) => void
  incrementQueuedOperations: () => void
  decrementQueuedOperations: () => void
  setCachedDataStale: (stale: boolean) => void
  reset: () => void
}

export const useOfflineStore = create<OfflineState>((set) => ({
  isEnabled: true,
  offlineMode: "auto",
  lastSyncAt: null,
  queuedOperations: 0,
  cachedDataStale: false,

  setEnabled: (enabled: boolean) => set({ isEnabled: enabled }),

  setOfflineMode: (mode: "auto" | "forced" | "disabled") =>
    set({ offlineMode: mode }),

  setLastSync: (time: number) => set({ lastSyncAt: time }),

  setQueuedOperations: (count: number) =>
    set({ queuedOperations: count }),

  incrementQueuedOperations: () =>
    set((state) => ({ queuedOperations: state.queuedOperations + 1 })),

  decrementQueuedOperations: () =>
    set((state) => ({
      queuedOperations: Math.max(0, state.queuedOperations - 1),
    })),

  setCachedDataStale: (stale: boolean) =>
    set({ cachedDataStale: stale }),

  reset: () =>
    set({
      isEnabled: true,
      offlineMode: "auto",
      lastSyncAt: null,
      queuedOperations: 0,
      cachedDataStale: false,
    }),
}))
