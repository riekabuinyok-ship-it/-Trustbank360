"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet as WalletIcon, TrendingUp, TrendingDown, Inbox } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function WalletsPage() {
  const [wallets, setWallets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/wallets").then((r) => r.json()).then(setWallets).catch(() => setWallets([])).finally(() => setLoading(false))
  }, [])

  const grouped = wallets.reduce((acc: any, w: any) => {
    if (!acc[w.branch.name]) acc[w.branch.name] = []
    acc[w.branch.name].push(w)
    return acc
  }, {})

  if (!loading && wallets.length === 0) {
    return (
      <div className="space-y-6 w-full max-w-full overflow-hidden">
        <div>
          <h1 className="text-2xl font-bold">Wallets</h1>
          <p className="text-muted-foreground text-sm">Branch wallet balances</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
            <Inbox className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No wallets found</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">Wallets will appear here once branches are set up with currencies.</p>
          <Link href="/company/dashboard">
            <Button variant="outline" size="sm">Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <div>
        <h1 className="text-2xl font-bold">Wallets</h1>
        <p className="text-muted-foreground text-sm">Branch wallet balances</p>
      </div>

      {Object.entries(grouped).map(([branchName, branchWallets]: [string, any]) => (
        <Card key={branchName} className="w-full max-w-full overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 min-w-0">
              <WalletIcon className="h-5 w-5 text-primary-500 flex-shrink-0" />
              <span className="break-anywhere">{branchName}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {branchWallets.map((w: any) => (
                <div key={w.id} className="p-4 rounded-lg border bg-surface-50 dark:bg-surface-800/50 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{w.currency}</span>
                    {w.balance >= w.openingBalance ? (
                      <TrendingUp className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xl font-bold break-anywhere">{formatCurrency(w.balance, w.currency)}</p>
                  <p className="text-xs text-muted-foreground mt-1 break-anywhere">Opening: {formatCurrency(w.openingBalance, w.currency)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
