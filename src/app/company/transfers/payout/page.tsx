"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, CheckCircle2, Loader2, XCircle, Building2, User, ArrowRight, ShieldCheck } from "lucide-react"
import toast from "react-hot-toast"
import { formatCurrency, getTransactionTypeLabel } from "@/lib/utils"

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
  REVERSED: "bg-slate-100 text-slate-800",
}

export default function PayoutPage() {
  const [secretCode, setSecretCode] = useState("")
  const [searching, setSearching] = useState(false)
  const [transfer, setTransfer] = useState<any>(null)
  const [error, setError] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [step, setStep] = useState<"search" | "found" | "completed">("search")

  // USD ID verification fields
  const [receiverNationality, setReceiverNationality] = useState("")
  const [receiverIdType, setReceiverIdType] = useState("")
  const [receiverIdNumber, setReceiverIdNumber] = useState("")

  // Pre-fill USD ID fields from receiver Customer data when transfer is found
  useEffect(() => {
    if (transfer && transfer.receiver) {
      setReceiverNationality(transfer.receiver.nationality || "")
      setReceiverIdType(transfer.receiver.idType || "")
      setReceiverIdNumber(transfer.receiver.idNumber || "")
    }
  }, [transfer])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearching(true)
    setError("")
    setTransfer(null)
    setStep("search")
    try {
      const res = await fetch(`/api/transfers/lookup?secretCode=${secretCode}`)
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Transaction not found")
        return
      }
      const data = await res.json()
      setTransfer(data)
      if (data.status === "COMPLETED") {
        setStep("completed")
      } else {
        setStep("found")
      }
    } catch {
      setError("Failed to look up transaction")
    } finally {
      setSearching(false)
    }
  }

  const requiresUsdId = transfer?.currency === "USD"
  const usdIdValid = !requiresUsdId || (
    receiverNationality.trim() !== "" &&
    receiverIdType.trim() !== "" &&
    receiverIdNumber.trim() !== ""
  )

  async function handleCompletePayout() {
    if (!transfer) return
    if (!usdIdValid) {
      toast.error("Please fill in all receiver ID fields for USD payouts")
      return
    }
    setActionLoading("payout")
    try {
      const body: any = { transferId: transfer.id, secretCode }
      if (requiresUsdId) {
        body.receiverNationality = receiverNationality.trim()
        body.receiverIdType = receiverIdType.trim()
        body.receiverIdNumber = receiverIdNumber.trim()
      }
      const res = await fetch("/api/transfers/confirm-payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        const msg = data.message || data.error || "Payout failed"
        toast.error(msg)
        setError(msg)
        return
      }
      setTransfer({ ...transfer, status: "COMPLETED" })
      setStep("completed")
      toast.success("Payout completed successfully")
    } catch {
      toast.error("Failed to process payout")
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payout</h1>
        <p className="text-muted-foreground">Process customer payout using secret code</p>
      </div>

      {/* Step 1: Search */}
      {step === "search" && (
        <Card>
          <CardHeader>
            <CardTitle>Enter Secret Code</CardTitle>
            <CardDescription>Enter the customer&apos;s secret code to look up the transaction.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Secret Code</Label>
                <Input
                  id="code"
                  placeholder="e.g. TRU12345"
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value.toUpperCase())}
                  className="font-mono text-lg text-center tracking-widest"
                  maxLength={8}
                  required
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full gap-2" disabled={searching || !secretCode}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Look Up Transaction
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Found */}
      {step === "found" && transfer && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Transaction Found</CardTitle>
              <Badge className={statusColors[transfer.status]}>
                {transfer.status === "PENDING" ? "Pending Payout" : transfer.status}
              </Badge>
            </div>
            <CardDescription>Verify the details and complete the payout.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-surface-50 dark:bg-surface-800">
              <div>
                <p className="text-xs text-muted-foreground">TXN Number</p>
                <p className="text-sm font-mono font-semibold">{transfer.transactionNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Secret Code</p>
                <p className="text-sm font-mono font-bold text-primary">{transfer.secretCode}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Sender
                </p>
                <p className="text-sm font-semibold">{transfer.sender?.fullName}</p>
                <p className="text-xs text-muted-foreground">{transfer.sender?.phone}</p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Receiver
                </p>
                <p className="text-sm font-semibold">{transfer.receiver?.fullName}</p>
                <p className="text-xs text-muted-foreground">{transfer.receiver?.phone}</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
              <p className="text-xs text-muted-foreground">Payout Amount</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {formatCurrency(transfer.amount, transfer.currency)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Type: {getTransactionTypeLabel(transfer.transactionType)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  Sender Branch
                </p>
                <p className="font-medium">{transfer.branchLink?.senderBranch?.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  Issued By
                </p>
                <p className="font-medium">{transfer.issuedBy?.name}</p>
              </div>
            </div>

            {/* USD ID Verification Section */}
            {requiresUsdId && (
              <div className="p-4 rounded-lg border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/10 dark:border-amber-800 space-y-4">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                      USD Payout — Receiver ID Verification Required
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                      USD payouts require the receiver's Nationality, ID Type, and ID Number for compliance.
                      Fields are pre-filled from the receiver's profile if available.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="receiverNationality">Nationality *</Label>
                    <Input
                      id="receiverNationality"
                      placeholder="e.g. South Sudanese"
                      value={receiverNationality}
                      onChange={(e) => setReceiverNationality(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="receiverIdType">ID Type *</Label>
                    <Select value={receiverIdType} onValueChange={setReceiverIdType}>
                      <SelectTrigger id="receiverIdType">
                        <SelectValue placeholder="Select ID type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NATIONAL_ID">National ID</SelectItem>
                        <SelectItem value="PASSPORT">Passport</SelectItem>
                        <SelectItem value="DRIVER_LICENSE">Driver License</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receiverIdNumber">ID Number *</Label>
                  <Input
                    id="receiverIdNumber"
                    placeholder="e.g. ID-12345"
                    value={receiverIdNumber}
                    onChange={(e) => setReceiverIdNumber(e.target.value)}
                  />
                </div>
                {!usdIdValid && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    All three fields are required for USD payouts.
                  </p>
                )}
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button
              className="w-full gap-2"
              size="lg"
              onClick={handleCompletePayout}
              disabled={actionLoading === "payout" || !usdIdValid}
            >
              {actionLoading === "payout" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
              Complete Payout
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Completed */}
      {step === "completed" && transfer && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              <CardTitle>Payout Completed</CardTitle>
            </div>
            <CardDescription>
              The customer has been paid successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
              <p className="text-xs text-muted-foreground">Amount Paid</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {formatCurrency(transfer.amount, transfer.currency)}
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => { setStep("search"); setSecretCode(""); setTransfer(null); setError(""); setReceiverNationality(""); setReceiverIdType(""); setReceiverIdNumber("") }}
            >
              <Search className="h-4 w-4" />
              Process Another Payout
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
