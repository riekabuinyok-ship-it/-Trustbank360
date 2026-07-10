"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { ColumnDef } from "@tanstack/react-table"
import { Building2, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

function getStatusInfo(status: string, onboardingComplete: boolean) {
  if (status === "ACTIVE" && onboardingComplete) return { label: "Active", variant: "success" as const }
  if (status === "ACTIVE" && !onboardingComplete) return { label: "Pending", variant: "secondary" as const }
  if (status === "SUSPENDED") return { label: "Suspended", variant: "warning" as const }
  if (status === "DEACTIVATED") return { label: "Deactivated", variant: "outline" as const }
  return { label: "Unknown", variant: "outline" as const }
}

export default function AdminCompaniesPage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    fetch("/api/admin/companies")
      .then((r) => r.json())
      .then(setCompanies)
      .finally(() => setLoading(false))
  }, [])

  async function handleAction(companyId: string, action: string) {
    const label = action.charAt(0).toUpperCase() + action.slice(1)
    try {
      const res = await fetch(`/api/admin/companies/${companyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        setCompanies(
          action === "delete"
            ? companies.filter((c) => c.id !== companyId)
            : companies.map((c) =>
                c.id === companyId
                  ? { ...c, isActive: action === "activate" }
                  : c
              )
        )
        toast.success(`Company ${label}d`)
      } else {
        const err = await res.json()
        toast.error(err.error || `Failed to ${action} company`)
      }
    } catch {
      toast.error(`Failed to ${action} company`)
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    await handleAction(deleteTarget.id, "delete")
    setDeleteTarget(null)
  }

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Company Name",
      cell: ({ row }) => (
        <button
          className="font-medium text-primary hover:underline text-left"
          onClick={() => router.push(`/platform/company/${row.original.id}`)}
        >
          <span className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            {row.original.name}
          </span>
        </button>
      ),
    },
    {
      id: "owner",
      header: "Owner",
      cell: ({ row }) => {
        const owner = row.original.owner
        return owner ? (
          <div>
            <div className="font-medium">{owner.name}</div>
            <div className="text-xs text-muted-foreground">{owner.email}</div>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const { label, variant } = getStatusInfo(row.original.status || (row.original.isActive ? "ACTIVE" : "DEACTIVATED"), row.original.onboardingComplete)
        return <Badge variant={variant}>{label}</Badge>
      },
    },
    {
      id: "subscription",
      header: "Plan",
      cell: ({ row }) => {
        const sub = row.original.subscription
        return sub ? (
          <Badge variant="outline">{sub.planName}</Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )
      },
    },
    {
      accessorKey: "userCount",
      header: "Users",
    },
    {
      accessorKey: "branchCount",
      header: "Branches",
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const status = row.original.status || (row.original.isActive ? "ACTIVE" : "DEACTIVATED")
        const isActive = status === "ACTIVE"
        return (
          <div className="flex gap-2">
            {isActive ? (
              <>
                <Button size="sm" variant="outline" onClick={() => handleAction(row.original.id, "suspend")}>
                  Suspend
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleAction(row.original.id, "deactivate")}>
                  Deactivate
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => handleAction(row.original.id, "activate")}>
                Activate
              </Button>
            )}
            <Button size="sm" variant="destructive" onClick={() => setDeleteTarget({ id: row.original.id, name: row.original.name })}>
              Delete
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <div>
        <h1 className="text-2xl font-bold">Companies</h1>
        <p className="text-muted-foreground text-sm">Manage all registered companies on the platform</p>
      </div>

      <Card className="w-full max-w-full overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">All Companies</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">Loading companies...</div>
          ) : (
            <DataTable columns={columns} data={companies} searchKey="name" />
          )}
        </CardContent>
      </Card>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Company
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone. The company and all its data will be permanently removed from the platform.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
