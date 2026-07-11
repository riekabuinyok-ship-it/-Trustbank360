import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { validateFile } from "@/lib/upload"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const validation = validateFile({ mimeType: file.type, size: file.size })
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString("base64")
    const mime = file.type || "image/png"
    const url = `data:${mime};base64,${base64}`

    return NextResponse.json({ success: true, url })
  } catch (error: any) {
    console.error("[upload] Error:", error?.message || error)
    return NextResponse.json({ error: error?.message || "Upload failed" }, { status: 500 })
  }
}
