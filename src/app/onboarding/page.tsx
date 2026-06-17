"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Banknote, Check, Loader2, Upload } from "lucide-react"
import toast from "react-hot-toast"

const currencies = [
  { value: "SSP", label: "SSP - South Sudanese Pound" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "KES", label: "KES - Kenyan Shilling" },
  { value: "UGX", label: "UGX - Ugandan Shilling" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
]

export default function OnboardingPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const user = session?.user as any

  const [form, setForm] = useState({
    numberOfBranches: "1",
    numberOfStaff: "1",
    mainCurrency: "SSP",
    additionalCurrencies: [] as string[],
    address: "",
    phone: user?.email || "",
    email: user?.email || "",
    website: "",
  })

  const totalSteps = 4

  function updateField(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleCurrency(curr: string) {
    setForm((prev) => ({
      ...prev,
      additionalCurrencies: prev.additionalCurrencies.includes(curr)
        ? prev.additionalCurrencies.filter((c) => c !== curr)
        : [...prev.additionalCurrencies, curr],
    }))
  }

  async function handleComplete() {
    setLoading(true)
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Failed to complete onboarding")
        return
      }

      toast.success("Onboarding complete!")
      await update()
      router.push("/company/dashboard")
    } catch {
      toast.error("An error occurred")
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
          <h1 className="text-3xl font-bold">Welcome to TrustBank360</h1>
          <p className="text-muted-foreground mt-1">Let&apos;s set up your company profile</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  i + 1 === step ? "bg-primary-500 text-white shadow-md" :
                  i + 1 < step ? "bg-secondary-500 text-white" :
                  "bg-surface-200 dark:bg-surface-700 text-muted-foreground"
                }`}>
                  {i + 1 < step ? <Check className="h-5 w-5" /> : i + 1}
                </div>
                {i < totalSteps - 1 && (
                  <div className={`w-12 h-1 rounded ${i + 1 < step ? "bg-secondary-500" : "bg-surface-200 dark:bg-surface-700"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>
              {step === 1 && "Business Details"}
              {step === 2 && "Currencies & Locations"}
              {step === 3 && "Contact Information"}
              {step === 4 && "Branding & Logo"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Tell us more about your business operations"}
              {step === 2 && "Configure your operating currencies"}
              {step === 3 && "How can customers reach you?"}
              {step === 4 && "Upload your company logo and customize branding"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Number of Branches</Label>
                    <Select value={form.numberOfBranches} onValueChange={(v) => updateField("numberOfBranches", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                          <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Number of Staff</Label>
                    <Select value={form.numberOfStaff} onValueChange={(v) => updateField("numberOfStaff", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6,7,8,9,10,15,20,30,50,100].map((n) => (
                          <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Company Address</Label>
                  <Input placeholder="123 Business Street, City" value={form.address} onChange={(e) => updateField("address", e.target.value)} />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label>Main Operating Currency</Label>
                  <Select value={form.mainCurrency} onValueChange={(v) => updateField("mainCurrency", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Additional Supported Currencies</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {currencies.filter((c) => c.value !== form.mainCurrency).map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => toggleCurrency(c.value)}
                        className={`p-3 rounded-lg border text-left text-sm transition-all ${
                          form.additionalCurrencies.includes(c.value)
                            ? "bg-primary-50 border-primary-300 text-primary-700 dark:bg-primary-900/20 dark:border-primary-700"
                            : "border-input hover:border-primary-300"
                        }`}
                      >
                        <span className="font-medium">{c.value}</span>
                        <span className="block text-xs text-muted-foreground">{c.label.split(" - ")[1]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input type="tel" placeholder="+211 123 456 789" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input placeholder="https://trustbank.com" value={form.website} onChange={(e) => updateField("website", e.target.value)} />
                </div>
              </>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-input rounded-xl p-8 text-center hover:border-primary-300 transition-colors cursor-pointer">
                  <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium">Upload Company Logo</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex items-center gap-2">
                      <input type="color" value="#0F4C81" className="h-10 w-10 rounded-lg border cursor-pointer" />
                      <Input value="#0F4C81" className="font-mono" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary Color</Label>
                    <div className="flex items-center gap-2">
                      <input type="color" value="#00A86B" className="h-10 w-10 rounded-lg border cursor-pointer" />
                      <Input value="#00A86B" className="font-mono" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)} className="w-full" size="lg">Back</Button>
              )}
              {step < totalSteps ? (
                <Button onClick={() => setStep(step + 1)} className="w-full" size="lg">Continue</Button>
              ) : (
                <Button onClick={handleComplete} className="w-full" size="lg" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Complete Setup
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
