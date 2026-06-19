import { prisma } from "@/lib/prisma"

export async function getCommissionSetting(companyId: string, currency?: string) {
  const where: any = { companyId }
  if (currency) where.currency = currency

  let setting = await prisma.commissionSetting.findFirst({ where })
  if (!setting && currency) {
    // Fall back to company's main currency setting
    setting = await prisma.commissionSetting.findFirst({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    })
  }
  if (!setting) {
    setting = await prisma.commissionSetting.create({
      data: { companyId, currency: (currency as any) || "SSP", mode: "PERCENTAGE", value: 2 },
    })
  }
  return setting
}

export async function getCommissionSettings(companyId: string) {
  return prisma.commissionSetting.findMany({
    where: { companyId },
    orderBy: { currency: "asc" },
  })
}

export function calculateCommission(
  amount: number,
  mode: "FIXED" | "PERCENTAGE" | "HYBRID",
  value: number,
  minFee?: number | null,
  commissionType: "INCLUDED" | "SEPARATE" = "SEPARATE",
): { commission: number; senderAmount: number; receiverAmount: number } {
  let commission = 0

  if (mode === "FIXED") {
    commission = value
  } else if (mode === "PERCENTAGE") {
    commission = amount * (value / 100)
  } else if (mode === "HYBRID") {
    const pct = amount * (value / 100)
    commission = minFee ? Math.max(pct, minFee) : pct
  }

  commission = Math.round(commission * 100) / 100

  if (commissionType === "INCLUDED") {
    return {
      commission,
      senderAmount: amount,
      receiverAmount: Math.max(0, amount - commission),
    }
  }

  return {
    commission,
    senderAmount: amount + commission,
    receiverAmount: amount,
  }
}
