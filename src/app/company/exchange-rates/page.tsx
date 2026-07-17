"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Percent, Plus, Loader2, Pencil, Trash2, ToggleLeft, ToggleRight, WifiOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import toast from "react-hot-toast"
import { useOfflineExchangeRates } from "@/lib/hooks/use-offline-data"

const currencies = [
  { value: "SSP", label: "SSP" },
  { value: "USD", label: "USD" },
  { value: "KES", label: "KES" },
  { value: "UGX", label: "UGX" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
]

export default function ExchangeRatesPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role
  const isAdmin = role === "COMPANY_OWNER" || role === "company_owner" || role === "COMPANY_ADMIN" || role === "company_admin"
  const isOwner = role === "COMPANY_OWNER" || role === "company_owner"

  const { data: rates, loading, isFromCache, refetch: refetchRates } = useOfflineExchangeRates()
  const [allowedCurrencies, setAllowedCurrencies] = useState<string[]>(["SSP", "KES", "UGX", "USD", "EUR", "GBP", "AED"])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedRate, setSelectedRate] = useState<any>(null)
  const [form, setForm] = useState({ fromCurrency: "USD", toCurrency: "SSP", buyRate: "", sellRate: "" })
  const [editForm, setEditForm] = useState({ buyRate: "", sellRate: "" })
  const [saving, setSaving] = useState(false)
  const isOffline = typeof navigator !== "undefined" && !navigator.onLine

  useEffect(() => {
    fetch("/api/company/plan").then((r) => r.json()).then((d) => {
      if (d.allowedCurrencies) setAllowedCurrencies(d.allowedCurrencies)
    }).catch(() => {})
  }, [])

  async function handleSubmit() {
    if (isOffline) { toast.error("An internet connection is required."); return }
    setSaving(true)
    try {
      const res = await fetch("/api/exchange-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, buyRate: parseFloat(form.buyRate), sellRate: parseFloat(form.sellRate) }),
      })
      if (res.ok) {
        toast.success("Exchange rate created successfully")
        setDialogOpen(false)
        setForm({ fromCurrency: "USD", toCurrency: "SSP", buyRate: "", sellRate: "" })
        refetchRates()
      } else {
        const data = await res.json()
        toast.error(data.error || "Unable to create exchange rate")
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  async function handleEdit() {
    if (isOffline) { toast.error("An internet connection is required."); return }
    if (!selectedRate) return
    setSaving(true)
    try {
      const res = await fetch(`/api/exchange-rates/${selectedRate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyRate: parseFloat(editForm.buyRate),
          sellRate: parseFloat(editForm.sellRate),
        }),
      })
      if (res.ok) {
        toast.success("Exchange rate updated successfully")
        setEditDialogOpen(false)
        setSelectedRate(null)
        refetchRates()
      } else {
        const data = await res.json()
        toast.error(data.error || "Unable to update exchange rate")
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (isOffline) { toast.error("An internet connection is required."); return }
    if (!selectedRate) return
    try {
      const res = await fetch(`/api/exchange-rates/${selectedRate.id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Exchange rate deleted successfully")
        setDeleteDialogOpen(false)
        setSelectedRate(null)
        refetchRates()
      } else {
        const data = await res.json()
        toast.error(data.error || "Unable to delete exchange rate")
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.")
    }
  }

  async function handleToggleActive(rate: any) {
    if (isOffline) { toast.error("An internet connection is required."); return }
    try {
      const res = await fetch(`/api/exchange-rates/${rate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !rate.isActive }),
      })
      if (res.ok) {
        toast.success(rate.isActive ? "Exchange rate deactivated" : "Exchange rate activated")
        refetchRates()
      } else {
        const data = await res.json()
        toast.error(data.error || "Unable to update exchange rate status")
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.")
    }
  }

  function openEdit(rate: any) {
    setSelectedRate(rate)
    setEditForm({ buyRate: String(rate.buyRate), sellRate: String(rate.sellRate) })
    setEditDialogOpen(true)
  }

  function openDelete(rate: any) {
    setSelectedRate(rate)
    setDeleteDialogOpen(true)
  }

  const columns: ColumnDef<any>[] = [
    { accessorKey: "fromCurrency", header: "From" },
    { accessorKey: "toCurrency", header: "To" },
    { accessorKey: "buyRate", header: "Buy Rate", cell: ({ row }) => <span className="text-emerald-600 font-medium">{row.original.buyRate}</span> },
    { accessorKey: "sellRate", header: "Sell Rate", cell: ({ row }) => <span className="text-red-600 font-medium">{row.original.sellRate}</span> },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => <Badge variant={row.original.isActive ? "success" : "destructive"}>{row.original.isActive ? "Active" : "Inactive"}</Badge>,
    },
    { accessorKey: "createdAt", header: "Updated", cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString() },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const rate = row.original
        return (
          <div className="flex items-center gap-1">
            {isAdmin && (
              <>
                <Button variant="ghost" size="icon" onClick={() => openEdit(rate)} title="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleToggleActive(rate)} title={rate.isActive ? "Deactivate" : "Activate"}>
                  {rate.isActive ? <ToggleRight className="h-4 w-4 text-amber-500" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </>
            )}
            {isOwner && (
              <Button variant="ghost" size="icon" onClick={() => openDelete(rate)} title="Delete">
                <Trash2 className="h-4 w-4 text-red-500" />
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
          <h1 className="text-2xl font-bold">Exchange Rates</h1>
          <p className="text-muted-foreground text-sm">Manage currency exchange rates</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setDialogOpen(true)} className="gap-2 w-full sm:w-auto" size="sm">
            <Plus className="h-4 w-4" />
            Add Rate
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Current Rates</CardTitle>
              {isFromCache && (
                <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 gap-1">
                  <WifiOff className="h-3 w-3" /> Cached
                </Badge>
              )}
            </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={rates || []} />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Exchange Rate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Currency</Label>
                <Select value={form.fromCurrency} onValueChange={(v) => setForm({ ...form, fromCurrency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {currencies.filter((c) => allowedCurrencies.includes(c.value)).map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>To Currency</Label>
                <Select value={form.toCurrency} onValueChange={(v) => setForm({ ...form, toCurrency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {currencies.filter((c) => allowedCurrencies.includes(c.value)).map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Buy Rate</Label>
                <Input type="number" step="0.01" placeholder="850.00" value={form.buyRate} onChange={(e) => setForm({ ...form, buyRate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Sell Rate</Label>
                <Input type="number" step="0.01" placeholder="870.00" value={form.sellRate} onChange={(e) => setForm({ ...form, sellRate: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Rate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Exchange Rate</DialogTitle>
          </DialogHeader>
          {selectedRate && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {selectedRate.fromCurrency} &rarr; {selectedRate.toCurrency}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Buy Rate</Label>
                  <Input type="number" step="0.01" value={editForm.buyRate} onChange={(e) => setEditForm({ ...editForm, buyRate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Sell Rate</Label>
                  <Input type="number" step="0.01" value={editForm.sellRate} onChange={(e) => setEditForm({ ...editForm, sellRate: e.target.value })} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Rate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exchange Rate?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedRate && (
                <>Are you sure you want to delete the rate for {selectedRate.fromCurrency} &rarr; {selectedRate.toCurrency}? This action cannot be undone.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
