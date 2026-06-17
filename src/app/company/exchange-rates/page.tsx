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
import { Percent, Plus, Loader2, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import toast from "react-hot-toast"

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
  const isAdmin = role === "COMPANY_OWNER" || role === "COMPANY_ADMIN"
  const isOwner = role === "COMPANY_OWNER"

  const [rates, setRates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedRate, setSelectedRate] = useState<any>(null)
  const [form, setForm] = useState({ fromCurrency: "USD", toCurrency: "SSP", buyRate: "", sellRate: "" })
  const [editForm, setEditForm] = useState({ buyRate: "", sellRate: "" })
  const [saving, setSaving] = useState(false)

  const fetchRates = () => {
    fetch("/api/exchange-rates").then(async (r) => { if (r.ok) setRates(await r.json()) })
  }

  useEffect(() => {
    fetch("/api/exchange-rates").then(async (r) => { if (r.ok) setRates(await r.json()) }).finally(() => setLoading(false))
  }, [])

  async function handleSubmit() {
    setSaving(true)
    try {
      const res = await fetch("/api/exchange-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, buyRate: parseFloat(form.buyRate), sellRate: parseFloat(form.sellRate) }),
      })
      if (res.ok) {
        toast.success("Rate created")
        setDialogOpen(false)
        setForm({ fromCurrency: "USD", toCurrency: "SSP", buyRate: "", sellRate: "" })
        fetchRates()
      }
    } catch {
      toast.error("Failed to create rate")
    } finally {
      setSaving(false)
    }
  }

  async function handleEdit() {
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
        toast.success("Rate updated")
        setEditDialogOpen(false)
        setSelectedRate(null)
        fetchRates()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to update rate")
      }
    } catch {
      toast.error("Failed to update rate")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!selectedRate) return
    try {
      const res = await fetch(`/api/exchange-rates/${selectedRate.id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Rate deleted")
        setDeleteDialogOpen(false)
        setSelectedRate(null)
        fetchRates()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to delete rate")
      }
    } catch {
      toast.error("Failed to delete rate")
    }
  }

  async function handleToggleActive(rate: any) {
    try {
      const res = await fetch(`/api/exchange-rates/${rate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !rate.isActive }),
      })
      if (res.ok) {
        toast.success(rate.isActive ? "Rate deactivated" : "Rate activated")
        fetchRates()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to update rate")
      }
    } catch {
      toast.error("Failed to update rate")
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Exchange Rates</h1>
          <p className="text-muted-foreground">Manage currency exchange rates</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Rate
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={rates} />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Exchange Rate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Currency</Label>
                <Select value={form.fromCurrency} onValueChange={(v) => setForm({ ...form, fromCurrency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>To Currency</Label>
                <Select value={form.toCurrency} onValueChange={(v) => setForm({ ...form, toCurrency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-2 gap-4">
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
