"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Printer, Banknote, ArrowLeft } from "lucide-react"
import { formatCurrency, getTransactionTypeLabel } from "@/lib/utils"

export default function ReceiptPage() {
  const params = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/transfers/receipt?transferId=${params.id}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-muted-foreground">Loading receipt...</p></div>
  if (!data) return <div className="flex items-center justify-center min-h-screen"><p className="text-muted-foreground">Receipt not found</p></div>

  const t = data

  return (
    <div className="min-h-screen bg-surface-100 dark:bg-surface-950 p-4 print:p-0">
      <div className="max-w-md mx-auto space-y-4 print:space-y-2">
        <div className="print:hidden flex items-center justify-between">
          <button onClick={() => window.history.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <Button onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" />
            Print Receipt
          </Button>
        </div>

        {/* Receipt */}
        <Card className="print:shadow-none print:border-0">
          <CardContent className="p-6 print:p-4">
            {/* Header */}
            <div className="text-center mb-6 border-b pb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/20 mb-2">
                <Banknote className="h-6 w-6 text-primary-600" />
              </div>
              <h1 className="text-lg font-bold">{t.company?.name || "TrustBank360"}</h1>
              <p className="text-xs text-muted-foreground">Money Transfer Receipt</p>
            </div>

            {/* Transaction Info */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transaction #</span>
                <span className="font-mono font-semibold">{t.transactionNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Secret Code</span>
                <span className="font-mono font-bold text-primary-600">{t.secretCode}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <span>{getTransactionTypeLabel(t.transactionType)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">{t.status.replace(/_/g, " ")}</span>
              </div>
            </div>

            <div className="border-t my-4" />

            {/* Amount */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Amount Sent</span>
                <span className="text-sm font-semibold">{formatCurrency(t.amount, t.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Commission</span>
                <span className="text-sm">{formatCurrency(t.commission, t.currency)}</span>
              </div>
              {t.receiverAmount && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Receiver Gets</span>
                  <span className="text-sm font-semibold">{formatCurrency(t.receiverAmount, t.currency)}</span>
                </div>
              )}
            </div>

            <div className="border-t my-4" />

            {/* Parties */}
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Sender</p>
                <p className="text-sm font-medium">{t.sender?.fullName}</p>
                <p className="text-xs text-muted-foreground">{t.sender?.phone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Receiver</p>
                <p className="text-sm font-medium">{t.receiver?.fullName}</p>
                <p className="text-xs text-muted-foreground">{t.receiver?.phone}</p>
              </div>
            </div>

            <div className="border-t my-4" />

            {/* Branch Info */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Sending Branch: {t.branchLink?.senderBranch?.name}</p>
              <p>Receiving Branch: {t.branchLink?.receiverBranch?.name}</p>
              <p>Issued By: {t.issuedBy?.name} ({t.issuedBy?.role?.replace(/_/g, " ")})</p>
              <p>Date: {new Date(t.createdAt).toLocaleDateString()}</p>
              <p>Time: {new Date(t.createdAt).toLocaleTimeString()}</p>
              {t.paidBy && (
                <p>Paid By: {t.paidBy.name} ({t.paidBy.role?.replace(/_/g, " ")}) on {t.paidAt ? new Date(t.paidAt).toLocaleString() : ""}</p>
              )}
              {t.mobileProvider && (
                <p>Provider: {t.mobileProvider.name}</p>
              )}
            </div>

            <div className="border-t mt-4 pt-4 text-center">
              <p className="text-xs text-muted-foreground">Thank you for using {t.company?.name || "TrustBank360"}</p>
              <p className="text-[10px] text-muted-foreground mt-1">This is a system-generated receipt</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
