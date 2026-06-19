"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  RefreshCw,
  Wifi,
  WifiOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Loader2,
  ArrowUpDown,
  Database,
} from "lucide-react"
import { useNetworkStore } from "@/store/network-store"
import { useSyncStore } from "@/store/sync-store"
import { triggerManualSync } from "@/lib/sync/use-background-sync"
import {
  getPendingItems,
  getSyncedItems,
  getFailedItems,
  retryFailedItem,
  retryAllFailed,
} from "@/lib/db/sync-queue"
import { getUnresolvedConflicts, resolveConflict } from "@/lib/db/conflicts"
import { getUnsyncedAuditCount } from "@/lib/db/offline-audit"
import type { SyncQueueItem } from "@/lib/db/sync-queue"
import type { SyncConflict } from "@/lib/db/conflicts"

export default function SyncCenterPage() {
  const networkStatus = useNetworkStore((s) => s.status)
  const isOnline = useNetworkStore((s) => s.isOnline)
  const isSyncing = useSyncStore((s) => s.isSyncing)
  const syncProgress = useSyncStore((s) => s.syncProgress)
  const lastSyncAt = useSyncStore((s) => s.lastSyncAt)

  const [pendingItems, setPendingItems] = useState<SyncQueueItem[]>([])
  const [syncedItems, setSyncedItems] = useState<SyncQueueItem[]>([])
  const [failedItems, setFailedItems] = useState<SyncQueueItem[]>([])
  const [conflicts, setConflicts] = useState<SyncConflict[]>([])
  const [unsyncedAuditCount, setUnsyncedAuditCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [syncResult, setSyncResult] = useState<{ synced: number; failed: number; conflicts: number } | null>(null)

  const refreshAll = useCallback(async () => {
    setLoading(true)
    try {
      const [pending, synced, failed, unresolvedConflicts, auditCount] = await Promise.all([
        getPendingItems(100),
        getSyncedItems(50),
        getFailedItems(100),
        getUnresolvedConflicts(),
        getUnsyncedAuditCount(),
      ])
      setPendingItems(pending)
      setSyncedItems(synced)
      setFailedItems(failed)
      setConflicts(unresolvedConflicts)
      setUnsyncedAuditCount(auditCount)
    } catch {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshAll()
    const interval = setInterval(refreshAll, 10000)
    return () => clearInterval(interval)
  }, [refreshAll])

  const handleSyncNow = async () => {
    if (!isOnline || isSyncing) return
    setSyncResult(null)
    try {
      const result = await triggerManualSync()
      setSyncResult(result)
      refreshAll()
    } catch {
      // Silent fail
    }
  }

  const handleRetry = async (id: string) => {
    await retryFailedItem(id)
    refreshAll()
  }

  const handleRetryAll = async () => {
    const count = await retryAllFailed()
    if (count > 0) {
      await triggerManualSync()
    }
    refreshAll()
  }

  const handleResolveConflict = async (id: string, resolution: "RESOLVED" | "DISCARDED") => {
    await resolveConflict(id, resolution, "manual")
    refreshAll()
  }

  const totalItems = pendingItems.length + failedItems.length + syncedItems.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
            <RefreshCw className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Sync Center</h1>
            <p className="text-sm text-muted-foreground">
              Manage offline data synchronization and resolve conflicts
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            {isOnline ? (
              <span className="flex items-center gap-1 text-emerald-600">
                <Wifi className="h-4 w-4" /> Online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-600">
                <WifiOff className="h-4 w-4" /> Offline
              </span>
            )}
          </div>
          <Button
            onClick={handleSyncNow}
            disabled={!isOnline || isSyncing}
            className="gap-2"
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isSyncing ? `Syncing ${syncProgress}%` : "Sync Now"}
          </Button>
        </div>
      </div>

      {syncResult && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-emerald-200 dark:border-emerald-900">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-xs text-muted-foreground">Synced</p>
                <p className="text-lg font-bold text-emerald-600">{syncResult.synced}</p>
              </div>
            </CardContent>
          </Card>
          <Card className={syncResult.failed > 0 ? "border-red-200 dark:border-red-900" : ""}>
            <CardContent className="p-4 flex items-center gap-3">
              <XCircle className={`h-5 w-5 ${syncResult.failed > 0 ? "text-red-600" : "text-muted-foreground"}`} />
              <div>
                <p className="text-xs text-muted-foreground">Failed</p>
                <p className={`text-lg font-bold ${syncResult.failed > 0 ? "text-red-600" : ""}`}>{syncResult.failed}</p>
              </div>
            </CardContent>
          </Card>
          <Card className={syncResult.conflicts > 0 ? "border-amber-200 dark:border-amber-900" : ""}>
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className={`h-5 w-5 ${syncResult.conflicts > 0 ? "text-amber-600" : "text-muted-foreground"}`} />
              <div>
                <p className="text-xs text-muted-foreground">Conflicts</p>
                <p className={`text-lg font-bold ${syncResult.conflicts > 0 ? "text-amber-600" : ""}`}>{syncResult.conflicts}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{pendingItems.length}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{syncedItems.length}</p>
            <p className="text-xs text-muted-foreground">Synced</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{failedItems.length}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{conflicts.length}</p>
            <p className="text-xs text-muted-foreground">Conflicts</p>
          </CardContent>
        </Card>
      </div>

      {lastSyncAt && (
        <p className="text-xs text-muted-foreground">
          Last synced: {new Date(lastSyncAt).toLocaleString()}
          {unsyncedAuditCount > 0 && ` | ${unsyncedAuditCount} unsynced audit logs`}
        </p>
      )}

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending
            {pendingItems.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-[10px]">{pendingItems.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="synced">
            Synced
            {syncedItems.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-[10px]">{syncedItems.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="failed">
            Failed
            {failedItems.length > 0 && (
              <Badge variant="destructive" className="ml-2 text-[10px]">{failedItems.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="conflicts">
            Conflicts
            {conflicts.length > 0 && (
              <Badge variant="warning" className="ml-2 text-[10px]">{conflicts.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
                </div>
              ) : pendingItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                  <p className="font-medium text-foreground">All caught up!</p>
                  <p className="text-sm">No pending items to sync.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {pendingItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.action} {item.tableName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">{item.action}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="synced" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
                </div>
              ) : syncedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Database className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="font-medium text-foreground">No synced items</p>
                  <p className="text-sm">Items that have been synced will appear here.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {syncedItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.action} {item.tableName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Synced: {item.syncedAt ? new Date(item.syncedAt).toLocaleString() : ""}
                          </p>
                        </div>
                      </div>
                      <Badge variant="success" className="text-[10px]">Synced</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failed" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
                </div>
              ) : failedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                  <p className="font-medium text-foreground">No failures</p>
                  <p className="text-sm">All sync operations completed successfully.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {failedItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.action} {item.tableName}
                          </p>
                          <p className="text-xs text-red-600 truncate">{item.lastError}</p>
                          <p className="text-xs text-muted-foreground">
                            Retry #{item.retryCount} | {new Date(item.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRetry(item.id)}
                        disabled={!isOnline}
                      >
                        Retry
                      </Button>
                    </div>
                  ))}
                  <div className="p-3 flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetryAll}
                      disabled={!isOnline || failedItems.length === 0}
                    >
                      Retry All Failed
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conflicts" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
                </div>
              ) : conflicts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                  <p className="font-medium text-foreground">No conflicts</p>
                  <p className="text-sm">All data is in sync with the server.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {conflicts.map((conflict) => (
                    <div key={conflict.id} className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium">
                              {conflict.conflictType} — {conflict.tableName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(conflict.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="warning" className="text-[10px]">{conflict.conflictType}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900">
                          <p className="font-semibold text-red-700 dark:text-red-400 mb-1">Local</p>
                          <pre className="truncate">{JSON.stringify(conflict.localPayload).slice(0, 100)}</pre>
                        </div>
                        <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/10 border border-blue-200 dark:border-blue-900">
                          <p className="font-semibold text-blue-700 dark:text-blue-400 mb-1">Server</p>
                          <pre className="truncate">{JSON.stringify(conflict.serverPayload).slice(0, 100)}</pre>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolveConflict(conflict.id, "RESOLVED")}
                        >
                          Accept Local
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolveConflict(conflict.id, "DISCARDED")}
                        >
                          Accept Server
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
