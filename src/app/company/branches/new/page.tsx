"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Loader2, ArrowLeft } from "lucide-react"
import toast from "react-hot-toast"
import PlanLimitModal from "@/components/ui/plan-limit-modal"

const countries = ["South Sudan", "Kenya", "Uganda", "United Kingdom", "United States", "Nigeria"]

export default function NewBranchPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [planError, setPlanError] = useState<any>(null)
  const [form, setForm] = useState({
    name: "",
    country: "",
    state: "",
    city: "",
    address: "",
    contactPhone: "",
    contactEmail: "",
  })

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        if (data.success === false && data.errorCode) {
          setPlanError(data)
          return
        }
        toast.error(data.error || data.message || "Branch creation failed")
        return
      }
      toast.success("Branch created successfully!")
      router.push("/company/branches")
    } catch {
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors -ml-1">
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
          <Building2 className="h-6 w-6 text-primary-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">New Branch</h1>
          <p className="text-muted-foreground">Create a new branch</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Branch Details</CardTitle>
            <CardDescription>Enter the branch information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Branch Name *</Label>
              <Input placeholder="Juba Main Branch" value={form.name} onChange={(e) => updateField("name", e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Country *</Label>
                <Select value={form.country} onValueChange={(v) => updateField("country", v)}>
                  <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>City *</Label>
                <Input placeholder="Juba" value={form.city} onChange={(e) => updateField("city", e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>State/Region</Label>
              <Input placeholder="Central Equatoria" value={form.state} onChange={(e) => updateField("state", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input placeholder="123 Business Avenue" value={form.address} onChange={(e) => updateField("address", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="+211 123 456 789" value={form.contactPhone} onChange={(e) => updateField("contactPhone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="branch@company.com" value={form.contactEmail} onChange={(e) => updateField("contactEmail", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()} className="w-full" size="lg">Cancel</Button>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create Branch
          </Button>
        </div>
      </form>
      <PlanLimitModal error={planError} onClose={() => setPlanError(null)} />
    </div>
  )
}
