import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthSession } from "@/lib/auth"
import { makeReadableSlug } from "@/lib/slug"

export async function GET(req: Request) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const scope = searchParams.get("scope")

  if (scope === "available") {
    const clubs = await db.club.findMany({
      where: {
        memberships: {
          none: {
            userId: session.user.id,
          },
        },
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        clubNumber: true,
        district: true,
      },
    })

    return NextResponse.json({ items: clubs })
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
          president: true,
          vpe: true,
          vpm: true,
          vppr: true,
          secretary: true,
          treasurer: true,
          saa: true,
          ipp: true,
          mentors: true,
          sponsors: true,
          advisor: true,
          participantNotesTitle: true,
          participantNotesBody: true,
          vpmContactNote: true,
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
      president?: string
      vpe?: string
      vpm?: string
      vppr?: string
      secretary?: string
      treasurer?: string
      saa?: string
      ipp?: string
      mentors?: string
      sponsors?: string
      advisor?: string
      participantNotesTitle?: string
      participantNotesBody?: string
      vpmContactNote?: string
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
        president: body.president?.trim() || null,
        vpe: body.vpe?.trim() || null,
        vpm: body.vpm?.trim() || null,
        vppr: body.vppr?.trim() || null,
        secretary: body.secretary?.trim() || null,
        treasurer: body.treasurer?.trim() || null,
        saa: body.saa?.trim() || null,
        ipp: body.ipp?.trim() || null,
        mentors: body.mentors?.trim() || null,
        sponsors: body.sponsors?.trim() || null,
        advisor: body.advisor?.trim() || null,
        participantNotesTitle: body.participantNotesTitle?.trim() || null,
        participantNotesBody: body.participantNotesBody?.trim() || null,
        vpmContactNote: body.vpmContactNote?.trim() || null,
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
