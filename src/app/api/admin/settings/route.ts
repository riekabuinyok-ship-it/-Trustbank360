import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/log-event"

async function checkAuth() {
  const session = await getServerSession(authOptions)
  if (!session) return { error: "Unauthorized", status: 401 }
  const user = session.user as any
  if (user.role !== "platform_owner") {
    return { error: "Forbidden", status: 403 }
  }
  return { user }
}

async function getOrCreateSettings() {
  let settings = await prisma.platformSetting.findFirst()
  if (!settings) {
    settings = await prisma.platformSetting.create({ data: {} })
  }
  return settings
}

export async function GET() {
  const auth = await checkAuth()
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const settings = await getOrCreateSettings()

  return NextResponse.json({
    platformName: settings.platformName,
    platformLogo: settings.platformLogo,
    primaryColor: settings.primaryColor,
    secondaryColor: settings.secondaryColor,
    bankInstructions: settings.bankInstructions,
    bankAccountName: settings.bankAccountName,
    bankAccountNumber: settings.bankAccountNumber,
    bankName: settings.bankName,
    currencySettings: settings.currencySettings,
    maintenanceMode: settings.maintenanceMode,
    maintenanceMessage: settings.maintenanceMessage,
  })
}

export async function PATCH(request: Request) {
  const auth = await checkAuth()
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const user = auth.user

  try {
    const body = await request.json()

    const allowedFields = [
      "platformName",
      "platformLogo",
      "primaryColor",
      "secondaryColor",
      "bankInstructions",
      "bankAccountName",
      "bankAccountNumber",
      "bankName",
      "currencySettings",
      "maintenanceMode",
      "maintenanceMessage",
    ]

    const data: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        data[key] = body[key]
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    let settings = await prisma.platformSetting.findFirst()
    if (!settings) {
      settings = await prisma.platformSetting.create({ data: {} })
    }

    const updated = await prisma.platformSetting.update({
      where: { id: settings.id },
      data,
    })

    await createAuditLog({
      userId: user.id,
      action: "UPDATE_PLATFORM_SETTINGS",
      resource: "PLATFORM_SETTINGS",
      details: `Platform settings updated: ${Object.keys(data).join(", ")}`,
      companyId: undefined,
    })

    return NextResponse.json({
      platformName: updated.platformName,
      platformLogo: updated.platformLogo,
      primaryColor: updated.primaryColor,
      secondaryColor: updated.secondaryColor,
      bankInstructions: updated.bankInstructions,
      bankAccountName: updated.bankAccountName,
      bankAccountNumber: updated.bankAccountNumber,
      bankName: updated.bankName,
      currencySettings: updated.currencySettings,
      maintenanceMode: updated.maintenanceMode,
      maintenanceMessage: updated.maintenanceMessage,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
