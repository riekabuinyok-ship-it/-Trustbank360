"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, Loader2, Check, Building2, Smartphone, Percent } from "lucide-react"
import toast from "react-hot-toast"

const businessTypeOptions = [
  {
    value: "MONEY_TRANSFER_COMPANY",
    label: "Money Transfer Company",
    desc: "Cash-to-Cash transfers only. Sender gives cash at one branch, receiver collects at another. No mobile money integration.",
    icon: Building2,
    features: ["Send/Receive Money", "Payout Management", "Secret Code Verification", "Cancel/Reverse"],
  },
  {
    value: "MOBILE_MONEY_AGENT",
    label: "Mobile Money Agent",
    desc: "Operate as a Mobile Money Agent. Process deposits, withdrawals and transfers through supported mobile money providers.",
    icon: Smartphone,
    features: ["Mobile Deposits", "Mobile Withdrawals", "Mobile Transfers", "Provider Management"],
  },
  {
    value: "FOREX_BUREAU",
    label: "Forex Bureau",
    desc: "Currency exchange business. Buy and sell currencies. Manage exchange rates.",
    icon: Percent,
    features: ["Currency Exchange", "Rate Management", "Forex Transactions"],
  },
]

const countries = [
  "South Sudan", "Kenya", "Uganda", "United Kingdom", "United States", "Nigeria", "Ghana", "Tanzania", "Rwanda", "Ethiopia", "Somalia", "DRC", "Sudan", "Egypt", "South Africa"
]

const providersByCountry: Record<string, { value: string; label: string; country: string }[]> = {
  SSP: [
    { value: "MTN_SS", label: "MTN MoMo South Sudan", country: "SSP" },
    { value: "MGURUSH", label: "m-Gurush", country: "SSP" },
    { value: "NILEPAY", label: "NilePay", country: "SSP" },
    { value: "DIGICASH", label: "DigiCash", country: "SSP" },
  ],
  UGX: [
    { value: "MTN_UG", label: "MTN MoMo Uganda", country: "UGX" },
    { value: "AIRTEL_UG", label: "Airtel Money Uganda", country: "UGX" },
  ],
  KES: [
    { value: "M_PESA", label: "M-Pesa Kenya", country: "KES" },
    { value: "AIRTEL_KE", label: "Airtel Money Kenya", country: "KES" },
  ],
}

const allProviders = [...providersByCountry.SSP, ...providersByCountry.UGX, ...providersByCountry.KES]

interface Plan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  trialDays: number
  maxBranches: number
  maxStaff: number
  maxCurrencies: number
  features: string[]
}

