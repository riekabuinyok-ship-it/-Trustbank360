"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import toast from "react-hot-toast"
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Loader2,
  DollarSign,
  Building2,
  Users,
  Globe,
  Zap,
} from "lucide-react"

interface Plan {
  id: string
  name: string
  description: string | null
  price: number
  currency: string
  durationDays: number
  trialDays: number
  maxBranches: number
  maxStaff: number
  maxCurrencies: number
  features: string[]
  isActive: boolean
}

interface Payment {
  id: string
  amount: number
  currency: string
  method: string
  status: string
  transactionId: string | null
  createdAt: string
}

interface Subscription {
  id: string
  status: string
  paymentMethod: string | null
  startDate: string | null
  endDate: string | null
  trialEndsAt: string | null
  plan: Plan
  payments: Payment[]
}

const currencySymbols: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", KES: "KSh", UGX: "USh", SSP: "£" }

export default function BillingPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const isOwnerOrAdmin = user?.role === "company_owner" || user?.role === "company_admin"

  const [plans, setPlans] = useState<Plan[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [switchingPlan, setSwitchingPlan] = useState<string | null>(null)

  async function handleSubscribe(plan: Plan) {
    if (!user?.companyId) {
      toast.error("Company information not found")
      return
    }

    setSwitchingPlan(plan.id)
    try {
      const response = await fetch("/api/payments/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: user.companyId,
          planId: plan.id,
          successUrl: `${window.location.origin}/company/billing?success=subscribed`,
          cancelUrl: `${window.location.origin}/company/billing?canceled=true`,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to initiate checkout")
      }

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error("No checkout URL returned")
      }
    } catch (error) {
      console.error("Subscription error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to subscribe. Please try again.")
    } finally {
      setSwitchingPlan(null)
    }
  }

  useEffect(() => {
    fetch("/api/company/subscriptions")
      .then((r) => r.json())
      .then((data) => {
        setPlans(data.plans || [])
        setSubscription(data.subscription || null)
        setPayments(data.payments || [])
      })
      .catch(() => toast.error("Unable to load billing data. Please try again."))
      .finally(() => setLoading(false))
  }, [])

  const hasPlan = subscription && (subscription.status === "ACTIVE" || subscription.status === "TRIALING")
  const currentPlan = hasPlan ? subscription!.plan : null

  const isTrialing = subscription?.status === "TRIALING"

  const statusLabels: Record<string, string> = {
    ACTIVE: "Active", INACTIVE: "Inactive", CANCELLED: "Cancelled",
    EXPIRED: "Expired", PENDING: "Pending", TRIALING: "Trial",
  }

  const statusVariants: Record<string, "success" | "destructive" | "warning" | "secondary" | "outline"> = {
    ACTIVE: "success", INACTIVE: "destructive", CANCELLED: "destructive",
    EXPIRED: "destructive", PENDING: "warning", TRIALING: "secondary",
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 w-full max-w-full overflow-hidden">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
          <CreditCard className="h-6 w-6 text-primary-600" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Billing & Plan</h1>
          <p className="text-muted-foreground text-sm">Manage your subscription, upgrade or downgrade your plan</p>
        </div>
      </div>

      {!isOwnerOrAdmin && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Only Company Owners and Admins can manage billing. Contact your administrator for subscription changes.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Current Plan Summary — shown for both ACTIVE and TRIALING */}
      {hasPlan && currentPlan && subscription && (
        <Card className="border-primary-200 dark:border-primary-800 w-full max-w-full overflow-hidden">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-lg">Current Plan</CardTitle>
                <CardDescription>
                  {isTrialing
                    ? "Your trial period is active"
                    : "Your active subscription details"}
                </CardDescription>
              </div>
              <Badge variant={statusVariants[subscription.status] || "outline"} className="self-start sm:self-auto">
                {statusLabels[subscription.status] || subscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-3xl font-bold">
                {currencySymbols[currentPlan.currency] || "$"}{currentPlan.price}
              </span>
              <span className="text-muted-foreground">/month</span>
              {subscription.trialEndsAt && isTrialing && (
                <span className="text-xs text-amber-600 dark:text-amber-400 ml-2 font-medium">
                  Trial ends {new Date(subscription.trialEndsAt).toLocaleDateString()}
                </span>
              )}
              {subscription.endDate && !isTrialing && (
                <span className="text-xs text-muted-foreground ml-2">
                  {subscription.status === "ACTIVE"
                    ? `Renews ${new Date(subscription.endDate).toLocaleDateString()}`
                    : `Expired ${new Date(subscription.endDate).toLocaleDateString()}`}
                </span>
              )}
            </div>

            {/* Plan limits summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                <p className="text-xs text-muted-foreground">Plan</p>
                <p className="text-lg font-bold">{currentPlan.name}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                <p className="text-xs text-muted-foreground">Branches</p>
                <p className="text-lg font-bold">
                  {currentPlan.maxBranches >= 999999 ? "Unlimited" : currentPlan.maxBranches}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                <p className="text-xs text-muted-foreground">Staff</p>
                <p className="text-lg font-bold">
                  {currentPlan.maxStaff >= 999999 ? "Unlimited" : currentPlan.maxStaff}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                <p className="text-xs text-muted-foreground">Currencies</p>
                <p className="text-lg font-bold">
                  {currentPlan.maxCurrencies >= 999999 ? "Unlimited" : currentPlan.maxCurrencies}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 mb-6">
              {currentPlan.features.map((f: string, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Cards */}
      {plans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Available Plans</CardTitle>
            <CardDescription>Compare plans and switch anytime</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {plans.map((p) => {
                const isCurrent = currentPlan?.id === p.id
                const isLoading = switchingPlan === p.id
                const symbol = currencySymbols[p.currency] || "$"

                return (
                  <div
                    key={p.id}
                    className={`rounded-xl border p-5 transition-all flex flex-col ${
                      isCurrent
                        ? "border-primary-300 ring-2 ring-primary-200 dark:border-primary-700 dark:ring-primary-800"
                        : "hover:border-primary-200 dark:hover:border-primary-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-base font-bold">{p.name}</span>
                      {isCurrent && (
                        <Badge variant="success" className="text-[10px]">Current</Badge>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-2xl font-bold">{symbol}{p.price}</span>
                      <span className="text-xs text-muted-foreground">/month</span>
                    </div>
                    {!isCurrent && p.description && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{p.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mb-3">{p.trialDays}-day free trial</p>

                    {/* Plan limits */}
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3" /> Up to {p.maxBranches >= 999999 ? "unlimited" : p.maxBranches} branches
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" /> Up to {p.maxStaff >= 999999 ? "unlimited" : p.maxStaff} staff
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Globe className="h-3 w-3" /> Up to {p.maxCurrencies >= 999999 ? "unlimited" : p.maxCurrencies} currencies
                      </div>
                    </div>

                    <div className="space-y-1 flex-1 mb-4">
                      {p.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                          {f}
                        </div>
                      ))}
                    </div>

                    {isCurrent ? (
                      <div className="text-center">
                        <span className="text-xs text-primary-600 font-medium">Current Plan</span>
                      </div>
                    ) : isOwnerOrAdmin ? (
                      <Button
                        size="sm"
                        className="gap-1.5 w-full"
                        onClick={() => handleSubscribe(p)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CreditCard className="h-3.5 w-3.5" />
                        )}
                        {isLoading ? "Processing..." : "Proceed to Payment"}
                      </Button>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment History</CardTitle>
          <CardDescription>Recent invoices and payments</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-3">
                <DollarSign className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">No payments yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      p.status === "VERIFIED" || p.status === "Paid"
                        ? "bg-emerald-100 dark:bg-emerald-900/20"
                        : p.status === "PENDING"
                          ? "bg-amber-100 dark:bg-amber-900/20"
                          : "bg-red-100 dark:bg-red-900/20"
                    }`}>
                      {p.status === "VERIFIED" || p.status === "Paid" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : p.status === "PENDING" ? (
                        <Clock className="h-4 w-4 text-amber-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {p.transactionId ? `#${p.transactionId}` : "Payment"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString()} — {p.method}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">${p.amount} {p.currency}</p>
                    <Badge variant={
                      p.status === "VERIFIED" || p.status === "Paid"
                        ? "success" : p.status === "PENDING" ? "warning" : "destructive"
                    } className="text-[10px]">{p.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isOwnerOrAdmin && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="text-lg text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Subscription Expiry
            </CardTitle>
            <CardDescription>
              If your subscription expires, new transactions will be disabled and a warning banner will appear.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
              <Clock className="h-5 w-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">
                Your plan renews automatically. Ensure your payment method is up to date to avoid service interruption.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
