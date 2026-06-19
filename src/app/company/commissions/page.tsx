"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save, Percent, Plus, Trash2 } from "lucide-react"
import toast from "react-hot-toast"

interface CommissionSetting {
  id: string
  companyId: string
  currency: string
  mode: string
  value: number
  minFee: number | null
}

const CURRENCIES = ["SSP", "USD", "KES", "UGX", "EUR", "GBP", "AED"]

export default function CommissionsPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const isAdmin = user?.role === "COMPANY_OWNER" || user?.role === "COMPANY_ADMIN"

  const [settings, setSettings] = useState<CommissionSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState("SSP")
  const [form, setForm] = useState({ mode: "PERCENTAGE", value: "", minFee: "" })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const res = await fetch("/api/commissions/settings")
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
        if (data.length > 0) {
          setSelectedCurrency(data[0].currency)
          setForm({
            mode: data[0].mode,
            value: String(data[0].value),
            minFee: data[0].minFee ? String(data[0].minFee) : "",
          })
        }
      }
    } catch {
      toast.error("Failed to load commission settings")
    } finally {
      setLoading(false)
    }
  }

  const currentSetting = settings.find((s) => s.currency === selectedCurrency)

  function selectCurrency(curr: string) {
    setSelectedCurrency(curr)
    const setting = settings.find((s) => s.currency === curr)
    if (setting) {
      setForm({
        mode: setting.mode,
        value: String(setting.value),
        minFee: setting.minFee ? String(setting.minFee) : "",
      })
    } else {
      setForm({ mode: "PERCENTAGE", value: "2", minFee: "" })
    }
  }

  async function handleSave() {
    if (!selectedCurrency) return
    setSaving(true)
    try {
      const res = await fetch("/api/commissions/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, currency: selectedCurrency }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSettings((prev) => {
        const idx = prev.findIndex((s) => s.currency === selectedCurrency)
        if (idx >= 0) {
          const updated = [...prev]
          updated[idx] = data
          return updated
        }
        return [...prev, data]
      })
      toast.success(`Commission saved for ${selectedCurrency}`)
    } catch {
      toast.error("Failed to save commission settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  const configuredCurrencies = settings.map((s) => s.currency)
  const availableCurrencies = CURRENCIES.filter((c) => !configuredCurrencies.includes(c) || c === selectedCurrency)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Commission Settings</h1>
        <p className="text-muted-foreground">Configure per-currency commission rules for your company</p>
      </div>

      {/* Currency tabs */}
      <div className="flex flex-wrap gap-2">
        {settings.map((s) => (
          <button
            key={s.currency}
            onClick={() => selectCurrency(s.currency)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              selectedCurrency === s.currency
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card hover:bg-surface-100 dark:hover:bg-surface-800"
            }`}
          >
            {s.currency}
          </button>
        ))}
        {availableCurrencies.map((c) => (
          <button
            key={c}
            onClick={() => selectCurrency(c)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              selectedCurrency === c
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card hover:bg-surface-100 dark:hover:bg-surface-800 border-dashed text-muted-foreground"
            }`}
          >
            <Plus className="h-3 w-3 inline mr-1" />
            {c}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" />
            Commission Rules — {selectedCurrency}
          </CardTitle>
          <CardDescription>
            {currentSetting
              ? `Current settings for ${selectedCurrency}.`
              : `No settings configured for ${selectedCurrency} yet. Set them below.`}
            {!isAdmin && " Only owners and admins can modify these settings."}
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
              {form.mode === "FIXED" ? "Fixed Fee Amount" : "Percentage Rate (%)"}
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
              Save for {selectedCurrency}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preview — {selectedCurrency}</CardTitle>
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
                  <span className="text-sm font-medium">{amount.toLocaleString()} {selectedCurrency}</span>
                  <span className="text-sm text-emerald-600 font-semibold">Commission: {commission.toFixed(2)} {selectedCurrency}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
