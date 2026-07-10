import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendPasswordResetEmail } from "@/lib/email"
import { checkRateLimit } from "@/lib/rate-limit"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const rl = await checkRateLimit(`forgot:${ip}`, "forgot_password")
    if (!rl.allowed) {
      return NextResponse.json({
        error: `Too many attempts. Try again in ${Math.ceil(rl.resetInSeconds / 60)} minutes.`,
      }, { status: 429 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ message: "If that email exists, a reset link has been sent." })
    }

    const token = crypto.randomBytes(32).toString("hex")
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

    await prisma.passwordResetToken.create({
      data: {
        email,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 3600000),
      },
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const resetUrl = `${baseUrl}/reset-password/${token}`

    await sendPasswordResetEmail(email, resetUrl)

    return NextResponse.json({ message: "If that email exists, a reset link has been sent." })
  } catch (error: any) {
    console.error("[forgot-password] Error:", error?.message || error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
