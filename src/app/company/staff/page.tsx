"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { ColumnDef } from "@tanstack/react-table"
import { Users, Plus, UserPlus, Pencil } from "lucide-react"
import Link from "next/link"
import { roleLabels, roleColors } from "@/lib/permissions"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

export default function StaffPage() {
  const router = useRouter()
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
        toast.success(`Staff ${newStatus === "ACTIVE" ? "activated" : "suspended"}`)
      }
    } catch {
      toast.error("Failed to update status")
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
    </div>
  )
}
