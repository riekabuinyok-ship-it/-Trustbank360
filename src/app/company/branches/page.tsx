"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { ColumnDef } from "@tanstack/react-table"
import { Building2, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2 } from "lucide-react"
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

export default function BranchesPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const router = useRouter()
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Branches</h1>
          <p className="text-muted-foreground">Manage your branches</p>
        </div>
        <Link href="/company/branches/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Branch
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Branches</CardTitle>
        </CardHeader>
        <CardContent>
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
