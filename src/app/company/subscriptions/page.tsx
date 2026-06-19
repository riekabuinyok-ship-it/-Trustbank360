"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { CreditCard, Building2, CheckCircle2, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

interface Plan {
  id: string
  name: string
  description: string | null
  price: number
  currency: string
  durationDays: number
  features: string[]
  isActive: boolean
}

interface Subscription {
  id: string
  status: string
  planId: string
  paymentMethod: string | null
}

interface BankInfo {
  bankName: string | null
  bankAccountName: string | null
  bankAccountNumber: string | null
  bankInstructions: string | null
}

export default function SubscriptionsPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const companyId = user?.companyId
  const router = useRouter()

  const [plans, setPlans] = useState<Plan[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingPlan, setProcessingPlan] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "bank">("stripe")

  useEffect(() => {
    fetch("/api/company/subscriptions")
      .then((r) => r.json())
      .then((data) => {
        setPlans(data.plans || [])
        setSubscription(data.subscription || null)
        setBankInfo(data.bankInfo || null)
      })
      .catch(() => toast.error("Unable to load subscription data. Please try again."))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubscribe(plan: Plan) {
    if (!companyId) {
      toast.error("No company found")
      return
    }
    setSelectedPlan(plan)
    setShowDialog(true)
  }

  async function confirmSubscription() {
    if (!selectedPlan || !companyId) return
    setProcessingPlan(selectedPlan.id)
    setShowDialog(false)

    try {
      if (paymentMethod === "stripe") {
        const res = await fetch("/api/payments/stripe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId,
            planId: selectedPlan.id,
            successUrl: window.location.origin + "/company/billing",
            cancelUrl: window.location.origin + "/company/subscriptions",
          }),
        })
        const data = await res.json()
        if (res.ok && data.url) {
          window.location.href = data.url
        } else {
          toast.error(data.error || "Failed to create checkout session")
        }
      } else {
        // Bank transfer - create subscription first, then payment
        const subRes = await fetch("/api/company/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId,
            planId: selectedPlan.id,
            paymentMethod: "BANK_TRANSFER",
          }),
        })
        const subData = await subRes.json()
        if (!subRes.ok) {
          toast.error(subData.error || "Failed to create subscription")
          return
        }

        // Create bank payment
        const payRes = await fetch("/api/payments/bank", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId,
            subscriptionId: subData.subscription?.id,
            amount: selectedPlan.price,
          }),
        })
        const payData = await payRes.json()
        if (payRes.ok) {
          toast.success("Bank transfer request submitted. You will be contacted with payment details.")
          router.push("/company/billing")
        } else {
          toast.error(payData.error || "Failed to submit bank transfer")
        }
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setProcessingPlan(null)
      setSelectedPlan(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const statusLabels: Record<string, string> = {
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    CANCELLED: "Cancelled",
    EXPIRED: "Expired",
    PENDING: "Pending",
    TRIALING: "Trial",
  }

  const statusVariants: Record<string, "success" | "destructive" | "warning" | "secondary" | "outline"> = {
    ACTIVE: "success",
    INACTIVE: "destructive",
    CANCELLED: "destructive",
    EXPIRED: "destructive",
    PENDING: "warning",
    TRIALING: "secondary",
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/company/billing">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Subscription Plans</h1>
          <p className="text-muted-foreground">Choose a plan that fits your business needs</p>
        </div>
      </div>

      {subscription?.status === "ACTIVE" && (
        <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-800">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              You have an active subscription. Visit{" "}
              <Link href="/company/billing" className="font-medium underline">Billing</Link>{" "}
              to manage or upgrade your plan.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.filter((p) => p.isActive).map((plan) => {
          const isCurrent = subscription?.planId === plan.id
          return (
            <Card
              key={plan.id}
              className={isCurrent ? "border-primary-300 ring-2 ring-primary-200 dark:border-primary-700 dark:ring-primary-800" : ""}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {isCurrent && <Badge variant="success">Current</Badge>}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/{plan.durationDays} days</span>
                </div>

                <div className="space-y-1.5">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full gap-2"
                  variant={isCurrent ? "outline" : "default"}
                  disabled={processingPlan !== null || isCurrent}
                  onClick={() => handleSubscribe(plan)}
                >
                  {processingPlan === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrent ? (
                    "Current Plan"
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Subscribe
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {plans.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No subscription plans available. Contact platform admin.
          </CardContent>
        </Card>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Subscription</DialogTitle>
            <DialogDescription>
              You are about to subscribe to the{" "}
              <span className="font-semibold">{selectedPlan?.name}</span> plan for{" "}
              <span className="font-semibold">${selectedPlan?.price}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Choose payment method:</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  paymentMethod === "stripe"
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "border-surface-200 dark:border-surface-700 hover:border-primary-200"
                }`}
                onClick={() => setPaymentMethod("stripe")}
              >
                <CreditCard className="h-5 w-5 mb-2" />
                <p className="font-medium">Credit/Debit Card</p>
                <p className="text-xs text-muted-foreground">Pay securely via Stripe</p>
              </button>
              <button
                type="button"
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  paymentMethod === "bank"
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "border-surface-200 dark:border-surface-700 hover:border-primary-200"
                }`}
                onClick={() => setPaymentMethod("bank")}
              >
                <Building2 className="h-5 w-5 mb-2" />
                <p className="font-medium">Bank Transfer</p>
                <p className="text-xs text-muted-foreground">Manual verification</p>
              </button>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSubscription} disabled={processingPlan !== null}>
              {paymentMethod === "stripe" ? "Continue to Payment" : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}