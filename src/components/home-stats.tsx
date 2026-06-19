"use client"

import { useState, useEffect } from "react"

export function HomeStats() {
  const [companyCount, setCompanyCount] = useState<number | null>(null)
  const [transactionCount, setTransactionCount] = useState<number | null>(null)

  useEffect(() => {
    fetch("/api/public/stats")
      .then((r) => r.json())
      .then((data) => {
        setCompanyCount(data.companyCount)
        setTransactionCount(data.transactionCount)
      })
      .catch(() => {})
  }, [])

  return (
    <section className="py-16 bg-surface-50 dark:bg-surface-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <p className="text-3xl sm:text-4xl font-bold text-primary">3</p>
            <p className="text-sm text-muted-foreground mt-1">Countries Covered</p>
          </div>
          <div className="text-center">
            <p className="text-3xl sm:text-4xl font-bold text-primary">
              {companyCount !== null ? companyCount.toLocaleString() : "—"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Active Companies</p>
          </div>
          <div className="text-center">
            <p className="text-3xl sm:text-4xl font-bold text-primary">
              {transactionCount !== null ? `${(transactionCount / 1000).toFixed(0)}K+` : "—"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Transactions Processed</p>
          </div>
          <div className="text-center">
            <p className="text-3xl sm:text-4xl font-bold text-primary">99.9%</p>
            <p className="text-sm text-muted-foreground mt-1">Uptime</p>
          </div>
        </div>
      </div>
    </section>
  )
}
