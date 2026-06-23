"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { ScrollText, Search, Filter, Clock } from "lucide-react"

interface AuditLog {
  id: string
  action: string
  resource: string
  details: string | null
  company: { name: string } | null
  user: { name: string; email: string } | null
  createdAt: string
  ipAddress: string | null
}

const ACTION_TYPES = [
  { value: "", label: "All Actions" },
  { value: "CREATE", label: "Create" },
  { value: "UPDATE", label: "Update" },
  { value: "DELETE", label: "Delete" },
  { value: "SUSPEND", label: "Suspend" },
  { value: "ACTIVATE", label: "Activate" },
  { value: "LOGIN", label: "Login" },
  { value: "LOGOUT", label: "Logout" },
  { value: "APPROVE", label: "Approve" },
  { value: "REJECT", label: "Reject" },
  { value: "EXPORT", label: "Export" },
]

const RESOURCE_TYPES = [
  { value: "", label: "All Resources" },
  { value: "COMPANY", label: "Company" },
  { value: "USER", label: "User" },
  { value: "BRANCH", label: "Branch" },
  { value: "TRANSFER", label: "Transfer" },
  { value: "CUSTOMER", label: "Customer" },
  { value: "SUBSCRIPTION", label: "Subscription" },
  { value: "SETTINGS", label: "Settings" },
  { value: "EXCHANGE_RATE", label: "Exchange Rate" },
]

function getActionBadge(action: string) {
  const map: Record<string, { label: string; variant: "success" | "default" | "destructive" | "warning" | "secondary" }> = {
    CREATE: { label: "Create", variant: "success" },
    UPDATE: { label: "Update", variant: "default" },
    DELETE: { label: "Delete", variant: "destructive" },
    SUSPEND: { label: "Suspend", variant: "warning" },
    ACTIVATE: { label: "Activate", variant: "success" },
    LOGIN: { label: "Login", variant: "secondary" },
    LOGOUT: { label: "Logout", variant: "secondary" },
    APPROVE: { label: "Approve", variant: "success" },
    REJECT: { label: "Reject", variant: "destructive" },
    EXPORT: { label: "Export", variant: "secondary" },
  }
  return map[action] ?? { label: action, variant: "secondary" as const }
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [action, setAction] = useState("")
  const [companyId, setCompanyId] = useState("")
  const [resource, setResource] = useState("")
  const [companySearch, setCompanySearch] = useState("")
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    fetch("/api/admin/companies")
      .then((r) => r.json())
      .then((data) => setCompanies(data))
      .catch(() => {})
  }, [])

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (dateFrom) params.set("dateFrom", dateFrom)
    if (dateTo) params.set("dateTo", dateTo)
    if (action) params.set("action", action)
    if (companyId) params.set("companyId", companyId)
    if (resource) params.set("resource", resource)

    try {
      const res = await fetch(`/api/admin/audit-logs?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs)
        setTotal(data.total)
      }
    } catch {
      console.error("Failed to fetch audit logs")
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo, action, companyId, resource])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(companySearch.toLowerCase())
  )

  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: "createdAt",
      header: "Timestamp",
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.original.createdAt).toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => {
        const { label, variant } = getActionBadge(row.original.action)
        return <Badge variant={variant}>{label}</Badge>
      },
    },
    {
      accessorKey: "resource",
      header: "Resource",
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.resource}</span>
      ),
    },
    {
      accessorKey: "details",
      header: "Details",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground max-w-[200px] truncate block">
          {row.original.details || "—"}
        </span>
      ),
    },
    {
      id: "company",
      header: "Company",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.company?.name || "—"}</span>
      ),
    },
    {
      id: "user",
      header: "User",
      cell: ({ row }) => {
        const u = row.original.user
        return u ? (
          <div>
            <div className="text-sm font-medium">{u.name}</div>
            <div className="text-xs text-muted-foreground">{u.email}</div>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: "ipAddress",
      header: "IP Address",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.ipAddress || "—"}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ScrollText className="h-6 w-6" />
            Audit Logs
          </h1>
          <p className="text-muted-foreground text-sm">
            Track all system-wide administrative actions
          </p>
        </div>
        <Button variant="outline" onClick={fetchLogs} disabled={loading}>
          <Filter className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground font-medium">From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-44"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground font-medium">To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-44"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground font-medium">Action</label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground font-medium">Resource</label>
              <Select value={resource} onValueChange={setResource}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Resources" />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground font-medium">Company</label>
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Companies" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Search companies..."
                      value={companySearch}
                      onChange={(e) => setCompanySearch(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <SelectItem value="all">All Companies</SelectItem>
                  {filteredCompanies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Activity Log{total !== 1 ? "s" : ""} ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <Clock className="h-6 w-6 animate-spin" />
                <span className="text-sm">Loading audit logs...</span>
              </div>
            </div>
          ) : (
            <DataTable columns={columns} data={logs} pageSize={20} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
