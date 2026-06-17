"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Banknote, Search, Loader2, CheckCircle2, XCircle, Clock, Building2 } from "lucide-react"

const statusIcons: Record<string, any> = {
  PENDING: Clock,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
  REVERSED: XCircle,
}

const statusColors: Record<string, string> = {
  PENDING: "text-amber-500",
  COMPLETED: "text-emerald-600",
  CANCELLED: "text-red-500",
  REVERSED: "text-slate-500",
}

const timeline = [
  { status: "PENDING", label: "Transfer Sent", time: "Pending" },
  { status: "COMPLETED", label: "Payout Completed", time: "Completed" },
]

export default function TrackTransferPage() {
  const [transferCode, setTransferCode] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const res = await fetch(`/api/public/track?code=${transferCode}&phone=${phone}`)
      if (!res.ok) {
        setError("Transfer not found. Please check your code and phone number.")
        return
      }
      const data = await res.json()
      setResult(data)
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-surface-100 to-surface-200 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-lg mb-4">
            <Banknote className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Track Your Transfer</h1>
          <p className="text-muted-foreground mt-2">Enter your transfer code and phone number to check the status</p>
        </div>

        <Card className="glass-card mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Transfer Code</Label>
                <Input
                  id="code"
                  placeholder="e.g. TBK-A1B2-C3D4"
                  value={transferCode}
                  onChange={(e) => setTransferCode(e.target.value.toUpperCase())}
                  required
                  className="text-lg font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+211 123 456 789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                Track Transfer
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-danger-200 dark:border-danger-800 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-danger-600 dark:text-danger-400">
                <XCircle className="h-5 w-5" />
                <p className="text-sm">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Transfer Status</CardTitle>
                  <CardDescription>Code: {result.transferCode}</CardDescription>
                </div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                  statusColors[result.status]
                } bg-white dark:bg-surface-800 shadow-sm`}>
                  {result.status.replace(/_/g, " ")}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                  <p className="text-xs text-muted-foreground mb-1">Amount</p>
                  <p className="text-lg font-bold">{result.amount?.toLocaleString()} {result.currency}</p>
                </div>
                <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                  <p className="text-xs text-muted-foreground mb-1">Destination</p>
                  <p className="text-sm font-medium">{result.destinationBranch?.name}</p>
                  <p className="text-xs text-muted-foreground">{result.destinationBranch?.city}, {result.destinationBranch?.country}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">Timeline</p>
                {timeline.map((step, i) => {
                  const Icon = statusIcons[step.status]
                  const isActive = timeline.findIndex((t) => t.status === result.status) >= i
                  return (
                    <div key={i} className="flex gap-3">
                      <div className={`flex flex-col items-center`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isActive ? "bg-primary-100 text-primary-600 dark:bg-primary-900/20" : "bg-surface-100 text-muted-foreground"
                        }`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        {i < timeline.length - 1 && (
                          <div className={`w-0.5 h-8 ${isActive ? "bg-primary-200" : "bg-surface-200"}`} />
                        )}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isActive ? "" : "text-muted-foreground"}`}>{step.label}</p>
                        <p className="text-xs text-muted-foreground">{step.time}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {result.status === "PENDING" && (
                <div className="p-4 rounded-lg bg-secondary-50 dark:bg-secondary-900/20 border border-secondary-200 dark:border-secondary-800 text-center">
                  <Building2 className="h-6 w-6 text-secondary-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                    Your transfer is pending payout at {result.destinationBranch?.name}
                  </p>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
                    Please bring a valid ID and your secret code to collect your money
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <p className="text-center mt-8 text-xs text-muted-foreground">
          TrustBank360 &copy; {new Date().getFullYear()} - Secure Money Transfer Platform
        </p>
      </div>
    </div>
  )
}
