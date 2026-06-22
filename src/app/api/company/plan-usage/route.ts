import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getPlanUsageSummary } from "@/lib/plan-enforcement"
import { getAllowedCurrencies, getApiAccess, getFeature } from "@/lib/plan-config"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  if (!user?.companyId) return NextResponse.json({ error: "No company context" }, { status: 400 })

  const summary = await getPlanUsageSummary(user.companyId)
  if (!summary) {
    return NextResponse.json({ error: "No active subscription" }, { status: 404 })
  }

  return NextResponse.json({
    ...summary,
    allowedCurrencies: getAllowedCurrencies(summary.plan),
    features: {
      apiAccess: getApiAccess(summary.plan),
      auditLogs: getFeature(summary.plan, "auditLogs"),
      customBranding: getFeature(summary.plan, "customBranding"),
      advancedAnalytics: getFeature(summary.plan, "advancedAnalytics"),
      customReports: getFeature(summary.plan, "customReports"),
      dedicatedSupport: getFeature(summary.plan, "dedicatedSupport"),
      branchWallets: getFeature(summary.plan, "branchWallets"),
      kycCompliance: getFeature(summary.plan, "kycCompliance"),
      advancedKycAml: getFeature(summary.plan, "advancedKycAml"),
      customDomain: getFeature(summary.plan, "customDomain"),
      customIntegrations: getFeature(summary.plan, "customIntegrations"),
      dedicatedAccountManager: getFeature(summary.plan, "dedicatedAccountManager"),
      prioritySupport: getFeature(summary.plan, "prioritySupport"),
    },
  })
}
