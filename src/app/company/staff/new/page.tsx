"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { UserPlus, Loader2, ArrowLeft, Copy, CheckCircle2 } from "lucide-react"
import toast from "react-hot-toast"
import PlanLimitModal from "@/components/ui/plan-limit-modal"

const roles = [
  { value: "COMPANY_ADMIN", label: "Company Admin" },
  { value: "BRANCH_MANAGER", label: "Branch Manager" },
  { value: "TELLER", label: "Teller" },
  { value: "COMPLIANCE_OFFICER", label: "Compliance Officer" },
  { value: "AUDITOR", label: "Auditor" },
]

export default function NewStaffPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const user = session?.user as any
  const [loading, setLoading] = useState(false)
  const [planError, setPlanError] = useState<any>(null)
  const [branches, setBranches] = useState<any[]>([])
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    branchId: "",
    role: "TELLER",
  })
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [tempPasswordData, setTempPasswordData] = useState<{
    name: string
    email: string
    password: string
    role: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  const isBranchManager = user?.role === "BRANCH_MANAGER" || user?.role === "branch_manager"

  useEffect(() => {
    fetch("/api/branches").then((r) => r.json()).then((data) => {
      setBranches(data)
      // Auto-select branch for Branch Manager
      if (isBranchManager && user?.branchId) {
        setForm((prev) => ({ ...prev, branchId: user.branchId }))
      }
    })
  }, [])

  // Filter to own branch for Branch Manager
  const filteredBranches = isBranchManager
    ? branches.filter((b) => b.id === user?.branchId)
    : branches

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleCopyPassword = useCallback(async () => {
    if (!tempPasswordData?.password) return
    try {
      await navigator.clipboard.writeText(tempPasswordData.password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = tempPasswordData.password
      ta.style.position = "fixed"
      ta.style.opacity = "0"
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }, [tempPasswordData])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/staff", {
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
        const errorMsg = data.message || data.error || "Staff invitation failed"
        toast.error(errorMsg, { duration: 6000 })
        return
      }
      const data = await res.json()
      setTempPasswordData({
        name: form.name,
        email: form.email,
        password: data.tempPassword,
        role: form.role,
      })
      setCopied(false)
      setPasswordDialogOpen(true)
      navigator.clipboard.writeText(data.tempPassword).catch(() => {})
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
          <UserPlus className="h-6 w-6 text-primary-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Invite Staff</h1>
          <p className="text-muted-foreground">Add a new team member</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Staff Details</CardTitle>
            <CardDescription>Enter the staff member&apos;s information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input placeholder="John Doe" value={form.name} onChange={(e) => updateField("name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" placeholder="john@company.com" value={form.email} onChange={(e) => updateField("email", e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="+211 123 456 789" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Input placeholder="Senior Teller" value={form.position} onChange={(e) => updateField("position", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Branch *</Label>
                <Select value={form.branchId} onValueChange={(v) => updateField("branchId", v)} disabled={isBranchManager}>
                  <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    {filteredBranches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select value={form.role} onValueChange={(v) => updateField("role", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()} className="w-full" size="lg">Cancel</Button>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Send Invitation
          </Button>
        </div>
      </form>
      <PlanLimitModal error={planError} onClose={() => setPlanError(null)} />

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <CheckCircle2 className="h-5 w-5" />
              <DialogTitle className="text-lg">Staff Invited Successfully</DialogTitle>
            </div>
            <DialogDescription>
              Share the temporary password with the new staff member. This password will never be shown again.
            </DialogDescription>
          </DialogHeader>

          {tempPasswordData && (
            <div className="space-y-4">
              <div className="rounded-lg bg-surface-50 dark:bg-surface-800/50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{tempPasswordData.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{tempPasswordData.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Role</span>
                  <span className="font-medium capitalize">{tempPasswordData.role.replace(/_/g, " ").toLowerCase()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Temporary Password</Label>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-800">
                  <code className="flex-1 text-sm font-mono font-bold break-all select-all">{tempPasswordData.password}</code>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyPassword}
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {copied && (
                  <p className="text-xs text-emerald-600 font-medium">Copied to clipboard!</p>
                )}
              </div>

              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  <strong>⚠️ Important:</strong> This password will not be shown again. Copy it now or share it with the new staff member. They will be required to change it on first login.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button onClick={handleCopyPassword} variant="outline" className="gap-2">
              {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy Password"}
            </Button>
            <Button onClick={() => router.push("/company/staff")}>
              Done — Go to Staff List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
