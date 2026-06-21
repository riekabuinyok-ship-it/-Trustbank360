"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollText, Loader2, Shield } from "lucide-react"

interface AuditLog {
  id: string
  userId: string
  action: string
  resource: string
  details: string | null
  branchId: string | null
  companyId: string | null
  createdAt: string
  user: { name: string }
}

function formatAction(action: string) {
  return action
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/audit-logs").then(async (res) => {
      if (res.ok) {
        const data = await res.json()
        const sorted = (Array.isArray(data) ? data : []).sort(
          (a: AuditLog, b: AuditLog) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        setLogs(sorted)
      }
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground text-sm">Track all system activities</p>
      </div>

      <Card className="w-full max-w-full overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            System Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ScrollText className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No audit logs yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-surface-50 dark:hover:bg-surface-800/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {formatAction(log.action)}
                      </p>
                      <span className="text-xs text-muted-foreground">on</span>
                      <p className="text-sm text-muted-foreground">{log.resource}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-muted-foreground">{log.user.name}</p>
                      <span className="text-muted-foreground/30">|</span>
                      <p className="text-xs text-muted-foreground/60">{timeAgo(log.createdAt)}</p>
                    </div>
                    {log.details && (
                      <p className="text-xs text-muted-foreground/70 mt-1.5 italic">
                        {log.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
