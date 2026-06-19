"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { ColumnDef } from "@tanstack/react-table"
import { Users, Plus, UserPlus, Pencil, Trash2 } from "lucide-react"
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

export default function StaffPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const user = session?.user as any
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteName, setDeleteName] = useState<string>("")

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff</h1>
          <p className="text-muted-foreground">Manage your team</p>
        </div>
        <Link href="/company/staff/new">
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Invite Staff
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Staff</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={staff} />
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deleteName}</strong> from your organization? This action cannot be undone. All associated audit logs will be permanently deleted.
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
