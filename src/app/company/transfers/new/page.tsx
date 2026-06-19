"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeftRight, Loader2, ArrowLeft } from "lucide-react"
import { filterTransactionTypes } from "@/lib/utils"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"

export default function NewTransferPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const user = session?.user as any
  const [loading, setLoading] = useState(false)
  const [branches, setBranches] = useState<any[]>([])
  const [providers, setProviders] = useState<any[]>([])

  const availableTypes = filterTransactionTypes(user?.businessTypes || [])

  const [form, setForm] = useState({
    senderName: "",
    senderPhone: "",
    senderNationality: "",
    senderIdType: "",
    senderIdNumber: "",
    receiverName: "",
    receiverPhone: "",
    receiverMobile: "",
    receiverIdNumber: "",
    destinationBranchId: "",
    amount: "",
    currency: "SSP",
    transactionType: "CASH_TO_CASH",
    commissionType: "INCLUDED",
    mobileProviderId: "",
    notes: "",
  })

  useEffect(() => {
    fetch("/api/branches").then((r) => r.json()).then(setBranches)
    fetch("/api/providers").then((r) => r.json()).then(setProviders)
  }, [])

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Failed to create transaction")
        return
      }

      const data = await res.json()
      toast.success(`Transaction created! Secret Code: ${data.secretCode}`)
      router.push("/company/transfers")
    } catch {
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const amount = parseFloat(form.amount) || 0
  const commission = amount * 0.02
  const receiverGets = form.commissionType === "INCLUDED" ? amount - commission : amount
  const senderPays = form.commissionType === "SEPARATE" ? amount + commission : amount
  const needsProvider = form.transactionType === "CASH_TO_MOBILE" || form.transactionType === "MOBILE_TO_MOBILE"

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors -ml-1">
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
          <ArrowLeftRight className="h-6 w-6 text-primary-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">New Transaction</h1>
          <p className="text-muted-foreground">Create a money transfer or mobile money transaction</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Transaction Type */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Transaction Type</CardTitle>
            <CardDescription>Select how the money is sent and received</CardDescription>
          </CardHeader>
          <CardContent>
              <Tabs value={form.transactionType} onValueChange={(v) => updateField("transactionType", v)} className="w-full">
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(availableTypes.length, 4)}, 1fr)` }}>
                {availableTypes.map((tt) => (
                  <TabsTrigger key={tt.value} value={tt.value} className="text-xs sm:text-sm">{tt.label}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Sender */}
          <Card>
            <CardHeader>
              <CardTitle>Sender</CardTitle>
              <CardDescription>Who is sending the money?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input placeholder="John Deng" value={form.senderName} onChange={(e) => updateField("senderName", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input placeholder="+211 123 456 789" value={form.senderPhone} onChange={(e) => updateField("senderPhone", e.target.value)} required />
              </div>
              {(form.transactionType === "MOBILE_TO_CASH" || form.transactionType === "MOBILE_TO_MOBILE") && (
                <div className="space-y-2">
                  <Label>Sender Mobile Wallet Number</Label>
                  <Input placeholder="*123*456#" value={form.receiverMobile} onChange={(e) => updateField("receiverMobile", e.target.value)} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Nationality</Label>
                  <Input placeholder="South Sudanese" value={form.senderNationality} onChange={(e) => updateField("senderNationality", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>ID Type</Label>
                  <Select value={form.senderIdType} onValueChange={(v) => updateField("senderIdType", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NATIONAL_ID">National ID</SelectItem>
                      <SelectItem value="PASSPORT">Passport</SelectItem>
                      <SelectItem value="DRIVER_LICENSE">Driver License</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>ID Number</Label>
                <Input placeholder="ID-12345" value={form.senderIdNumber} onChange={(e) => updateField("senderIdNumber", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Receiver */}
          <Card>
            <CardHeader>
              <CardTitle>Receiver</CardTitle>
              <CardDescription>Who is receiving the money?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input placeholder="Mary Akol" value={form.receiverName} onChange={(e) => updateField("receiverName", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input placeholder="+211 987 654 321" value={form.receiverPhone} onChange={(e) => updateField("receiverPhone", e.target.value)} required />
              </div>
              {(form.transactionType === "CASH_TO_MOBILE" || form.transactionType === "MOBILE_TO_MOBILE") && (
                <div className="space-y-2">
                  <Label>Receiver Mobile Wallet Number</Label>
                  <Input placeholder="*123*789#" value={form.receiverMobile} onChange={(e) => updateField("receiverMobile", e.target.value)} />
                </div>
              )}
              <div className="space-y-2">
                <Label>Destination Branch *</Label>
                <Select value={form.destinationBranchId} onValueChange={(v) => updateField("destinationBranchId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name} - {b.city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transfer Details */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Transfer Details</CardTitle>
            <CardDescription>Amount, currency, and provider</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input type="number" step="0.01" min="0" placeholder="100000" value={form.amount} onChange={(e) => updateField("amount", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={form.currency} onValueChange={(v) => updateField("currency", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SSP">🇸🇸 SSP</SelectItem>
                    <SelectItem value="KES">🇰🇪 KES</SelectItem>
                    <SelectItem value="UGX">🇺🇬 UGX</SelectItem>
                    <SelectItem value="USD">🇺🇸 USD</SelectItem>
                    <SelectItem value="EUR">🇪🇺 EUR</SelectItem>
                    <SelectItem value="GBP">🇬🇧 GBP</SelectItem>
                    <SelectItem value="AED">🇦🇪 AED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Commission</Label>
                <Select value={form.commissionType} onValueChange={(v) => updateField("commissionType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCLUDED">Included in Amount</SelectItem>
                    <SelectItem value="SEPARATE">Paid Separately</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {needsProvider && (
                <div className="space-y-2">
                  <Label>Mobile Provider</Label>
                  <Select value={form.mobileProviderId} onValueChange={(v) => updateField("mobileProviderId", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {providers.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {amount > 0 && (
              <div className="p-4 rounded-lg bg-surface-50 dark:bg-surface-800/50 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Summary</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span>Transfer Amount</span>
                  <span className="text-right font-medium">{amount.toFixed(2)} {form.currency}</span>
                  <span>Commission (2%)</span>
                  <span className="text-right font-medium text-accent-600">{commission.toFixed(2)} {form.currency}</span>
                  <span className="font-medium">Receiver Gets</span>
                  <span className="text-right font-medium text-secondary-600">{receiverGets.toFixed(2)} {form.currency}</span>
                  {form.commissionType === "SEPARATE" && (
                    <><span className="font-medium">Sender Pays</span><span className="text-right font-medium text-danger-600">{senderPays.toFixed(2)} {form.currency}</span></>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes</Label>
              <Input placeholder="Optional" value={form.notes} onChange={(e) => updateField("notes", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Secret Code Info */}
        <div className="p-4 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 mt-6">
          <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
            A unique Secret Code will be auto-generated for this transaction. The receiver must provide this code to collect the payout.
          </p>
        </div>

        <div className="flex gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()} className="w-full" size="lg">Cancel</Button>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create Transaction
          </Button>
        </div>
      </form>
    </div>
  )
}
