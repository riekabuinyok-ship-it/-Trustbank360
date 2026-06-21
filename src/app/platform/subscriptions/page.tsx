"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ColumnDef } from "@tanstack/react-table"
import { CreditCard, DollarSign, TrendingUp, Plus, Pencil, Trash2, Inbox, AlertCircle, CheckCircle2, XCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import toast from "react-hot-toast"

interface Plan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  durationDays: number
  features: string[]
  isActive: boolean
  _count: { subscriptions: number }
}

interface PaymentRecord {
  id: string
  company: { name: string }
  method: string
  status: string
  amount: number
  currency: string
  createdAt: string
  proofUrl: string | null
  subscription: { plan: { name: string } }
}

interface CurrencyEntry {
  id: string
  pair: string
  buyRate: number
  sellRate: number
  companyId: string
  companyName: string
  isActive: boolean
}

interface CurrencyManagement {
  activeCurrencies: CurrencyEntry[]
  stats: { total: number; byCompany: Record<string, string[]> }
}

interface RevenueData {
  total: number
  mrr: number
  thisMonth: number
}

const paymentStatusColors: Record<string, string> = {
  PENDING: "warning",
  VERIFIED: "success",
  FAILED: "destructive",
  REFUNDED: "secondary",
}

const currencies = ["USD", "SSP", "KES", "UGX", "EUR", "GBP", "AED"]

