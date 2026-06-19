"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowLeftRight, Search, Eye, CheckCircle2, Loader2, XCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useSession } from "next-auth/react"
import Link from "next/link"

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
}

export default function IncomingTransfersPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const [transfers, setTransfers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selected, setSelected] = useState<any>(null)
  const [showPayoutDialog, setShowPayoutDialog] = useState(false)
  const [payoutSecretCode, setPayoutSecretCode] = useState("")
  const [payoutError, setPayoutError] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadIncoming()
    const interval = setInterval(loadIncoming, 10000)
    return () => clearInterval(interval)
  }, [])

  async function loadIncoming() {
    try {
      const res = await fetch("/api/transfers?incoming=true")
      const data = await res.json()
      setTransfers(data)
    } catch {
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
      await loadIncoming()
      setShowPayoutDialog(false)
      setPayoutSecretCode("")
      setSelected(null)
    } catch {
      setPayoutError("Failed to process payout")
    } finally {
      setActionLoading(null)
    }
  }

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "transactionNumber",
      header: "TXN #",
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.transactionNumber}</span>,
    },
    {
      accessorKey: "secretCode",
      header: "Secret Code",
      cell: ({ row }) => <span className="font-mono text-xs font-bold text-primary-600">{row.original.secretCode || "—"}</span>,
    },
    {
      id: "senderBranch",
      header: "Sender Branch",
      cell: ({ row }) => <span className="text-sm">{row.original.branchLink?.senderBranch?.name}</span>,
    },
    { accessorKey: "sender.fullName", header: "Sender" },
    { accessorKey: "receiver.fullName", header: "Receiver" },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => formatCurrency(row.original.amount, row.original.currency),
    },
    {
      accessorKey: "createdAt",
      header: "Date Sent",
      cell: ({ row }) => <span className="text-xs">{new Date(row.original.createdAt).toLocaleDateString()}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={statusColors[row.original.status] || "bg-slate-100"}>
          {row.original.status === "PENDING" ? "Pending Payout" : row.original.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const isOperational = user?.role === "BRANCH_MANAGER" || user?.role === "TELLER"
        const isReceiver = row.original.branchLink?.receiverBranchId === user?.branchId
        if (row.original.status === "PENDING" && isOperational && isReceiver) {
          return (
            <Button size="sm" onClick={() => { setSelected(row.original); setShowPayoutDialog(true) }}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Pay
            </Button>
          )
        }
        if (row.original.status === "COMPLETED") {
          return (
            <Button variant="ghost" size="sm" onClick={() => setSelected(row.original)}>
              <Eye className="h-4 w-4" />
            </Button>
          )
        }
        return null
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Incoming Transfers</h1>
          <p className="text-muted-foreground">Transactions assigned to your branch for payout</p>
        </div>
        <Link href="/company/transfers">
          <Button variant="outline" className="gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            All Transactions
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Incoming</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-9 w-64" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <ArrowLeftRight className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-lg font-medium text-surface-900 dark:text-white">No Transactions Found</p>
              <p className="text-sm text-muted-foreground mt-1">
                There are no incoming transactions assigned to your branch.
              </p>
            </div>
          ) : (
            <DataTable columns={columns} data={filtered} />
          )}
        </CardContent>
      </Card>

      {/* Payout Dialog */}
      <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pay Receiver</DialogTitle>
            <DialogDescription>
              Enter the customer&apos;s secret code to verify and complete the payout.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-800">
                  <p className="text-xs text-muted-foreground">Sender</p>
                  <p className="text-sm font-semibold">{selected.sender?.fullName}</p>
                </div>
                <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-800">
                  <p className="text-xs text-muted-foreground">Receiver</p>
                  <p className="text-sm font-semibold">{selected.receiver?.fullName}</p>
                  <p className="text-xs text-muted-foreground">{selected.receiver?.phone}</p>
                </div>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="text-lg font-bold">{formatCurrency(selected.amount, selected.currency)}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sc">Secret Code</Label>
                <Input
                  id="sc"
                  placeholder="Enter secret code"
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
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setShowPayoutDialog(false); setPayoutError(""); setPayoutSecretCode("") }}>
              Cancel
            </Button>
            <Button onClick={handlePayout} disabled={actionLoading === "payout"}>
              {actionLoading === "payout" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
              {payoutSecretCode ? "Verify & Pay" : "Pay Receiver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
