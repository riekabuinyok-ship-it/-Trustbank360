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

export default function BranchesPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const router = useRouter()
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

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
        toast.success(`Branch ${currentStatus ? "suspended" : "activated"}`)
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to update branch")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setActionLoading(null)
    }
  }

  async function deleteBranch(branchId: string, name: string) {
    if (!confirm(`Delete "${name}"? This action cannot be undone.`)) return
    setActionLoading(branchId)
    try {
      const res = await fetch(`/api/branches/${branchId}`, { method: "DELETE" })
      if (res.ok) {
        setBranches(branches.filter((b) => b.id !== branchId))
        toast.success("Branch deleted")
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to delete branch")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setActionLoading(null)
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
        const isOwner = user?.role === "COMPANY_OWNER"
        const isAdmin = user?.role === "COMPANY_ADMIN" || isOwner
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
              <Button size="sm" variant="ghost" className="text-danger-500 hover:text-danger-600" onClick={() => deleteBranch(b.id, b.name)} disabled={actionLoading === b.id} title="Delete">
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
    </div>
  )
}