const defaultPlans: Plan[] = []
const currencySymbols: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", KES: "KSh", UGX: "USh", SSP: "£" }

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [plans, setPlans] = useState<Plan[]>(defaultPlans)
  const [plansLoading, setPlansLoading] = useState(true)
  const router = useRouter()

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    businessTypes: [] as string[],
    country: "",
    registrationNumber: "",
    taxId: "",
    phone: "",
    mobileProviders: [] as string[],
    planId: "",
    numberOfBranches: 1,
    numberOfStaff: 1,
  })

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch("/api/plans")
        const data = await res.json()
        if (data.plans) setPlans(data.plans)
      } catch {
        // fallback if plans API fails — page will show empty
      } finally {
        setPlansLoading(false)
      }
    }
    fetchPlans()
  }, [])

  const needsProviders = form.businessTypes.includes("MOBILE_MONEY_AGENT") || form.businessTypes.includes("FOREX_BUREAU")
  const providersRequired = form.businessTypes.includes("MOBILE_MONEY_AGENT")
  const totalSteps = needsProviders ? 4 : 3

  function updateField(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleBusinessType(value: string) {
    setForm((prev) => ({
      ...prev,
      businessTypes: prev.businessTypes.includes(value)
        ? prev.businessTypes.filter((t) => t !== value)
        : [...prev.businessTypes, value],
    }))
  }

  function toggleProvider(value: string) {
    setForm((prev) => ({
      ...prev,
      mobileProviders: prev.mobileProviders.includes(value)
        ? prev.mobileProviders.filter((p) => p !== value)
        : [...prev.mobileProviders, value],
    }))
  }

  function handleNext() {
    if (step === 1) {
      if (!form.name || !form.email || !form.password) {
        toast.error("Please fill in all required fields")
        return
      }
      if (form.password !== form.confirmPassword) {
        toast.error("Passwords do not match")
        return
      }
      if (form.password.length < 8) {
        toast.error("Password must be at least 8 characters")
        return
      }
      setStep(2)
      return
    }
    if (step === 2) {
      if (form.businessTypes.length === 0) {
        toast.error("Select at least one business type")
        return
      }
      if (!form.country) {
        toast.error("Select your country")
        return
      }
      if (form.numberOfBranches < 1 || form.numberOfBranches > 1000) {
        toast.error("Number of Branches must be between 1 and 1000")
        return
      }
      if (form.numberOfStaff < 1 || form.numberOfStaff > 2500) {
        toast.error("Number of Staff must be between 1 and 2500")
        return
      }
      setStep(3)
      return
    }
    if (step === 3) {
      if (needsProviders) {
        setStep(4)
      } else {
        handleSubmit()
      }
      return
    }
    if (step === 4) {
      if (providersRequired && form.mobileProviders.length === 0) {
        toast.error("Mobile Money Agents must select at least one provider")
        return
      }
      handleSubmit()
    }
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      const { planId: _ignored, ...payload } = form
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to create account")
        return
      }

      toast.success("Company created successfully!")
      router.push("/login?success=created")
    } catch {
      toast.error("An unexpected error occurred during signup. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-50 via-surface-100 to-surface-200 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950 p-4 py-12">
      <div className="relative w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-lg mb-4">
            <img src="/images/logo-white.svg" alt="TRUSTBANK360" className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white">TrustBank360</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">Create your company account</p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-center gap-1 sm:gap-3">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className="flex items-center gap-1 sm:gap-3">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all ${
                  i + 1 === step ? "bg-primary-500 text-white shadow-md" :
                  i + 1 < step ? "bg-secondary-500 text-white" :
                  "bg-surface-200 dark:bg-surface-700 text-muted-foreground"
                }`}>
                  {i + 1 < step ? <Check className="h-4 w-4 sm:h-5 sm:w-5" /> : i + 1}
                </div>
                {i < totalSteps - 1 && <div className={`w-8 sm:w-16 h-1 rounded ${i + 1 < step ? "bg-secondary-500" : "bg-surface-200 dark:bg-surface-700"}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-8 sm:gap-16 mt-2 text-xs text-muted-foreground">
            <span>Account</span>
            <span>Business</span>
            <span>Plan</span>
            {needsProviders && <span>Providers</span>}
          </div>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Only Company Owners or Authorized Company Administrators are allowed to create a company account.
              </p>
            </div>
            <CardTitle>
              {step === 1 ? "Create Your Account" : step === 2 ? "Business Information" : step === 3 ? "Choose a Plan" : "Mobile Money Providers"}
            </CardTitle>
            <CardDescription>
              {step === 1 ? "Enter your personal details" : step === 2 ? "Tell us about your company" : step === 3 ? "Select a subscription plan for your company" : "Select your mobile money providers"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input placeholder="John Doe" value={form.name} onChange={(e) => updateField("name", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input type="email" placeholder="you@company.com" value={form.email} onChange={(e) => updateField("email", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input type="tel" placeholder="+211 123 456 789" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Password *</Label>
                      <Input type="password" placeholder="Min. 8 characters" value={form.password} onChange={(e) => updateField("password", e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirm Password *</Label>
                      <Input type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={(e) => updateField("confirmPassword", e.target.value)} required />
                    </div>
                  </div>
                  <Button type="button" onClick={handleNext} className="w-full" size="lg">Continue</Button>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-2">
                    <Label>Company Name *</Label>
                    <Input placeholder="TrustBank Ltd" value={form.companyName} onChange={(e) => updateField("companyName", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Business Types * (select one or more)</Label>
                    <div className="grid grid-cols-1 gap-3">
                      {businessTypeOptions.map((bt) => {
                        const Icon = bt.icon
                        const selected = form.businessTypes.includes(bt.value)
                        return (
                          <button
                            key={bt.value}
                            type="button"
                            onClick={() => toggleBusinessType(bt.value)}
                            className={`p-4 rounded-lg border text-left transition-all ${
                              selected
                                ? "bg-primary-50 border-primary-300 text-primary-700 dark:bg-primary-900/20 dark:border-primary-700"
                                : "border-input hover:border-primary-300"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                selected ? "bg-primary-100 dark:bg-primary-900/40" : "bg-surface-100 dark:bg-surface-800"
                              }`}>
                                <Icon className={`h-5 w-5 ${selected ? "text-primary-600" : "text-muted-foreground"}`} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{bt.label}</span>
                                </div>
                                <span className="block text-xs text-muted-foreground mt-0.5">{bt.desc}</span>
                                {selected && bt.features && (
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {bt.features.map((f) => (
                                      <span key={f} className="inline-flex items-center gap-1 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">
                                        <Check className="h-3 w-3" />
                                        {f}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Country *</Label>
                    <Select value={form.country} onValueChange={(v) => updateField("country", v)}>
                      <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                      <SelectContent>
                        {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Registration Number</Label>
                      <Input placeholder="BRN-2024-001" value={form.registrationNumber} onChange={(e) => updateField("registrationNumber", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Tax ID</Label>
                      <Input placeholder="TIN-12345" value={form.taxId} onChange={(e) => updateField("taxId", e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Number of Branches</Label>
                      <Input type="number" min={1} max={1000} value={form.numberOfBranches} onChange={(e) => updateField("numberOfBranches", parseInt(e.target.value) || 1)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Number of Staff</Label>
                      <Input type="number" min={1} max={2500} value={form.numberOfStaff} onChange={(e) => updateField("numberOfStaff", parseInt(e.target.value) || 1)} />
                    </div>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-full" size="lg">Back</Button>
                    <Button type="button" onClick={handleNext} className="w-full" size="lg">
                      Continue
                    </Button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="space-y-2">
                    <Label>Subscription Plan</Label>
                    <p className="text-xs text-muted-foreground">All features are included. You can manage billing from the company settings after signup.</p>
                    <div className="mt-2 p-5 rounded-xl border-2 border-primary bg-primary-50 dark:bg-primary-900/20">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-bold">Enterprise</p>
                          <p className="text-3xl font-extrabold text-primary-600 dark:text-primary-400 mt-2">
                            $60<span className="text-sm font-normal text-muted-foreground">/month</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">30-day free trial</p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-900/40 px-3 py-1 rounded-full">
                          <Check className="h-3 w-3" /> Included
                        </span>
                      </div>
                      <div className="border-t border-border my-4" />
                      <div className="space-y-1.5">
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Check className="h-3 w-3 text-secondary-500" /> Unlimited branches
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Check className="h-3 w-3 text-secondary-500" /> Unlimited staff
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Check className="h-3 w-3 text-secondary-500" /> Unlimited currencies
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Check className="h-3 w-3 text-secondary-500" /> Unlimited transfers
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Check className="h-3 w-3 text-secondary-500" /> Advanced KYC/AML, custom reports, dedicated support
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <Button type="button" variant="outline" onClick={() => setStep(2)} className="w-full" size="lg">Back</Button>
                    <Button type="button" onClick={handleNext} className="w-full" size="lg">
                      {needsProviders ? "Continue" : "Create Company Account"}
                    </Button>
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <div className="space-y-2">
                    <Label>Mobile Money Providers</Label>
                    {providersRequired ? (
                      <p className="text-xs text-amber-600">At least one provider is required for Mobile Money Agents.</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Optional for Forex Bureaus. Float wallets will be created automatically for selected providers.</p>
                    )}
                    <div className="space-y-3 mt-3">
                      {Object.entries(providersByCountry).map(([currency, providers]) => (
                        <div key={currency}>
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                            {currency === "SSP" ? "🇸🇸 South Sudan" : currency === "UGX" ? "🇺🇬 Uganda" : "🇰🇪 Kenya"}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {providers.map((p) => (
                              <button
                                key={p.value}
                                type="button"
                                onClick={() => toggleProvider(p.value)}
                                className={`p-3 rounded-lg border text-left transition-all ${
                                  form.mobileProviders.includes(p.value)
                                    ? "bg-secondary-50 border-secondary-300 text-secondary-700 dark:bg-secondary-900/20 dark:border-secondary-700"
                                    : "border-input hover:border-secondary-300"
                                }`}
                              >
                                <span className="text-sm font-medium">{p.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <Button type="button" variant="outline" onClick={() => setStep(3)} className="w-full" size="lg">Back</Button>
                    <Button type="button" onClick={handleNext} className="w-full" size="lg" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Create Company Account
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        <p className="text-center mt-4 text-sm text-muted-foreground">
          Already have an account? <Link href="/login" className="text-primary-500 hover:text-primary-600 font-medium">Sign In</Link>
        </p>
      </div>
    </div>
  )
}
