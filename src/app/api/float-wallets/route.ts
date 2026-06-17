import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  const floatWallets = await prisma.floatWallet.findMany({
    where: { companyId: user.companyId },
    include: { provider: { select: { name: true, code: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(floatWallets)
}
