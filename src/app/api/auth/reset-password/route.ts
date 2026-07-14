import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: hashedToken },
    })

    if (!resetToken) {
      return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 })
    }

    if (resetToken.usedAt) {
      return NextResponse.json({ error: "This reset link has already been used." }, { status: 400 })
    }

    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.$transaction([
      prisma.user.update({
        where: { email: resetToken.email },
        data: { password: hashedPassword, mustChangePassword: false },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ])

    return NextResponse.json({ success: true, message: "Password has been reset successfully." })
  } catch (error: any) {
    console.error("[reset-password] Error:", error?.message || error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
