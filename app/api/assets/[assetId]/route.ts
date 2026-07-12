import { NextResponse } from "next/server"
import { db } from "@/lib/db"

function dataUrlToResponse(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/)
  if (!match) return null

  const mimeType = match[1]
  const base64Data = match[2]
  const buffer = Buffer.from(base64Data, "base64")

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ assetId: string }> }
) {
  const { assetId } = await params

  const asset = await db.clubAsset.findUnique({
    where: { id: assetId },
    select: {
      dataUrl: true,
    },
  })

  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 })
  }

  if (!asset.dataUrl) {
    return NextResponse.json({ error: "Asset data missing" }, { status: 404 })
  }

  const response = dataUrlToResponse(asset.dataUrl)
  if (!response) {
    return NextResponse.json({ error: "Invalid asset payload" }, { status: 500 })
  }

  return response
}
