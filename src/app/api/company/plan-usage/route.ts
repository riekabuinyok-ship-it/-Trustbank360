import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getPlanUsageSummary } from "@/lib/plan-enforcement"
import { getAllowedCurrencies, getApiAccess, getFeature } from "@/lib/plan-config"
import { ensureEnterprisePlan } from "@/lib/migrate-to-enterprise"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any
  if (!user?.companyId) return NextResponse.json({ error: "No company context" }, { status: 400 })

  await ensureEnterprisePlan(user.companyId)
  const summary = await getPlanUsageSummary(user.companyId)

  return NextResponse.json({
    plan: "Enterprise",
    planId: summary?.planId ?? "",
    trialDaysRemaining: summary?.trialDaysRemaining ?? null,
    overLimit: false,
    usage: summary?.usage ?? {
      branches: { current: 0, limit: null, percentage: 0, isAtLimit: false, remaining: -1 },
      staff: { current: 0, limit: null, percentage: 0, isAtLimit: false, remaining: -1 },
      currencies: { current: 0, limit: null, percentage: 0, isAtLimit: false, remaining: -1 },
      transfers: { current: 0, limit: null, percentage: 0, isAtLimit: false, remaining: -1 },
    },
    allowedCurrencies: getAllowedCurrencies(),
    features: {
      apiAccess: getApiAccess("Enterprise"),
      auditLogs: getFeature("Enterprise", "auditLogs"),
      customBranding: getFeature("Enterprise", "customBranding"),
      advancedAnalytics: getFeature("Enterprise", "advancedAnalytics"),
      customReports: getFeature("Enterprise", "customReports"),
      dedicatedSupport: getFeature("Enterprise", "dedicatedSupport"),
      branchWallets: getFeature("Enterprise", "branchWallets"),
      kycCompliance: getFeature("Enterprise", "kycCompliance"),
      advancedKycAml: getFeature("Enterprise", "advancedKycAml"),
      customDomain: getFeature("Enterprise", "customDomain"),
      customIntegrations: getFeature("Enterprise", "customIntegrations"),
      dedicatedAccountManager: getFeature("Enterprise", "dedicatedAccountManager"),
      prioritySupport: getFeature("Enterprise", "prioritySupport"),
    },
  })
}
