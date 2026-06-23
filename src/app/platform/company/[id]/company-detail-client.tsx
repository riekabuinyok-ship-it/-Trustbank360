"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BackButton } from "@/components/back-button"
import {
  Building2, Mail, Phone, Globe, MapPin, Hash, Users, Store, ScrollText,
  CreditCard, ArrowLeftRight, Crown, Banknote,
} from "lucide-react"

function getStatusBadge(isActive: boolean, onboardingComplete: boolean) {
  if (isActive && onboardingComplete) return { label: "Active", variant: "success" as const }
  if (isActive && !onboardingComplete) return { label: "Pending", variant: "secondary" as const }
  return { label: "Suspended", variant: "warning" as const }
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium truncate">{value || "—"}</p>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  )
}

export default function AdminCompanyDetailClient({ id }: { id: string }) {
  const [company, setCompany] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/companies/${id}`)
      .then((r) => r.json())
      .then(setCompany)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        Loading company details...
      </div>
    )
  }

  if (!company) {
    return (
      <div className="space-y-4">
        <BackButton href="/platform/companies" label="Back to Companies" />
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Company not found
          </CardContent>
        </Card>
      </div>
    )
  }

  const owner = company.users?.[0]
  const { label: statusLabel, variant: statusVariant } = getStatusBadge(company.isActive, company.onboardingComplete)
  const sub = company.subscription
  const fin = company.financials
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val)

  const subBadgeVariant = sub
    ? (sub.status === "ACTIVE" || sub.status === "TRIALING" ? "success" as const : "secondary" as const)
    : "secondary" as const

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <BackButton href="/platform/companies" label="Back to Companies" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold break-anywhere">{company.name}</h1>
            <p className="text-sm text-muted-foreground">Registered since {new Date(company.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <Badge variant={statusVariant} className="text-sm px-3 py-1 self-start sm:self-auto">{statusLabel}</Badge>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="Staff" value={String(company._count?.users ?? 0)} />
        <StatCard icon={<Store className="h-5 w-5" />} label="Branches" value={String(company._count?.branches ?? 0)} />
        <StatCard icon={<ArrowLeftRight className="h-5 w-5" />} label="Transfers" value={String(fin?.totalTransfers ?? 0)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Company Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow icon={<Hash className="h-4 w-4" />} label="Registration Number" value={company.registrationNumber} />
            <InfoRow icon={<MapPin className="h-4 w-4" />} label="Address" value={company.address} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={company.phone} />
            <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={company.email} />
            <InfoRow icon={<Globe className="h-4 w-4" />} label="Website" value={company.website} />
            <InfoRow icon={<Store className="h-4 w-4" />} label="Country" value={company.country} />
            <InfoRow icon={<Hash className="h-4 w-4" />} label="Business Types" value={company.businessTypes?.join(", ")} />
            <InfoRow icon={<Hash className="h-4 w-4" />} label="Main Currency" value={company.mainCurrency} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Owner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {owner ? (
              <>
                <InfoRow icon={<Users className="h-4 w-4" />} label="Name" value={owner.name} />
                <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={owner.email} />
                <InfoRow icon={<Hash className="h-4 w-4" />} label="Role" value={owner.role} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-4">No owner assigned</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {sub ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={subBadgeVariant}>{sub.status}</Badge>
                </div>
                <InfoRow icon={<CreditCard className="h-4 w-4" />} label="Plan" value={sub.plan?.name} />
                <InfoRow icon={<Hash className="h-4 w-4" />} label="Price" value={sub.plan?.price ? formatCurrency(sub.plan.price) : "—"} />
                <InfoRow icon={<Hash className="h-4 w-4" />} label="Start Date" value={sub.startDate ? new Date(sub.startDate).toLocaleDateString() : "—"} />
                <InfoRow icon={<Hash className="h-4 w-4" />} label="Trial Ends" value={sub.trialEndsAt ? new Date(sub.trialEndsAt).toLocaleDateString() : "—"} />
                <InfoRow icon={<Hash className="h-4 w-4" />} label="Payment Method" value={sub.paymentMethod || "—"} />
                {sub.stripeSubscriptionId && (
                  <InfoRow icon={<Hash className="h-4 w-4" />} label="Stripe ID" value={sub.stripeSubscriptionId} />
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-4">No subscription</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Financial overview */}
      {fin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Financial Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="p-4 rounded-lg border bg-card">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Transfer Volume</p>
                <p className="text-2xl font-bold">{formatCurrency(fin.totalTransferVolume)}</p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Commission</p>
                <p className="text-2xl font-bold">{formatCurrency(fin.totalCommission)}</p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Transfers</p>
                <p className="text-2xl font-bold">{fin.totalTransfers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments history */}
      {company.payments && company.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {company.payments.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">
                      {formatCurrency(p.amount)} {p.currency}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.subscription?.plan?.name || "N/A"} — {p.status}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit logs */}
      {company.auditLogs && company.auditLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ScrollText className="h-4 w-4" />
              Recent Audit Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0 divide-y">
              {company.auditLogs.map((log: any) => (
                <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{log.action}</p>
                    {log.details && (
                      <p className="text-xs text-muted-foreground truncate">{log.details}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      by {log.user?.name || "Unknown"}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