export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [revenue, setRevenue] = useState<RevenueData>({ total: 0, mrr: 0, thisMonth: 0 })
  const [currencyManagement, setCurrencyManagement] = useState<CurrencyManagement>({ activeCurrencies: [], stats: { total: 0, byCompany: {} } })
  const [trialSubscriptions, setTrialSubscriptions] = useState<any[]>([])
  const [trialCount, setTrialCount] = useState(0)
  const [potentialMrr, setPotentialMrr] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    currency: "USD",
    durationDays: "30",
    features: "",
    isActive: true,
  })
  const [saving, setSaving] = useState(false)
  const [activeFilter, setActiveFilter] = useState<string>("all")

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/subscriptions")
      if (res.ok) {
        const data = await res.json()
        setPlans(data.plans)
        setPayments(data.payments)
        setRevenue(data.revenue)
        setTrialSubscriptions(data.trialSubscriptions || [])
        setTrialCount(data.trialCount || 0)
        setPotentialMrr(data.potentialMrr || 0)
        if (data.currencyManagement) setCurrencyManagement(data.currencyManagement)
      } else {
        toast.error("Unable to load subscription data. Please try again.")
      }
    } catch {
      toast.error("Unable to load subscription data. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function openCreateDialog() {
    setEditingPlan(null)
    setFormData({ name: "", description: "", price: "", currency: "USD", durationDays: "30", features: "", isActive: true })
    setDialogOpen(true)
  }

  function openEditDialog(plan: Plan) {
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      description: plan.description || "",
      price: String(plan.price),
      currency: plan.currency,
      durationDays: String(plan.durationDays),
      features: plan.features.join("\n"),
      isActive: plan.isActive,
    })
    setDialogOpen(true)
  }

  function openDeleteDialog(plan: Plan) {
    setDeletingPlan(plan)
    setDeleteDialogOpen(true)
  }

  async function handleSave() {
    if (!formData.name || !formData.price || !formData.durationDays) {
      toast.error("Name, price, and duration are required")
      return
    }
    setSaving(true)
    try {
      const action = editingPlan ? "update" : "create"
      const body: any = { action, ...formData, features: formData.features.split("\n").filter(Boolean).map((f) => f.trim()) }
      if (editingPlan) body.id = editingPlan.id

      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        toast.success(editingPlan ? "Plan updated" : "Plan created")
        setDialogOpen(false)
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to save plan")
      }
    } catch {
      toast.error("Unable to save plan. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deletingPlan) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id: deletingPlan.id }),
      })
      if (res.ok) {
        toast.success("Plan deleted")
        setDeleteDialogOpen(false)
        setDeletingPlan(null)
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to delete plan")
      }
    } catch {
      toast.error("Unable to delete plan. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const activeSubscriptions = plans.reduce((sum, p) => sum + p._count.subscriptions, 0)

  const filteredPayments = payments.filter((p) => {
    if (activeFilter === "failed") return p.status === "FAILED"
    if (activeFilter === "pending") return p.status === "PENDING"
    if (activeFilter === "verified") return p.status === "VERIFIED"
    return true
  })

  const failedPayments = payments.filter((p) => p.status === "FAILED")

  const planColumns: ColumnDef<Plan>[] = [
    { accessorKey: "name", header: "Plan Name" },
    {
      id: "price",
      header: "Price",
      cell: ({ row }) => formatCurrency(row.original.price, row.original.currency),
    },
    {
      accessorKey: "durationDays",
      header: "Duration",
      cell: ({ row }) => `${row.original.durationDays} days`,
    },
    {
      accessorKey: "features",
      header: "Features",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {row.original.features.slice(0, 3).map((f, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {f}
            </Badge>
          ))}
          {row.original.features.length > 3 && (
            <Badge variant="outline" className="text-xs">+{row.original.features.length - 3}</Badge>
          )}
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "success" : "secondary"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      accessorKey: "_count.subscriptions",
      header: "Subscribers",
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEditDialog(row.original)}>
            <Pencil className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(row.original)}>
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete
          </Button>
        </div>
      ),
    },
  ]

  const paymentColumns: ColumnDef<PaymentRecord>[] = [
    {
      accessorKey: "company.name",
      header: "Company",
    },
    {
      accessorKey: "subscription.plan.name",
      header: "Plan",
    },
    {
      accessorKey: "method",
      header: "Method",
      cell: ({ row }) => (
        <Badge variant={row.original.method === "STRIPE" ? "default" : "secondary"}>
          {row.original.method === "STRIPE" ? "Stripe" : "Bank Transfer"}
        </Badge>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const variant = paymentStatusColors[row.original.status] as any
        return <Badge variant={variant || "outline"}>{row.original.status}</Badge>
      },
    },
    {
      id: "amount",
      header: "Amount",
      cell: ({ row }) => formatCurrency(row.original.amount, row.original.currency),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
  ]

  const currencyTypes = ["USD", "SSP", "KES", "UGX", "EUR", "GBP", "AED"]

  const [selectedCurrency, setSelectedCurrency] = useState({ from: "USD", to: "SSP" })
  const [buyRate, setBuyRate] = useState("")
  const [sellRate, setSellRate] = useState("")
  const [companyId, setCompanyId] = useState("")
  const [currencyManagementMode, setCurrencyManagementMode] = useState("view")
  const [editingRate, setEditingRate] = useState<CurrencyEntry | null>(null)
  const [deletingRate, setDeletingRate] = useState<CurrencyEntry | null>(null)
  const [rateEditOpen, setRateEditOpen] = useState(false)
  const [rateDeleteOpen, setRateDeleteOpen] = useState(false)
  const [editBuyRate, setEditBuyRate] = useState("")
  const [editSellRate, setEditSellRate] = useState("")

  async function handleCurrencyAction(action: string, data: any) {
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, action }),
      })
      if (res.ok) {
        toast.success(`${action} successful`)
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || `${action} failed`)
      }
    } catch {
      toast.error(`${action} failed`)
    }
  }

  async function handleUpdateRate() {
    if (!editingRate || !editBuyRate || !editSellRate) return
    setSaving(true)
    try {
      const res = await fetch(`/api/exchange-rates/${editingRate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyRate: parseFloat(editBuyRate), sellRate: parseFloat(editSellRate) }),
      })
      if (res.ok) {
        toast.success("Exchange rate updated")
        setRateEditOpen(false)
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to update rate")
      }
    } catch {
      toast.error("Unable to update exchange rate. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteRate() {
    if (!deletingRate) return
    setSaving(true)
    try {
      const res = await fetch(`/api/exchange-rates/${deletingRate.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast.success("Exchange rate deleted")
        setRateDeleteOpen(false)
        setDeletingRate(null)
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to delete rate")
      }
    } catch {
      toast.error("Unable to delete exchange rate. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  function openAddCurrencyDialog() {
    setSelectedCurrency({ from: "USD", to: "SSP" })
    setBuyRate("1")
    setSellRate("1.2")
    setCurrencyManagementMode("add")
  }

  function openEditRate(rate: CurrencyEntry) {
    setEditingRate(rate)
    setEditBuyRate(String(rate.buyRate))
    setEditSellRate(String(rate.sellRate))
    setRateEditOpen(true)
  }

  function openDeleteRate(rate: CurrencyEntry) {
    setDeletingRate(rate)
    setRateDeleteOpen(true)
  }

  function openExchangeRateDialog(companyId: string) {
    setCompanyId(companyId)
    setCurrencyManagementMode("rate")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-600 animate-pulse flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Loading subscriptions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <div>
        <h1 className="text-2xl font-bold">Subscriptions & Revenue</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage subscription plans and track payments</p>
      </div>

      {/* Revenue Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-primary-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
            <p className="text-xl font-bold mt-1">{formatCurrency(revenue.total, "USD")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">MRR</p>
            <p className="text-xl font-bold mt-1">{formatCurrency(revenue.mrr, "USD")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">This Month</p>
            <p className="text-xl font-bold mt-1">{formatCurrency(revenue.thisMonth, "USD")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Active Subs</p>
            <p className="text-xl font-bold mt-1">{activeSubscriptions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-violet-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">On Trial</p>
            <p className="text-xl font-bold mt-1">{trialCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Potential MRR</p>
            <p className="text-xl font-bold mt-1">{formatCurrency(potentialMrr, "USD")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Plans */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">Subscription Plans</CardTitle>
          <Button size="sm" onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-1" />
            Add Plan
          </Button>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-3">
                <Inbox className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No plans yet</p>
              <p className="text-xs text-muted-foreground mb-4">Create your first subscription plan to get started.</p>
              <Button size="sm" variant="outline" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-1" />
                Add Plan
              </Button>
            </div>
          ) : (
            <DataTable columns={planColumns} data={plans} searchKey="name" />
          )}
        </CardContent>
      </Card>

      {/* Payments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">Payments</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-3">
                <Inbox className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No payments found</p>
              <p className="text-xs text-muted-foreground">There are no payments to display.</p>
            </div>
          ) : (
            <DataTable columns={paymentColumns} data={filteredPayments} searchKey="company.name" />
          )}
        </CardContent>
      </Card>

      {/* Failed Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-danger-500" />
            Failed Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {failedPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No failed payments</p>
              <p className="text-xs text-muted-foreground">All payments are processing successfully.</p>
            </div>
          ) : (
            <div className="divide-y">
              {failedPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-5 w-5 text-danger-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{p.company.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.subscription.plan.name} &middot; {new Date(p.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(p.amount, p.currency)}</p>
                    <Badge variant="destructive" className="text-xs">Failed</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trial Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-violet-500" />
            Companies on Trial
            {trialCount > 0 && (
              <Badge variant="secondary" className="ml-1">{trialCount}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trialSubscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-3">
                <Inbox className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No companies on trial</p>
              <p className="text-xs text-muted-foreground">New companies will appear here when they start their trial period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Company</th>
                    <th className="pb-3 font-medium text-muted-foreground">Plan</th>
                    <th className="pb-3 font-medium text-muted-foreground">Started</th>
                    <th className="pb-3 font-medium text-muted-foreground">Trial Ends</th>
                    <th className="pb-3 font-medium text-muted-foreground">Days Left</th>
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {trialSubscriptions.map((s: any) => {
                    const daysLeft = s.daysRemaining
                    const isExpired = daysLeft <= 0
                    const isUrgent = daysLeft > 0 && daysLeft <= 7
                    const startDate = s.startDate ? new Date(s.startDate).toLocaleDateString() : "—"
                    const endDate = s.trialEndsAt ? new Date(s.trialEndsAt).toLocaleDateString() : "—"
                    return (
                      <tr key={s.id} className="border-b last:border-0 hover:bg-surface-50 dark:hover:bg-surface-800/50">
                        <td className="py-3 pr-4">
                          <p className="font-medium">{s.company?.name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{s.company?.email || ""}</p>
                        </td>
                        <td className="py-3 pr-4">{s.plan?.name || "—"}</td>
                        <td className="py-3 pr-4">{startDate}</td>
                        <td className="py-3 pr-4">{endDate}</td>
                        <td className="py-3 pr-4">
                          <Badge variant={
                            isExpired ? "destructive" : isUrgent ? "warning" : "success"
                          }>
                            {isExpired ? "Expired" : `${daysLeft} day${daysLeft === 1 ? "" : "s"}`}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <Badge variant="secondary" className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                            TRIALING
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Plan Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Plan" : "Add Plan"}</DialogTitle>
            <DialogDescription>
              {editingPlan ? "Update the subscription plan details." : "Create a new subscription plan."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Medium Company"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the plan"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="99.99"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationDays">Duration (days)</Label>
              <Input
                id="durationDays"
                type="number"
                min="1"
                value={formData.durationDays}
                onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                placeholder="30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="features">Features (one per line)</Label>
              <Textarea
                id="features"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                placeholder="Up to 10 users&#10;API access&#10;Priority support"
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingPlan ? "Update Plan" : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deletingPlan?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Currency Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">Currency Management</CardTitle>
          <Button size="sm" onClick={openAddCurrencyDialog}>
            <Plus className="h-4 w-4 mr-1" />
            Add Currency
          </Button>
        </CardHeader>
        <CardContent>
          {currencyManagementMode === "view" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Active Currencies</h3>
                  <p className="text-xs text-muted-foreground">Total active currency pairs: {currencyManagement.stats.total}</p>
                </div>
              </div>
              {currencyManagement.activeCurrencies.length > 0 ? (
                <div className="space-y-2 mt-2">
                  {currencyManagement.activeCurrencies.slice(0, 24).map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-md border text-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-medium shrink-0">{c.pair}</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {c.companyName} · B:{c.buyRate} S:{c.sellRate}
                        </span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openEditRate(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={() => openDeleteRate(c)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2">No exchange rates configured yet.</p>
              )}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Company ID"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="max-w-xs"
                />
                <Button
                  size="sm"
                  onClick={() => companyId && openExchangeRateDialog(companyId)}
                  disabled={!companyId}
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Manage Exchange Rates
                </Button>
              </div>
            </div>
          ) : currencyManagementMode === "add" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromCurrency">From Currency</Label>
                  <Select
                    value={selectedCurrency.from}
                    onValueChange={(v) => setSelectedCurrency((p) => ({ ...p, from: v }))}
                  >
                    <SelectTrigger id="fromCurrency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyTypes.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toCurrency">To Currency</Label>
                  <Select
                    value={selectedCurrency.to}
                    onValueChange={(v) => setSelectedCurrency((p) => ({ ...p, to: v }))}
                  >
                    <SelectTrigger id="toCurrency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyTypes.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buyRate">Buy Rate</Label>
                  <Input
                    id="buyRate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={buyRate}
                    onChange={(e) => setBuyRate(e.target.value)}
                    placeholder="1.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellRate">Sell Rate</Label>
                  <Input
                    id="sellRate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={sellRate}
                    onChange={(e) => setSellRate(e.target.value)}
                    placeholder="1.20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyId">Company ID</Label>
                <Input
                  id="companyId"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  placeholder="Company ID"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleCurrencyAction("addCurrency", {
                    fromCurrency: selectedCurrency.from,
                    toCurrency: selectedCurrency.to,
                    buyRate,
                    sellRate,
                    companyId,
                  })}
                  disabled={!buyRate || !sellRate || !companyId}
                >
                  Add Currency
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrencyManagementMode("view")}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exchangeRateCompanyId">Company ID</Label>
                <Input
                  id="exchangeRateCompanyId"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  placeholder="Company ID"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Exchange rate management for company: {companyId}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setCurrencyManagementMode("view")}
                >
                  Back
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Exchange Rate Dialog */}
      <Dialog open={rateEditOpen} onOpenChange={setRateEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Exchange Rate</DialogTitle>
            <DialogDescription>
              Update buy/sell rates for {editingRate?.pair} — {editingRate?.companyName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editBuyRate">Buy Rate</Label>
              <Input
                id="editBuyRate"
                type="number"
                step="0.01"
                min="0"
                value={editBuyRate}
                onChange={(e) => setEditBuyRate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editSellRate">Sell Rate</Label>
              <Input
                id="editSellRate"
                type="number"
                step="0.01"
                min="0"
                value={editSellRate}
                onChange={(e) => setEditSellRate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRateEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateRate} disabled={saving || !editBuyRate || !editSellRate}>
              {saving ? "Updating..." : "Update Rate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Exchange Rate Dialog */}
      <Dialog open={rateDeleteOpen} onOpenChange={setRateDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Exchange Rate</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the rate for <strong>{deletingRate?.pair}</strong> ({deletingRate?.companyName})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRateDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteRate} disabled={saving}>
              {saving ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
