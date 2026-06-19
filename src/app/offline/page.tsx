"use client"

import Link from "next/link"
import { Banknote, WifiOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-50 via-surface-100 to-surface-200 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950 p-4">
      <div className="relative w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-100 dark:bg-amber-900/30 mb-6">
          <WifiOff className="h-10 w-10 text-amber-600 dark:text-amber-400" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">You&apos;re Offline</h1>
        <p className="text-muted-foreground mb-8">
          Don&apos;t worry — TrustBank360 works offline. Your cached data is available below.
        </p>

        <div className="grid gap-3 mb-8">
          <Link href="/company/dashboard">
            <Button className="w-full gap-2" variant="default" size="lg">
              <Banknote className="h-4 w-4" />
              Dashboard (Cached)
            </Button>
          </Link>
          <Link href="/company/transfers">
            <Button className="w-full gap-2" variant="outline" size="lg">
              <RefreshCw className="h-4 w-4" />
              Transactions (Cached)
            </Button>
          </Link>
          <Link href="/company/customers">
            <Button className="w-full gap-2" variant="outline" size="lg">
              Customers (Cached)
            </Button>
          </Link>
        </div>

        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300">
          <p className="font-medium mb-1">Automatic Sync</p>
          <p>
            Your actions will be saved locally and automatically synchronized when
            internet connectivity is restored.
          </p>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          <button
            onClick={() => window.location.reload()}
            className="text-primary hover:underline"
          >
            Retry Connection
          </button>
        </p>
      </div>
    </div>
  )
}
