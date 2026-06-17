"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShieldCheck, AlertTriangle, UserCheck, FileSearch } from "lucide-react"
import { riskLevelColors, verificationStatusColors } from "@/lib/permissions"

export default function CompliancePage() {
  const [customers, setCustomers] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/customers").then((r) => r.json()).then(setCustomers)
  }, [])

  const highRisk = customers.filter((c) => c.riskLevel === "HIGH" || c.riskLevel === "CRITICAL")
  const unverified = customers.filter((c) => c.verificationStatus === "UNVERIFIED" || c.verificationStatus === "PENDING")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Compliance</h1>
        <p className="text-muted-foreground">KYC, AML, and fraud monitoring</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="stats-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-danger-100 dark:bg-danger-900/20 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-danger-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{highRisk.length}</p>
                <p className="text-sm text-muted-foreground">High Risk Customers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stats-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unverified.length}</p>
                <p className="text-sm text-muted-foreground">Pending Verification</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stats-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                <FileSearch className="h-5 w-5 text-primary-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{customers.length}</p>
                <p className="text-sm text-muted-foreground">Total Customers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="high-risk">
        <TabsList>
          <TabsTrigger value="high-risk">High Risk Customers</TabsTrigger>
          <TabsTrigger value="verification">KYC Verification</TabsTrigger>
        </TabsList>

        <TabsContent value="high-risk">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">High Risk & Critical Customers</CardTitle>
            </CardHeader>
            <CardContent>
              {highRisk.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No high risk customers</p>
              ) : (
                <div className="space-y-3">
                  {highRisk.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="text-sm font-medium">{c.fullName}</p>
                        <p className="text-xs text-muted-foreground">{c.phone}</p>
                      </div>
                      <Badge className={riskLevelColors[c.riskLevel]}>{c.riskLevel}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">KYC Verification Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {unverified.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No pending verifications</p>
              ) : (
                <div className="space-y-3">
                  {unverified.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="text-sm font-medium">{c.fullName}</p>
                        <p className="text-xs text-muted-foreground">{c.phone} - {c.idType}</p>
                      </div>
                      <Badge className={verificationStatusColors[c.verificationStatus]}>{c.verificationStatus}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
