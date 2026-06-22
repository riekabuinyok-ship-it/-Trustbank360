"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { ColumnDef } from "@tanstack/react-table"
import { Building2, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { usePlanLimits } from "@/hooks/usePlanLimits"

export default function BranchesPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const router = useRouter()
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const { getMetric, isLimitReached, isNearLimit, refresh: refreshUsage } = usePlanLimits()

  const branchMetric = getMetric("branches")
  const branchAtLimit = isLimitReached("branches")
  const branchNearLimit = isNearLimit("branches")
  const canCreateBranch = !branchAtLimit

  useEffect(() => {
    fetch("/api/branches").then((r) => r.json()).then(setBranches).finally(() => setLoading(false))
  }, [])

  async function toggleStatus(branchId: string, currentStatus: boolean) {
    setActionLoading(branchId)
    try {
      const res = await fetch(`/api/branches/${branchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      })
      if (res.ok) {
        setBranches(branches.map((b) => (b.id === branchId ? { ...b, isActive: !currentStatus } : b)))
        toast.success(`Branch ${currentStatus ? "suspended" : "activated"} successfully`)
        refreshUsage()
      } else {
        const data = await res.json()
        toast.error(data.error || "Unable to update branch status")
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setActionLoading(null)
    }
  }

  async function deleteBranch() {
    if (!deleteTarget) return
    setActionLoading(deleteTarget.id)
    try {
      const res = await fetch(`/api/branches/${deleteTarget.id}`, { method: "DELETE" })
      if (res.ok) {
        setBranches(branches.filter((b) => b.id !== deleteTarget.id))
        toast.success("Branch deleted successfully")
        refreshUsage()
      } else {
        const data = await res.json()
        toast.error(data.error || "Unable to delete branch")
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setActionLoading(null)
      setDeleteTarget(null)
    }
  }

  const columns: ColumnDef<any>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "code", header: "Code" },
    { accessorKey: "city", header: "City" },
    { accessorKey: "country", header: "Country" },
    { accessorKey: "_count.users", header: "Staff" },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "success" : "destructive"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const b = row.original
        const isOwner = user?.role === "COMPANY_OWNER" || user?.role === "company_owner"
        const isAdmin = user?.role === "COMPANY_ADMIN" || user?.role === "company_admin" || isOwner
        return (
          <div className="flex items-center gap-1">
            {isAdmin && (
              <Button size="sm" variant="ghost" onClick={() => router.push(`/company/branches/${b.id}/edit`)} title="Edit">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {isAdmin && (
              <Button size="sm" variant="ghost" onClick={() => toggleStatus(b.id, b.isActive)} disabled={actionLoading === b.id} title={b.isActive ? "Suspend" : "Activate"}>
                {actionLoading === b.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : b.isActive ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
              </Button>
            )}
            {isOwner && (
              <Button size="sm" variant="ghost" className="text-danger-500 hover:text-danger-600" onClick={() => setDeleteTarget({ id: b.id, name: b.name })} disabled={actionLoading === b.id} title="Delete">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">Branches</h1>
          <p className="text-muted-foreground text-sm">
            Manage your branches
            {branchMetric.limit !== null && (
              <span className="ml-2 text-xs">
                ({branchMetric.current}/{branchMetric.limit} used)
              </span>
            )}
          </p>
        </div>
        {branchAtLimit ? (
          <Link href="/company/settings/billing" className="w-full sm:w-auto">
            <Button variant="outline" className="gap-2 w-full sm:w-auto" size="sm">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Upgrade to add branches
            </Button>
          </Link>
        ) : (
          <Link href="/company/branches/new" className="w-full sm:w-auto">
            <Button className="gap-2 w-full sm:w-auto" size="sm">
              <Plus className="h-4 w-4" />
              New Branch
            </Button>
          </Link>
        )}
      </div>

      {branchAtLimit && (
        <div className="p-3 rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-900 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              Branch limit reached
            </p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
              You've used all {branchMetric.limit} branches on your current plan.
              Upgrade to add more branches.
            </p>
          </div>
          <Link href="/company/settings/billing">
            <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-400">
              Upgrade Plan
            </Button>
          </Link>
        </div>
      )}

      {branchNearLimit && !branchAtLimit && (
        <div className="p-3 rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
              Approaching branch limit
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-0.5">
              You have {branchMetric.remaining} branch{branchMetric.remaining === 1 ? "" : "es"} remaining on your current plan.
            </p>
          </div>
        </div>
      )}

      <Card className="w-full max-w-full overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">All Branches</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <DataTable columns={columns} data={branches} />
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Branch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action is permanent and cannot be undone. All wallets associated with this branch will also be removed.
              <br /><br />
              This operation can only proceed if no staff members or active transaction records are linked to this branch.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteBranch} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Branch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
