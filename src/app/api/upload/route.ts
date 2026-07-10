import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { validateFile, getFileExtension } from "@/lib/upload"

export const config = { api: { bodyParser: false } }

async function storeWithBlob(buffer: Buffer, mimeType: string): Promise<string> {
  const { put } = await import("@vercel/blob")
  const ext = getFileExtension(mimeType)
  const filename = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const blob = await put(filename, buffer, { contentType: mimeType, access: "public" })
  return blob.url
}

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

    const buffer = Buffer.from(await file.arrayBuffer())

    const validation = validateFile({ mimeType: file.type, size: file.size })
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    let url: string

    try {
      url = await storeWithBlob(buffer, file.type)
    } catch (blobErr: any) {
      console.warn("[upload] Vercel Blob unavailable, falling back to base64:", blobErr?.message || blobErr)
      const base64 = buffer.toString("base64")
      const mime = file.type || "image/png"
      url = `data:${mime};base64,${base64}`
    }

    return NextResponse.json({ success: true, url })
  } catch (error: any) {
    console.error("[upload] Error:", error?.message || error)
    return NextResponse.json({ error: error?.message || "Upload failed" }, { status: 500 })
  }
}
