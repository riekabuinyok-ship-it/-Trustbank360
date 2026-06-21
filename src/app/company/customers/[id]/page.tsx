"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft, User, Phone, FileText, Globe, AlertTriangle, ShieldCheck,
  CheckCircle2, XCircle, Clock, BookOpen,
} from "lucide-react"
import { riskLevelColors, verificationStatusColors } from "@/lib/permissions"
import toast from "react-hot-toast"

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!params?.id) return
    fetch(`/api/customers/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setCustomer(null)
        else setCustomer(data)
      })
      .catch(() => setCustomer(null))
      .finally(() => setLoading(false))
  }, [params?.id])

  async function updateVerification(status: string) {
    try {
      const res = await fetch(`/api/customers/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationStatus: status }),
      })
      if (res.ok) {
        const updated = await res.json()
        setCustomer(updated)
        toast.success(`Customer ${status.toLowerCase()}`)
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to update")
      }
    } catch {
      toast.error("Unable to update customer record. Please try again.")
    }
  }

  async function updateRisk(level: string) {
    try {
      const res = await fetch(`/api/customers/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riskLevel: level }),
      })
      if (res.ok) {
        const updated = await res.json()
        setCustomer(updated)
        toast.success(`Risk level set to ${level}`)
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to update")
      }
    } catch {
      toast.error("Unable to update customer record. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        Loading customer details...
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/company/customers")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Customers
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Customer not found
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 w-full max-w-full overflow-hidden">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
            <User className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold break-anywhere">{customer.fullName}</h1>
            <p className="text-sm text-muted-foreground">
              Customer since {new Date(customer.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className={verificationStatusColors[customer.verificationStatus]}>
            {customer.verificationStatus}
          </Badge>
          <Badge className={riskLevelColors[customer.riskLevel]}>
            {customer.riskLevel}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" /> Customer Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{customer.phone}</span>
            </div>
            {customer.nationality && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{customer.nationality}</span>
              </div>
            )}
            {customer.idType && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{customer.idType}: {customer.idNumber}</span>
              </div>
            )}
            {customer.notes && (
              <div className="flex items-start gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-sm">{customer.notes}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transactions</span>
              <span className="font-medium">{customer._count?.transfersAsSender + customer._count?.transfersAsReceiver}</span>
            </div>
          </CardContent>
        </Card>

        {/* Verification Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Current status: <Badge className={verificationStatusColors[customer.verificationStatus]}>{customer.verificationStatus}</Badge>
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="text-emerald-600" onClick={() => updateVerification("VERIFIED")} disabled={customer.verificationStatus === "VERIFIED"}>
                <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
              </Button>
              <Button size="sm" variant="outline" className="text-amber-600" onClick={() => updateVerification("PENDING")} disabled={customer.verificationStatus === "PENDING"}>
                <Clock className="h-4 w-4 mr-1" /> Mark Pending
              </Button>
              <Button size="sm" variant="outline" className="text-destructive" onClick={() => updateVerification("REJECTED")} disabled={customer.verificationStatus === "REJECTED"}>
                <XCircle className="h-4 w-4 mr-1" /> Reject
              </Button>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium mb-2">Risk Level</p>
              <div className="flex flex-wrap gap-2">
                {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((level) => (
                  <Button
                    key={level}
                    size="sm"
                    variant={customer.riskLevel === level ? "default" : "outline"}
                    onClick={() => updateRisk(level)}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
