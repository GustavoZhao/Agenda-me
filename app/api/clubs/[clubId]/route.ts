import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthSession } from "@/lib/auth"
import { canManageByRole } from "@/lib/permissions"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clubId: string }> }
) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { clubId } = await params

  const membership = await db.clubMembership.findUnique({
    where: { clubId_userId: { clubId, userId: session.user.id } },
    include: {
      club: {
        include: {
          memberships: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  })

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json({
    role: membership.role,
    canManage: canManageByRole(membership.role),
    club: membership.club,
  })
}

export async function PATCH(
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
      name?: string
      clubNumber?: string
      area?: string
      division?: string
      district?: string
      timezone?: string
      wechatQrUrl?: string | null
      whatsappQrUrl?: string | null
    }

    const updated = await db.club.update({
      where: { id: clubId },
      data: {
        name: body.name?.trim() || undefined,
        clubNumber: body.clubNumber?.trim() || null,
        area: body.area?.trim() || null,
        division: body.division?.trim() || null,
        district: body.district?.trim() || null,
        timezone: body.timezone?.trim() || null,
        wechatQrUrl: body.wechatQrUrl ?? undefined,
        whatsappQrUrl: body.whatsappQrUrl ?? undefined,
      },
      select: {
        id: true,
        name: true,
        clubNumber: true,
        area: true,
        division: true,
        district: true,
        timezone: true,
        wechatQrUrl: true,
        whatsappQrUrl: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update club:", error)
    return NextResponse.json({ error: "Failed to update club" }, { status: 500 })
  }
}
