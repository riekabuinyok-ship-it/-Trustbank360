"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { ColumnDef } from "@tanstack/react-table"
import { Users, Plus, UserPlus, Pencil, Trash2, WifiOff } from "lucide-react"
import Link from "next/link"
import { roleLabels, roleColors, roleHierarchy } from "@/lib/permissions"
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
import { useOfflineStaff } from "@/lib/hooks/use-offline-data"

export default function StaffPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const user = session?.user as any
  const { data: staff, loading, isFromCache } = useOfflineStaff()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteName, setDeleteName] = useState<string>("")

  const currentUserRole = user?.role?.toLowerCase() || ""
  const isSupervisor = currentUserRole === "company_owner" || currentUserRole === "company_admin"
  const isBranchManager = currentUserRole === "branch_manager"
  const isOffline = typeof navigator !== "undefined" && !navigator.onLine

  async function toggleStatus(userId: string, currentStatus: string) {
    if (isOffline) { toast.error("An internet connection is required."); return }
    const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE"
    try {
      const res = await fetch(`/api/staff/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        toast.success(`Staff ${newStatus === "ACTIVE" ? "activated" : "suspended"} successfully`)
      } else {
        const data = await res.json()
        toast.error(data.error || `Unable to ${newStatus === "ACTIVE" ? "activate" : "suspend"} staff member`)
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.")
    }
  }

  async function handleDelete(userId: string) {
    if (isOffline) { toast.error("An internet connection is required."); setDeleteId(null); return }
    try {
      const res = await fetch(`/api/staff/${userId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast.success("Staff member removed successfully")
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
      cell: ({ row }) => {
        const targetRole = row.original.role?.toLowerCase() || ""
        const targetBranchId = row.original.branchId
        const targetLevel = roleHierarchy[targetRole as keyof typeof roleHierarchy] ?? 0
        const bmLevel = roleHierarchy["branch_manager"]
        const canEdit = isSupervisor || (isBranchManager && targetBranchId === user?.branchId && targetLevel < bmLevel)
        const canDelete = isSupervisor && row.original.id !== user?.id

        if (!canEdit && !canDelete) return null

        return (
          <div className="flex gap-2">
            {canEdit && (
              <>
                <Button size="sm" variant="ghost" onClick={() => router.push(`/company/staff/${row.original.id}/edit`)} title="Edit">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => toggleStatus(row.original.id, row.original.status)}>
                  {row.original.status === "ACTIVE" ? "Suspend" : "Activate"}
                </Button>
              </>
            )}
            {canDelete && (
              <Button size="sm" variant="destructive" onClick={() => { setDeleteId(row.original.id); setDeleteName(row.original.name) }} title="Delete">
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
          <h1 className="text-2xl font-bold">Staff</h1>
          <p className="text-muted-foreground text-sm">Manage your team</p>
        </div>
        <Link href="/company/staff/new" className="w-full sm:w-auto">
          <Button className="gap-2 w-full sm:w-auto" size="sm">
            <UserPlus className="h-4 w-4" />
            Invite Staff
          </Button>
        </Link>
      </div>

      <Card className="w-full max-w-full overflow-hidden">
        <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">All Staff</CardTitle>
              {isFromCache && (
                <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 gap-1">
                  <WifiOff className="h-3 w-3" /> Cached
                </Badge>
              )}
            </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <DataTable columns={columns} data={staff || []} />
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
