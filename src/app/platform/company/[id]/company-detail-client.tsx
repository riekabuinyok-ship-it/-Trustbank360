"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BackButton } from "@/components/back-button"
import { Building2, Mail, Phone, Globe, MapPin, Hash, Users, Store, ScrollText } from "lucide-react"

function getStatusBadge(isActive: boolean, onboardingComplete: boolean) {
  if (isActive && onboardingComplete) return { label: "Active", variant: "success" as const }
  if (isActive && !onboardingComplete) return { label: "Pending", variant: "secondary" as const }
  return { label: "Suspended", variant: "warning" as const }
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) {
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
        <BackButton href="/admin/companies" label="Back to Companies" />
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

  return (
    <div className="space-y-6">
      <BackButton href="/admin/companies" label="Back to Companies" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{company.name}</h1>
            <p className="text-sm text-muted-foreground">Registered since {new Date(company.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <Badge variant={statusVariant} className="text-sm px-3 py-1">{statusLabel}</Badge>
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
              <Store className="h-4 w-4" />
              Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow icon={<Users className="h-4 w-4" />} label="Staff Count" value={String(company._count?.users ?? 0)} />
            <InfoRow icon={<Store className="h-4 w-4" />} label="Branch Count" value={String(company._count?.branches ?? 0)} />
            <InfoRow icon={<Building2 className="h-4 w-4" />} label="Business Types" value={company.businessTypes?.join(", ") || "—"} />
            <InfoRow icon={<Hash className="h-4 w-4" />} label="Main Currency" value={company.mainCurrency} />
          </CardContent>
        </Card>
      </div>

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
