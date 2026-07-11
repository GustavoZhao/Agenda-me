import { getStore } from "@netlify/blobs"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthSession } from "@/lib/auth"
import { canManageByRole } from "@/lib/permissions"

type AssetKind = "wechat_qr" | "whatsapp_qr" | "other"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ clubId: string }> }
) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { clubId } = await params
  const membership = await db.clubMembership.findUnique({
    where: { clubId_userId: { clubId, userId: session.user.id } },
    select: { role: true },
  })

  if (!membership || !canManageByRole(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = (await req.json()) as {
      dataUrl?: string
      fileName?: string
      kind?: AssetKind
    }

    if (!body.dataUrl || !body.dataUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "Invalid image payload" }, { status: 400 })
    }

    const kind: AssetKind = body.kind ?? "other"
    const extension = body.fileName?.split(".").pop()?.toLowerCase() || "png"

    const asset = await db.clubAsset.create({
      data: {
        clubId,
        kind,
        createdById: session.user.id,
        storageKey: "pending",
        url: "pending",
      },
      select: { id: true },
    })

    const storageKey = `clubs/${clubId}/assets/${asset.id}.${extension}`

    const store = getStore("club-assets")
    await store.set(storageKey, body.dataUrl, {
      metadata: {
        clubId,
        uploadedBy: session.user.id,
      },
    })

    const url = `/api/assets/${asset.id}`

    await db.clubAsset.update({
      where: { id: asset.id },
      data: {
        storageKey,
        url,
      },
    })

    if (kind === "wechat_qr") {
      await db.club.update({ where: { id: clubId }, data: { wechatQrUrl: url } })
    }

    if (kind === "whatsapp_qr") {
      await db.club.update({ where: { id: clubId }, data: { whatsappQrUrl: url } })
    }

    return NextResponse.json({ id: asset.id, url }, { status: 201 })
  } catch (error) {
    console.error("Failed to upload asset:", error)
    return NextResponse.json({ error: "Failed to upload asset" }, { status: 500 })
  }
}
