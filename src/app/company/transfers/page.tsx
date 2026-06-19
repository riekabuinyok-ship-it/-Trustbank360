"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowLeftRight, Plus, Search, Eye, Printer, XCircle, RotateCcw, CheckCircle2, Loader2, Clock, FileText } from "lucide-react"
import Link from "next/link"
import { formatCurrency, getTransactionTypeLabel } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useSession } from "next-auth/react"
import { SlaTimer } from "@/components/sla-timer"

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  REVERSED: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
}

const statusIcons: Record<string, any> = {
  PENDING: Clock,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
  REVERSED: RotateCcw,
}

const actionIcons: Record<string, any> = {
  TRANSACTION_CREATED: FileText,
  RECEIPT_PRINTED: Printer,
  RECEIPT_REPRINTED: Printer,
  CANCELLED: XCircle,
  REVERSED: RotateCcw,
  PAYOUT_CONFIRMED: CheckCircle2,
  COMPLETED: CheckCircle2,
}

const actionLabels: Record<string, string> = {
  TRANSACTION_CREATED: "Transaction Created",
  RECEIPT_PRINTED: "Receipt Printed",
  RECEIPT_REPRINTED: "Receipt Reprinted",
  CANCELLED: "Transaction Cancelled",
  REVERSED: "Transaction Reversed",
  PAYOUT_CONFIRMED: "Payout Confirmed",
  COMPLETED: "Transaction Completed",
}

