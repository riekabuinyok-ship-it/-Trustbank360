"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { ColumnDef } from "@tanstack/react-table"
import { Building2 } from "lucide-react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

function getStatusInfo(isActive: boolean, onboardingComplete: boolean) {
  if (isActive && onboardingComplete) return { label: "Active", variant: "success" as const }
  if (isActive && !onboardingComplete) return { label: "Pending", variant: "secondary" as const }
  return { label: "Suspended", variant: "warning" as const }
}

export default function AdminCompaniesPage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
          companies.map((c) =>
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
        const { label, variant } = getStatusInfo(row.original.isActive, row.original.onboardingComplete)
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
        const isActive = row.original.isActive
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
            <Button size="sm" variant="destructive" onClick={() => handleAction(row.original.id, "delete")}>
              Delete
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Companies</h1>
        <p className="text-muted-foreground">Manage all registered companies on the platform</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Companies</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">Loading companies...</div>
          ) : (
            <DataTable columns={columns} data={companies} searchKey="name" />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
