"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Settings, Palette, Banknote, Globe, Wrench } from "lucide-react"
import toast from "react-hot-toast"

type PlatformSettings = {
  platformName: string
  platformLogo: string | null
  primaryColor: string
  secondaryColor: string
  bankInstructions: string | null
  bankAccountName: string | null
  bankAccountNumber: string | null
  bankName: string | null
  currencySettings: string | null
  maintenanceMode: boolean
  maintenanceMessage: string | null
}

const defaults: PlatformSettings = {
  platformName: "Trustbank360",
  platformLogo: null,
  primaryColor: "#0F4C81",
  secondaryColor: "#00A86B",
  bankInstructions: null,
  bankAccountName: null,
  bankAccountNumber: null,
  bankName: null,
  currencySettings: "USD,SSP,UGX,KES",
  maintenanceMode: false,
  maintenanceMessage: null,
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>(defaults)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => setSettings({ ...defaults, ...data }))
      .catch(() => toast.error("Unable to load settings. Please try again."))
      .finally(() => setLoading(false))
  }, [])

  async function saveSection(fields: Partial<PlatformSettings>, section: string) {
    setSaving(section)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      })
      if (res.ok) {
        const data = await res.json()
        setSettings((prev) => ({ ...prev, ...data }))
        toast.success(`${section} saved`)
      } else {
        const err = await res.json()
        toast.error(err.error || `Failed to save ${section}`)
      }
    } catch {
      toast.error(`Failed to save ${section}`)
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading settings...
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Platform Settings
        </h1>
        <p className="text-muted-foreground text-sm">Manage global platform configuration</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="h-5 w-5" />
            Branding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="platformName">Platform Name</Label>
            <Input
              id="platformName"
              value={settings.platformName}
              onChange={(e) => setSettings((p) => ({ ...p, platformName: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="platformLogo">Logo URL</Label>
            <Input
              id="platformLogo"
              value={settings.platformLogo || ""}
              onChange={(e) => setSettings((p) => ({ ...p, platformLogo: e.target.value || null }))}
              placeholder="https://example.com/logo.png"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="primaryColor"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings((p) => ({ ...p, primaryColor: e.target.value }))}
                />
                <div
                  className="h-8 w-8 rounded-md border shrink-0"
                  style={{ backgroundColor: settings.primaryColor }}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="secondaryColor"
                  value={settings.secondaryColor}
                  onChange={(e) => setSettings((p) => ({ ...p, secondaryColor: e.target.value }))}
                />
                <div
                  className="h-8 w-8 rounded-md border shrink-0"
                  style={{ backgroundColor: settings.secondaryColor }}
                />
              </div>
            </div>
          </div>
          <Button
            onClick={() => saveSection({ platformName: settings.platformName, platformLogo: settings.platformLogo, primaryColor: settings.primaryColor, secondaryColor: settings.secondaryColor }, "Branding")}
            disabled={saving === "Branding"}
          >
            {saving === "Branding" ? "Saving..." : "Save Branding"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Banknote className="h-5 w-5" />
            Bank Transfer Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="bankName">Bank Name</Label>
            <Input
              id="bankName"
              value={settings.bankName || ""}
              onChange={(e) => setSettings((p) => ({ ...p, bankName: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bankAccountName">Account Name</Label>
            <Input
              id="bankAccountName"
              value={settings.bankAccountName || ""}
              onChange={(e) => setSettings((p) => ({ ...p, bankAccountName: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bankAccountNumber">Account Number</Label>
            <Input
              id="bankAccountNumber"
              value={settings.bankAccountNumber || ""}
              onChange={(e) => setSettings((p) => ({ ...p, bankAccountNumber: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bankInstructions">Instructions</Label>
            <Textarea
              id="bankInstructions"
              value={settings.bankInstructions || ""}
              onChange={(e) => setSettings((p) => ({ ...p, bankInstructions: e.target.value }))}
              rows={4}
            />
          </div>
          <Button
            onClick={() =>
              saveSection(
                {
                  bankName: settings.bankName,
                  bankAccountName: settings.bankAccountName,
                  bankAccountNumber: settings.bankAccountNumber,
                  bankInstructions: settings.bankInstructions,
                },
                "Bank Instructions"
              )
            }
            disabled={saving === "Bank Instructions"}
          >
            {saving === "Bank Instructions" ? "Saving..." : "Save Bank Instructions"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5" />
            Currency Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="currencySettings">Accepted Currencies</Label>
            <Input
              id="currencySettings"
              value={settings.currencySettings || ""}
              onChange={(e) => setSettings((p) => ({ ...p, currencySettings: e.target.value }))}
              placeholder="USD,SSP,UGX,KES"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated list of currency codes
            </p>
          </div>
          <Button
            onClick={() => saveSection({ currencySettings: settings.currencySettings }, "Currency Settings")}
            disabled={saving === "Currency Settings"}
          >
            {saving === "Currency Settings" ? "Saving..." : "Save Currency Settings"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wrench className="h-5 w-5" />
            Maintenance Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              id="maintenanceMode"
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => setSettings((p) => ({ ...p, maintenanceMode: checked }))}
            />
            <Label htmlFor="maintenanceMode">
              {settings.maintenanceMode ? "Maintenance mode is on" : "Maintenance mode is off"}
            </Label>
          </div>
          {settings.maintenanceMode && (
            <div className="grid gap-2">
              <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
              <Textarea
                id="maintenanceMessage"
                value={settings.maintenanceMessage || ""}
                onChange={(e) => setSettings((p) => ({ ...p, maintenanceMessage: e.target.value }))}
                rows={3}
                placeholder="We are currently performing scheduled maintenance..."
              />
            </div>
          )}
          <Button
            onClick={() =>
              saveSection(
                {
                  maintenanceMode: settings.maintenanceMode,
                  maintenanceMessage: settings.maintenanceMessage,
                },
                "Maintenance Mode"
              )
            }
            disabled={saving === "Maintenance Mode"}
          >
            {saving === "Maintenance Mode" ? "Saving..." : "Save Maintenance Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
