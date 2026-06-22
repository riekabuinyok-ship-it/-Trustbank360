"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { ColumnDef } from "@tanstack/react-table"
import { Users, Plus, UserPlus, Pencil, Trash2, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { roleLabels, roleColors } from "@/lib/permissions"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { usePlanLimits } from "@/hooks/usePlanLimits"

export default function StaffPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const user = session?.user as any
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteName, setDeleteName] = useState<string>("")
  const { getMetric, isLimitReached, isNearLimit, refresh: refreshUsage } = usePlanLimits()

  const staffMetric = getMetric("staff")
  const staffAtLimit = isLimitReached("staff")
  const staffNearLimit = isNearLimit("staff")

  const isSupervisor = user?.role === "COMPANY_OWNER" || user?.role === "company_owner" ||
    user?.role === "COMPANY_ADMIN" || user?.role === "company_admin"

  useEffect(() => {
    fetch("/api/staff").then((r) => r.json()).then(setStaff).finally(() => setLoading(false))
  }, [])

  async function toggleStatus(userId: string, currentStatus: string) {
    const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE"
    try {
      const res = await fetch(`/api/staff/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setStaff(staff.map((s) => (s.id === userId ? { ...s, status: newStatus } : s)))
        toast.success(`Staff ${newStatus === "ACTIVE" ? "activated" : "suspended"} successfully`)
        refreshUsage()
      } else {
        const data = await res.json()
        toast.error(data.error || `Unable to ${newStatus === "ACTIVE" ? "activate" : "suspend"} staff member`)
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.")
    }
  }

  async function handleDelete(userId: string) {
    try {
      const res = await fetch(`/api/staff/${userId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setStaff(staff.filter((s) => s.id !== userId))
        toast.success("Staff member removed successfully")
        refreshUsage()
      } else {
        const data = await res.json()
        toast.error(data.error || "Unable to remove staff member")
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setDeleteId(null)
    }
  }

  const columns: ColumnDef<any>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Phone" },
    { accessorKey: "position", header: "Position" },
    { accessorKey: "branch.name", header: "Branch" },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => <Badge className={roleColors[row.original.role as keyof typeof roleColors]}>{roleLabels[row.original.role as keyof typeof roleLabels]}</Badge>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "ACTIVE" ? "success" : row.original.status === "SUSPENDED" ? "destructive" : "warning"}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => router.push(`/company/staff/${row.original.id}/edit`)} title="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => toggleStatus(row.original.id, row.original.status)}>
            {row.original.status === "ACTIVE" ? "Suspend" : "Activate"}
          </Button>
          {isSupervisor && (
            <Button size="sm" variant="destructive" onClick={() => { setDeleteId(row.original.id); setDeleteName(row.original.name) }} title="Delete">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">Staff</h1>
          <p className="text-muted-foreground text-sm">
            Manage your team
            {staffMetric.limit !== null && (
              <span className="ml-2 text-xs">
                ({staffMetric.current}/{staffMetric.limit} used)
              </span>
            )}
          </p>
        </div>
        {staffAtLimit ? (
          <Link href="/company/settings/billing" className="w-full sm:w-auto">
            <Button variant="outline" className="gap-2 w-full sm:w-auto" size="sm">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Upgrade to invite staff
            </Button>
          </Link>
        ) : (
          <Link href="/company/staff/new" className="w-full sm:w-auto">
            <Button className="gap-2 w-full sm:w-auto" size="sm">
              <UserPlus className="h-4 w-4" />
              Invite Staff
            </Button>
          </Link>
        )}
      </div>

      {staffAtLimit && (
        <div className="p-3 rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-900 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              Staff limit reached
            </p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
              You've used all {staffMetric.limit} staff seats on your current plan.
              Upgrade to invite more team members.
            </p>
          </div>
          <Link href="/company/settings/billing">
            <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-400">
              Upgrade Plan
            </Button>
          </Link>
        </div>
      )}

      {staffNearLimit && !staffAtLimit && (
        <div className="p-3 rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
              Approaching staff limit
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-0.5">
              You have {staffMetric.remaining} staff seat{staffMetric.remaining === 1 ? "" : "s"} remaining on your current plan.
            </p>
          </div>
        </div>
      )}

      <Card className="w-full max-w-full overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">All Staff</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <DataTable columns={columns} data={staff} />
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deleteName}</strong> from your organization? This action cannot be undone. Their audit trail will be preserved for compliance purposes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(deleteId!)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