export default function TransfersPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const [transfers, setTransfers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showReverseDialog, setShowReverseDialog] = useState(false)
  const [showPayoutDialog, setShowPayoutDialog] = useState(false)
  const [payoutSecretCode, setPayoutSecretCode] = useState("")
  const [payoutError, setPayoutError] = useState("")
  const [cancelReason, setCancelReason] = useState("")
  const [reverseReason, setReverseReason] = useState("")
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    loadTransfers()
    const interval = setInterval(loadTransfers, 60000)
    return () => { clearInterval(interval); abortRef.current?.abort() }
  }, [])

  async function loadTransfers() {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const res = await fetch("/api/transfers", { signal: controller.signal })
      if (!res.ok) return
      const data = await res.json()
      setTransfers(data)
    } catch (e: any) {
      if (e.name !== "AbortError") console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = transfers.filter((t: any) =>
    !searchQuery ||
    t.transactionNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.secretCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.sender?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.receiver?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isSupervisory = user?.role === "COMPANY_OWNER" || user?.role === "company_owner" || user?.role === "COMPANY_ADMIN" || user?.role === "company_admin"
  const isSenderBranch = (t: any) => t.branchLink?.senderBranchId === user?.branchId
  const isReceiverBranch = (t: any) => t.branchLink?.receiverBranchId === user?.branchId

  async function handleCancel() {
    if (!selected || !cancelReason) return
    setActionLoading("cancel")
    try {
      const res = await fetch("/api/transfers/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transferId: selected.id, reason: cancelReason }),
      })
      if (!res.ok) throw new Error(await res.text())
      await loadTransfers()
      setShowCancelDialog(false)
      setCancelReason("")
      setSelected(null)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReverse() {
    if (!selected || !reverseReason) return
    setActionLoading("reverse")
    try {
      const res = await fetch("/api/transfers/reverse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transferId: selected.id, reason: reverseReason }),
      })
      if (!res.ok) throw new Error(await res.text())
      await loadTransfers()
      setShowReverseDialog(false)
      setReverseReason("")
      setSelected(null)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setActionLoading(null)
    }
  }

  async function handlePayout() {
    if (!selected) return
    setActionLoading("payout")
    setPayoutError("")
    try {
      const res = await fetch("/api/transfers/confirm-payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transferId: selected.id, secretCode: payoutSecretCode || undefined }),
      })
      if (!res.ok) {
        const data = await res.json()
        setPayoutError(data.error || "Payout failed")
        return
      }
      await loadTransfers()
      setShowPayoutDialog(false)
      setPayoutSecretCode("")
      setSelected(null)
    } catch {
      setPayoutError("Failed to process payout")
    } finally {
      setActionLoading(null)
    }
  }

  async function handlePrintReceipt(reprint: boolean) {
    if (!selected) return
    const action = reprint ? "reprint" : "print"
    setActionLoading(action)
    try {
      const res = await fetch(`/api/transfers/receipt?transferId=${selected.id}&reprint=${reprint}`)
      if (!res.ok) throw new Error(await res.text())
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank")
      loadTransfers()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "transactionNumber",
      header: "TXN #",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.transactionNumber}</span>
      ),
    },
    {
      accessorKey: "secretCode",
      header: "Code",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-primary-600">{row.original.secretCode || "—"}</span>
      ),
    },
    { accessorKey: "sender.fullName", header: "Sender" },
    { accessorKey: "receiver.fullName", header: "Receiver" },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => formatCurrency(row.original.amount, row.original.currency),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="space-y-1">
          <Badge className={statusColors[row.original.status]}>
            {row.original.status === "PENDING" ? "Pending" : row.original.status.replace(/_/g, " ")}
          </Badge>
          <SlaTimer createdAt={row.original.createdAt} completedAt={row.original.paidAt || row.original.cancelledAt || row.original.reversedAt} />
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setSelected(row.original)}>
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  const isOperational = user?.role === "BRANCH_MANAGER" || user?.role === "branch_manager" || user?.role === "TELLER" || user?.role === "teller"
  const t = selected
  const canCancel = t && isSenderBranch(t) && isOperational && t.status === "PENDING"
  const canReverse = t && isSenderBranch(t) && isOperational && t.status === "COMPLETED"
  const canProcessPayout = t && isReceiverBranch(t) && isOperational && t.status === "PENDING"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">Money transfers & mobile money transactions</p>
        </div>
        <div className="flex gap-2">
          {isOperational && (
            <>
              <Link href="/company/transfers/incoming">
                <Button variant="outline" className="gap-2">
                  <ArrowLeftRight className="h-4 w-4" />
                  Incoming
                </Button>
              </Link>
              <Link href="/company/transfers/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Transaction
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">All Transactions</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by code or name..." className="pl-9 w-64" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filtered} />
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setShowCancelDialog(false); setShowReverseDialog(false); setShowPayoutDialog(false); setPayoutError(""); setPayoutSecretCode("") }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                <div>
                  <p className="text-xs text-muted-foreground">Transaction Number</p>
                  <p className="text-sm font-mono font-semibold">{selected.transactionNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Secret Code</p>
                  <p className="text-sm font-mono font-bold text-primary-600">{selected.secretCode || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={statusColors[selected.status]}>{selected.status === "PENDING" ? "Pending" : selected.status.replace(/_/g, " ")}</Badge>
                  <div className="mt-1">
                    <SlaTimer createdAt={selected.createdAt} completedAt={selected.paidAt || selected.cancelledAt || selected.reversedAt} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="text-sm font-medium">{getTransactionTypeLabel(selected.transactionType)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-sm font-semibold">{formatCurrency(selected.amount, selected.currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Commission</p>
                  <p className="text-sm">{formatCurrency(selected.commission, selected.currency)}</p>
                </div>
              </div>

              {/* Sender / Receiver */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Sender</p>
                  <p className="text-sm font-medium">{selected.sender?.fullName}</p>
                  <p className="text-xs text-muted-foreground">{selected.sender?.phone}</p>
                </div>
                <div className="p-3 rounded-lg border">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Receiver</p>
                  <p className="text-sm font-medium">{selected.receiver?.fullName}</p>
                  <p className="text-xs text-muted-foreground">{selected.receiver?.phone}</p>
                </div>
              </div>

              {/* Branch Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-lg border">
                <div>
                  <p className="text-xs text-muted-foreground">Sending Branch</p>
                  <p className="text-sm font-medium">{selected.branchLink?.senderBranch?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Receiving Branch</p>
                  <p className="text-sm font-medium">{selected.branchLink?.receiverBranch?.name}</p>
                </div>
              </div>

              {/* Issued By */}
              <div className="p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground mb-1">Issued By</p>
                <p className="text-sm font-medium">{selected.issuedBy?.name}</p>
                <p className="text-xs text-muted-foreground">{selected.issuedBy?.role?.replace(/_/g, " ")} - {selected.issuedBy?.branch?.name}</p>
                <p className="text-xs text-muted-foreground">{new Date(selected.createdAt).toLocaleString()}</p>
              </div>

              {/* Paid By (for completed transactions) */}
              {selected.paidBy && (
                <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-800">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-2">Paid Out By</p>
                  <p className="text-sm font-semibold">{selected.paidBy.name}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Role: {selected.paidBy.role?.replace(/_/g, " ")}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Branch: {selected.paidBy.branch?.name}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">{selected.paidAt ? new Date(selected.paidAt).toLocaleString() : ""}</p>
                </div>
              )}

              {/* Mobile Provider */}
              {selected.mobileProvider && (
                <div className="p-3 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">Mobile Money Provider</p>
                  <p className="text-sm font-medium">{selected.mobileProvider.name}</p>
                </div>
              )}

              {/* Cancellation / Reversal Reason */}
              {(selected.cancellationReason || selected.reversalReason) && (
                <div className="p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-300">
                    {selected.status === "CANCELLED" ? "Cancellation" : "Reversal"} Reason
                  </p>
                  <p className="text-sm mt-1">{selected.cancellationReason || selected.reversalReason}</p>
                  {selected.cancelledAt && <p className="text-xs text-red-600 mt-1">{new Date(selected.cancelledAt).toLocaleString()}</p>}
                  {selected.reversedAt && <p className="text-xs text-red-600 mt-1">{new Date(selected.reversedAt).toLocaleString()}</p>}
                </div>
              )}

              {/* Timeline */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Transaction Timeline</h3>
                <div className="space-y-3">
                  {selected.events?.map((event: any, i: number) => {
                    const Icon = actionIcons[event.action] || Clock
                    const label = actionLabels[event.action] || event.action.replace(/_/g, " ")
                    return (
                      <div key={event.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                            <Icon className="h-4 w-4 text-primary-600" />
                          </div>
                          {i < selected.events.length - 1 && <div className="w-0.5 h-6 bg-primary-200 dark:bg-primary-800" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">{event.details}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.createdAt).toLocaleTimeString()} - {new Date(event.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  {(!selected.events || selected.events.length === 0) && (
                    <p className="text-xs text-muted-foreground">No timeline events recorded</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {/* Receipt - anyone can print */}
                  <Button variant="outline" size="sm" onClick={() => handlePrintReceipt(false)} disabled={actionLoading === "print"}>
                    {actionLoading === "print" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Printer className="h-4 w-4 mr-1" />}
                    Print Receipt
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handlePrintReceipt(true)} disabled={actionLoading === "print"}>
                    <Printer className="h-4 w-4 mr-1" />
                    Reprint
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* Sender Branch Actions */}
                  {canCancel && (
                    <Button variant="destructive" size="sm" onClick={() => setShowCancelDialog(true)} disabled={actionLoading === "cancel"}>
                      {actionLoading === "cancel" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
                      Cancel Transaction
                    </Button>
                  )}
                  {canReverse && (
                    <Button variant="destructive" size="sm" onClick={() => setShowReverseDialog(true)} disabled={actionLoading === "reverse"}>
                      {actionLoading === "reverse" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RotateCcw className="h-4 w-4 mr-1" />}
                      Reverse Transaction
                    </Button>
                  )}
                  {/* Receiver Branch Actions */}
                  {canProcessPayout && (
                    <Button size="sm" onClick={() => setShowPayoutDialog(true)} disabled={actionLoading === "payout"}>
                      {actionLoading === "payout" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                      Pay Receiver
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Reason Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Transaction</DialogTitle>
            <DialogDescription>Please provide a reason for cancelling this transaction.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cancelReason">Cancellation Reason</Label>
              <Textarea id="cancelReason" placeholder="e.g. Sender requested cancellation" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={!cancelReason || actionLoading === "cancel"}>
              {actionLoading === "cancel" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reverse Reason Dialog */}
      <Dialog open={showReverseDialog} onOpenChange={setShowReverseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reverse Transaction</DialogTitle>
            <DialogDescription>Please provide a reason for reversing this transaction.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reverseReason">Reversal Reason</Label>
              <Textarea id="reverseReason" placeholder="e.g. Incorrect receiver details" value={reverseReason} onChange={(e) => setReverseReason(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReverseDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReverse} disabled={!reverseReason || actionLoading === "reverse"}>
              {actionLoading === "reverse" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Confirm Reversal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payout Dialog (Secret Code Verification) */}
      <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pay Receiver</DialogTitle>
            <DialogDescription>
              Enter the customer&apos;s secret code to verify and complete the payout.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-800">
              <p className="text-xs text-muted-foreground">Receiver</p>
              <p className="text-sm font-semibold">{selected?.receiver?.fullName}</p>
              <p className="text-xs text-muted-foreground">{selected?.receiver?.phone}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secretCode">Secret Code</Label>
              <Input
                id="secretCode"
                placeholder="Enter the 8-digit secret code"
                value={payoutSecretCode}
                onChange={(e) => { setPayoutSecretCode(e.target.value.toUpperCase()); setPayoutError("") }}
                className="font-mono text-lg text-center tracking-widest"
                maxLength={8}
              />
              {payoutError && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {payoutError}
                </p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Verify the customer&apos;s identity and the secret code before completing the payout.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setShowPayoutDialog(false); setPayoutError(""); setPayoutSecretCode("") }}>
              Cancel
            </Button>
            <Button onClick={handlePayout} disabled={actionLoading === "payout"}>
              {actionLoading === "payout" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
              {payoutSecretCode ? "Verify & Complete Payout" : "Complete Payout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
