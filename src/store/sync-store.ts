import { create } from "zustand"

interface SyncStats {
  pendingCount: number
  syncedCount: number
  failedCount: number
  conflictCount: number
  totalCount: number
}

interface SyncState {
  lastSyncAt: number | null
  isSyncing: boolean
  syncProgress: number
  syncStats: SyncStats

  setSyncing: (syncing: boolean) => void
  setSyncProgress: (progress: number) => void
  setLastSync: (time: number) => void
  setSyncStats: (stats: SyncStats) => void
  updatePendingCount: (delta: number) => void
  updateSyncedCount: (delta: number) => void
  updateFailedCount: (delta: number) => void
  updateConflictCount: (delta: number) => void
  resetSyncStats: () => void
}

const DEFAULT_STATS: SyncStats = {
  pendingCount: 0,
  syncedCount: 0,
  failedCount: 0,
  conflictCount: 0,
  totalCount: 0,
}

export const useSyncStore = create<SyncState>((set) => ({
  lastSyncAt: null,
  isSyncing: false,
  syncProgress: 0,
  syncStats: { ...DEFAULT_STATS },

  setSyncing: (syncing: boolean) =>
    set({
      isSyncing: syncing,
      syncProgress: syncing ? 0 : 100,
    }),

  setSyncProgress: (progress: number) =>
    set({ syncProgress: Math.min(100, Math.max(0, progress)) }),

  setLastSync: (time: number) => set({ lastSyncAt: time }),

  setSyncStats: (stats: SyncStats) => set({ syncStats: stats }),

  updatePendingCount: (delta: number) =>
    set((state) => ({
      syncStats: {
        ...state.syncStats,
        pendingCount: Math.max(0, state.syncStats.pendingCount + delta),
      },
    })),

  updateSyncedCount: (delta: number) =>
    set((state) => ({
      syncStats: {
        ...state.syncStats,
        syncedCount: Math.max(0, state.syncStats.syncedCount + delta),
      },
    })),

  updateFailedCount: (delta: number) =>
    set((state) => ({
      syncStats: {
        ...state.syncStats,
        failedCount: Math.max(0, state.syncStats.failedCount + delta),
      },
    })),

  updateConflictCount: (delta: number) =>
    set((state) => ({
      syncStats: {
        ...state.syncStats,
        conflictCount: Math.max(0, state.syncStats.conflictCount + delta),
      },
    })),

  resetSyncStats: () => set({ syncStats: { ...DEFAULT_STATS } }),
}))
