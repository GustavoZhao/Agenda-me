import { getStore } from "@netlify/blobs"
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

function blobPayloadToString(payload: string | ArrayBuffer): string {
  if (typeof payload === "string") return payload
  return new TextDecoder().decode(payload)
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ assetId: string }> }
) {
  const { assetId } = await params

  const asset = await db.clubAsset.findUnique({
    where: { id: assetId },
    select: {
      storageKey: true,
    },
  })

  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 })
  }

  const store = getStore("club-assets")
  const payload = await store.get(asset.storageKey)
  if (!payload) {
    return NextResponse.json({ error: "Asset data missing" }, { status: 404 })
  }

  const response = dataUrlToResponse(blobPayloadToString(payload))
  if (!response) {
    return NextResponse.json({ error: "Invalid asset payload" }, { status: 500 })
  }

  return response
}
