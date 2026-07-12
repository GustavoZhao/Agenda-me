import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthSession } from "@/lib/auth"
import { makeReadableSlug } from "@/lib/slug"

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const memberships = await db.clubMembership.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    include: {
      club: {
        select: {
          id: true,
          slug: true,
          name: true,
          slogan: true,
          meetingType: true,
          inPersonAddress: true,
          onlinePlatform: true,
          onlineMeetingId: true,
          onlinePasscode: true,
          clubNumber: true,
          area: true,
          division: true,
          district: true,
          timezone: true,
          wechatQrUrl: true,
          whatsappQrUrl: true,
        },
      },
    },
  })

  return NextResponse.json({
    items: memberships.map((membership: { role: string; club: unknown }) => ({
      role: membership.role,
      club: membership.club,
    })),
  })
}

export async function POST(req: Request) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = (await req.json()) as {
      name?: string
      slogan?: string
      meetingType?: "in_person" | "online" | "hybrid"
      inPersonAddress?: string
      onlinePlatform?: string
      onlineMeetingId?: string
      onlinePasscode?: string
      clubNumber?: string
      area?: string
      division?: string
      district?: string
      timezone?: string
    }

    const name = body.name?.trim() || "New Club"
    let slug = `club-${makeReadableSlug(8)}`

    for (let i = 0; i < 5; i += 1) {
      const exists = await db.club.findUnique({ where: { slug } })
      if (!exists) break
      slug = `club-${makeReadableSlug(8)}`
    }

    const club = await db.club.create({
      data: {
        slug,
        name,
        slogan: body.slogan?.trim() || null,
        meetingType: body.meetingType ?? "online",
        inPersonAddress: body.inPersonAddress?.trim() || null,
        onlinePlatform: body.onlinePlatform?.trim() || null,
        onlineMeetingId: body.onlineMeetingId?.trim() || null,
        onlinePasscode: body.onlinePasscode?.trim() || null,
        clubNumber: body.clubNumber?.trim() || null,
        area: body.area?.trim() || null,
        division: body.division?.trim() || null,
        district: body.district?.trim() || null,
        timezone: body.timezone?.trim() || null,
        createdById: session.user.id,
        memberships: {
          create: {
            userId: session.user.id,
            role: "owner",
          },
        },
      },
      select: {
        id: true,
        slug: true,
      },
    })

    return NextResponse.json(club, { status: 201 })
  } catch (error) {
    console.error("Failed to create club:", error)
    return NextResponse.json({ error: "Failed to create club" }, { status: 500 })
  }
}
