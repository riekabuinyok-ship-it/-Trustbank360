import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user as any

  const { name, email, phone, position, image } = await request.json()

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  if (email && email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 })
    }
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(position !== undefined && { position }),
      ...(image !== undefined && { image }),
    },
    select: { id: true, name: true, email: true, phone: true, position: true, image: true },
  })

  return NextResponse.json(updated)
}
