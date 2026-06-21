"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeftRight, Loader2, ArrowLeft } from "lucide-react"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"

export default function NewDepositPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [providers, setProviders] = useState<any[]>([])

  const [form, setForm] = useState({
    customerName: "",
    phoneNumber: "",
    mobileProviderId: "",
    walletNumber: "",
    amount: "",
    currency: "SSP",
    notes: "",
  })

  useEffect(() => {
    fetch("/api/providers").then((r) => r.json()).then(setProviders).catch(() => setProviders([]))
  }, [])

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/transactions/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Failed to process deposit")
        return
      }

      const data = await res.json()
      toast.success(`Deposit completed! Transaction: ${data.transactionNumber}`)
      router.push("/company/transfers")
    } catch {
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 w-full max-w-full overflow-hidden">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors -ml-1">
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
          <ArrowLeftRight className="h-6 w-6 text-primary-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Deposit</h1>
          <p className="text-muted-foreground">Cash deposit to mobile wallet</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Who is depositing money?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Customer Name *</Label>
              <Input placeholder="John Deng" value={form.customerName} onChange={(e) => updateField("customerName", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input placeholder="+211 123 456 789" value={form.phoneNumber} onChange={(e) => updateField("phoneNumber", e.target.value)} required />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Mobile Wallet</CardTitle>
            <CardDescription>Destination mobile wallet details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Mobile Provider *</Label>
              <Select value={form.mobileProviderId} onValueChange={(v) => updateField("mobileProviderId", v)} required>
                <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                <SelectContent>
                  {providers.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Wallet Number *</Label>
              <Input placeholder="*123*456#" value={form.walletNumber} onChange={(e) => updateField("walletNumber", e.target.value)} required />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Amount</CardTitle>
            <CardDescription>Deposit amount and currency</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input type="number" step="0.01" min="0" placeholder="100000" value={form.amount} onChange={(e) => updateField("amount", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={form.currency} onValueChange={(v) => updateField("currency", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SSP">SSP</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="KES">KES</SelectItem>
                    <SelectItem value="UGX">UGX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input placeholder="Optional" value={form.notes} onChange={(e) => updateField("notes", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()} className="w-full" size="lg">Cancel</Button>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Process Deposit
          </Button>
        </div>
      </form>
    </div>
  )
}
