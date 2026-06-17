"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Building2, Loader2, Trash2 } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

const countries = ["South Sudan", "Kenya", "Uganda", "United Kingdom", "United States", "Nigeria"]

export default function EditBranchPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const user = session?.user as any
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [staff, setStaff] = useState<any[]>([])
  const [form, setForm] = useState({
    name: "",
    code: "",
    managerId: "",
    address: "",
    city: "",
    country: "",
    contactPhone: "",
    isActive: true,
  })

  useEffect(() => {
    if (!id) return
    async function loadData() {
      try {
        const [branchRes, staffRes] = await Promise.all([
          fetch(`/api/branches/${id}`),
          fetch("/api/staff"),
        ])
        if (!branchRes.ok) {
          toast.error("Branch not found")
          router.push("/company/branches")
          return
        }
        const branch = await branchRes.json()
        const allStaff = await staffRes.json()

        setForm({
          name: branch.name || "",
          code: branch.code || "",
          managerId: branch.managerId || "",
          address: branch.address || "",
          city: branch.city || "",
          country: branch.country || "",
          contactPhone: branch.contactPhone || "",
          isActive: branch.isActive ?? true,
        })
        setStaff(allStaff.filter((s: any) => s.branchId === id))
      } catch {
        toast.error("Failed to load branch data")
        router.push("/company/branches")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id, router])

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/branches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          country: form.country,
          city: form.city,
          address: form.address,
          contactPhone: form.contactPhone,
          isActive: form.isActive,
          managerId: form.managerId === "none" ? null : form.managerId || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Failed to update branch")
        return
      }
      toast.success("Branch updated successfully!")
      router.push("/company/branches")
    } catch {
      toast.error("An error occurred")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this branch? This action cannot be undone.")) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/branches/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Failed to delete branch")
        return
      }
      toast.success("Branch deleted successfully!")
      router.push("/company/branches")
    } catch {
      toast.error("An error occurred")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Edit Branch</h1>
            <p className="text-muted-foreground">Loading branch details...</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const isOwner = user?.role === "COMPANY_OWNER"
  const branchStaff = staff.filter((s) => s.status === "ACTIVE")

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
          <h1 className="text-2xl font-bold">Edit Branch</h1>
          <p className="text-muted-foreground">Update branch information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Branch Details</CardTitle>
            <CardDescription>Edit the branch information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Branch Name *</Label>
                <Input placeholder="Juba Main Branch" value={form.name} onChange={(e) => updateField("name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Branch Code</Label>
                <Input value={form.code} disabled className="bg-muted" />
              </div>
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
              <Label>Address</Label>
              <Input placeholder="123 Business Avenue" value={form.address} onChange={(e) => updateField("address", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input placeholder="+211 123 456 789" value={form.contactPhone} onChange={(e) => updateField("contactPhone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Branch Manager</Label>
                <Select value={form.managerId} onValueChange={(v) => updateField("managerId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {branchStaff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name} ({s.role.replace("_", " ")})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.isActive ? "active" : "inactive"} onValueChange={(v) => updateField("isActive", v === "active")}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 mt-6">
          <Link href="/company/branches" className="w-full">
            <Button type="button" variant="outline" className="w-full" size="lg">Cancel</Button>
          </Link>
          <Button type="submit" className="w-full" size="lg" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </div>
      </form>

      {isOwner && (
        <Card className="border-danger-200 dark:border-danger-900">
          <CardHeader>
            <CardTitle className="text-danger-600">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions for this branch</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="destructive" size="lg" className="gap-2" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete Branch
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
