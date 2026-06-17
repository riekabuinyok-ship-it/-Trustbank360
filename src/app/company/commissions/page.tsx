"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save, Percent } from "lucide-react"
import toast from "react-hot-toast"

export default function CommissionsPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const isAdmin = user?.role === "COMPANY_OWNER" || user?.role === "COMPANY_ADMIN"

  const [setting, setSetting] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ mode: "PERCENTAGE", value: "", minFee: "" })

  useEffect(() => {
    fetch("/api/commissions/settings")
      .then((r) => r.json())
      .then((data) => {
        setSetting(data)
        setForm({
          mode: data.mode,
          value: String(data.value),
          minFee: data.minFee ? String(data.minFee) : "",
        })
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/commissions/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSetting(data)
      toast.success("Commission settings saved")
    } catch {
      toast.error("Failed to save commission settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Commission Settings</h1>
        <p className="text-muted-foreground">Configure how commissions are calculated across your company</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" />
            Commission Rules
          </CardTitle>
          <CardDescription>
            Choose how commission is applied to every transaction.
            {!isAdmin && " Only company owners and admins can modify these settings."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Commission Mode</Label>
            <Select value={form.mode} onValueChange={(v) => setForm({ ...form, mode: v })} disabled={!isAdmin}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENTAGE">Percentage (% of amount)</SelectItem>
                <SelectItem value="FIXED">Fixed Amount (per transaction)</SelectItem>
                <SelectItem value="HYBRID">Hybrid (percentage + minimum fee)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {form.mode === "FIXED" && "A flat fee charged per transaction regardless of amount."}
              {form.mode === "PERCENTAGE" && "A percentage of the transaction amount."}
              {form.mode === "HYBRID" && "A percentage with a minimum fee floor."}
            </p>
          </div>

          <div className="space-y-2">
            <Label>
              {form.mode === "FIXED" ? "Fixed Fee Amount" : form.mode === "PERCENTAGE" ? "Percentage Rate (%)" : "Percentage Rate (%)"}
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder={form.mode === "FIXED" ? "5000" : "2"}
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              disabled={!isAdmin}
            />
          </div>

          {form.mode === "HYBRID" && (
            <div className="space-y-2">
              <Label>Minimum Fee</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="1000"
                value={form.minFee}
                onChange={(e) => setForm({ ...form, minFee: e.target.value })}
                disabled={!isAdmin}
              />
              <p className="text-xs text-muted-foreground">
                The commission will be the greater of the percentage amount and this minimum fee.
              </p>
            </div>
          )}

          {isAdmin && (
            <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Settings
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[10000, 50000, 100000, 500000, 1000000].map((amount) => {
              let commission = 0
              if (form.mode === "FIXED") commission = parseFloat(form.value) || 0
              else if (form.mode === "PERCENTAGE") commission = amount * ((parseFloat(form.value) || 0) / 100)
              else if (form.mode === "HYBRID") {
                const pct = amount * ((parseFloat(form.value) || 0) / 100)
                commission = Math.max(pct, parseFloat(form.minFee) || 0)
              }
              return (
                <div key={amount} className="flex items-center justify-between p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                  <span className="text-sm font-medium">{amount.toLocaleString()} SSP</span>
                  <span className="text-sm text-emerald-600 font-semibold">Commission: {commission.toFixed(2)} SSP</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
