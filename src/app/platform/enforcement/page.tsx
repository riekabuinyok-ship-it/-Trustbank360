"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { ColumnDef } from "@tanstack/react-table"
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileWarning,
  Trash2,
} from "lucide-react"
import toast from "react-hot-toast"

interface Violation {
  id: string
  companyId: string
  company: { name: string }
  action: string
  reason: string
  createdBy: { name: string }
  createdAt: string
}

interface CompanyStatus {
  id: string
  name: string
  isActive: boolean
  violationCount: number
}

interface ActionDialogState {
  open: boolean
  companyId: string
  companyName: string
  action: "suspend" | "reactivate" | "warn"
}

const actionConfig = {
  suspend: { label: "Suspend", variant: "destructive" as const, icon: XCircle },
  reactivate: { label: "Reactivate", variant: "secondary" as const, icon: CheckCircle2 },
  warn: { label: "Warn", variant: "outline" as const, icon: AlertTriangle },
}

export default function AdminEnforcementPage() {
  const [violations, setViolations] = useState<Violation[]>([])
  const [companyStatuses, setCompanyStatuses] = useState<CompanyStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState<ActionDialogState>({ open: false, companyId: "", companyName: "", action: "warn" })
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [resolveDialog, setResolveDialog] = useState<{ open: boolean; violation: Violation | null }>({ open: false, violation: null })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const res = await fetch("/api/admin/enforcement")
      if (res.ok) {
        const data = await res.json()
        setViolations(data.violations)
        setCompanyStatuses(data.companyStatuses)
      } else {
        toast.error("Unable to load enforcement data. Please try again.")
      }
    } catch {
      toast.error("Unable to load enforcement data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function openActionDialog(company: CompanyStatus, action: "suspend" | "reactivate" | "warn") {
    setDialog({ open: true, companyId: company.id, companyName: company.name, action })
    setReason("")
  }

  async function handleResolve() {
    if (!resolveDialog.violation) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/enforcement", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ violationId: resolveDialog.violation.id }),
      })
      if (res.ok) {
        toast.success("Warning resolved successfully")
        setResolveDialog({ open: false, violation: null })
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to resolve warning")
      }
    } catch {
      toast.error("Failed to resolve warning")
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmAction() {
    if (!reason.trim()) {
      toast.error("Please provide a reason")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/enforcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: dialog.companyId,
          action: dialog.action,
          reason: reason.trim(),
        }),
      })
      if (res.ok) {
        toast.success(`${dialog.companyName} ${actionConfig[dialog.action].label.toLowerCase()}ed successfully`)
        setDialog({ open: false, companyId: "", companyName: "", action: "warn" })
        setReason("")
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || "Action failed")
      }
    } catch {
      toast.error("Action failed")
    } finally {
      setSubmitting(false)
    }
  }

  const violationColumns: ColumnDef<Violation>[] = [
    {
      accessorKey: "company.name",
      header: "Company",
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => {
        const action = row.original.action
        const config = actionConfig[action as keyof typeof actionConfig]
        return (
          <Badge variant={config?.variant === "secondary" ? "success" : config?.variant === "destructive" ? "destructive" : "warning"}>
            {action.charAt(0).toUpperCase() + action.slice(1)}
          </Badge>
        )
      },
    },
    {
      accessorKey: "reason",
      header: "Reason",
    },
    {
      accessorKey: "createdBy.name",
      header: "Admin",
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        if (row.original.action !== "warn") return null
        return (
          <Button
            size="sm"
            variant="ghost"
            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            onClick={() => setResolveDialog({ open: true, violation: row.original })}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Resolve
          </Button>
        )
      },
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-600 animate-pulse flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Loading enforcement data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-primary" />
          Enforcement & Control Panel
        </h1>
        <p className="text-muted-foreground text-sm">Manage company compliance and platform enforcement actions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileWarning className="h-5 w-5 text-muted-foreground" />
            Company Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {companyStatuses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <FileWarning className="h-8 w-8 mb-2" />
              <p className="text-sm">No companies found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {companyStatuses.map((company) => {
                const ActionIcon = actionConfig[company.isActive ? "warn" : "reactivate"].icon
                return (
                  <Card key={company.id} className="border-l-4" style={{ borderLeftColor: company.isActive ? "#00A86B" : "#EF4444" }}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                        <h3 className="font-semibold break-anywhere min-w-0">{company.name}</h3>
                        <Badge variant={company.isActive ? "success" : "destructive"} className="self-start sm:self-auto">
                          {company.isActive ? "Active" : "Suspended"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{company.violationCount} violation{company.violationCount !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="flex gap-2">
                        {company.isActive ? (
                          <>
                            <Button size="sm" variant="destructive" onClick={() => openActionDialog(company, "suspend")}>
                              <XCircle className="h-4 w-4 mr-1" />
                              Suspend
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => openActionDialog(company, "warn")}>
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              Warn
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" variant="secondary" onClick={() => openActionDialog(company, "reactivate")}>
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Violation History</CardTitle>
        </CardHeader>
        <CardContent>
          {violations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <ShieldAlert className="h-8 w-8 mb-2" />
              <p className="text-sm">No violations recorded</p>
            </div>
          ) : (
            <DataTable columns={violationColumns} data={violations} searchKey="reason" />
          )}
        </CardContent>
      </Card>

      <Dialog open={resolveDialog.open} onOpenChange={(open) => setResolveDialog({ ...resolveDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Resolve Warning
            </DialogTitle>
            <DialogDescription>
              This will remove the warning for <strong>{resolveDialog.violation?.company?.name}</strong> and notify their users.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 rounded-lg bg-surface-50 dark:bg-surface-800 space-y-2">
            <p className="text-sm font-medium">Original Warning</p>
            <p className="text-sm text-muted-foreground">{resolveDialog.violation?.reason}</p>
            <p className="text-xs text-muted-foreground">
              Issued {resolveDialog.violation?.createdAt ? new Date(resolveDialog.violation.createdAt).toLocaleDateString() : ""}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialog({ open: false, violation: null })}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={handleResolve}
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {submitting ? "Processing..." : "Resolve Warning"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog.open} onOpenChange={(open) => setDialog({ ...dialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialog.action === "suspend" && <XCircle className="h-5 w-5 text-destructive" />}
              {dialog.action === "reactivate" && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              {dialog.action === "warn" && <AlertTriangle className="h-5 w-5 text-amber-500" />}
              {actionConfig[dialog.action].label} {dialog.companyName}
            </DialogTitle>
            <DialogDescription>
              {dialog.action === "suspend" && "This will immediately deactivate the company and all its users. They will not be able to access the platform."}
              {dialog.action === "reactivate" && "This will restore the company's access to the platform."}
              {dialog.action === "warn" && "This will record a warning for the company without changing their status."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason</label>
            <Textarea
              placeholder="Describe the reason for this action..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ ...dialog, open: false })}>
              Cancel
            </Button>
            <Button
              variant={dialog.action === "suspend" ? "destructive" : dialog.action === "reactivate" ? "secondary" : "default"}
              onClick={confirmAction}
              disabled={submitting || !reason.trim()}
            >
              {submitting ? "Processing..." : `Confirm ${actionConfig[dialog.action].label}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
