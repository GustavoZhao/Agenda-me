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

  const [membership, club] = await Promise.all([
    db.clubMembership.findUnique({
      where: { clubId_userId: { clubId, userId: session.user.id } },
      select: { role: true },
    }),
    db.club.findUnique({
      where: { id: clubId },
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
    }),
  ])

  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 })
  }

  const role = membership?.role ?? "viewer"
  const canManage = membership ? canManageByRole(membership.role) : false
  const visibleMemberships = canManage ? club.memberships : []

  return NextResponse.json({
    role,
    canManage,
    club: {
      ...club,
      memberships: visibleMemberships,
    },
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
      wechatQrUrl?: string | null
      whatsappQrUrl?: string | null
    }

    const meetingType = body.meetingType
    const inPersonAddress = body.inPersonAddress?.trim() || null
    const onlinePlatform = body.onlinePlatform?.trim() || null
    const onlineMeetingId = body.onlineMeetingId?.trim() || null
    const onlinePasscode = body.onlinePasscode?.trim() || null

    if (meetingType === "in_person" || meetingType === "hybrid") {
      if (!inPersonAddress) {
        return NextResponse.json(
          { error: "In-person address is required for In-person or Hybrid meetings." },
          { status: 400 }
        )
      }
    }

    if (meetingType === "online" || meetingType === "hybrid") {
      if (!onlinePlatform || !onlineMeetingId || !onlinePasscode) {
        return NextResponse.json(
          { error: "Online platform, meeting ID, and passcode are required for Online or Hybrid meetings." },
          { status: 400 }
        )
      }
    }

    const updated = await db.club.update({
      where: { id: clubId },
      data: {
        name: body.name?.trim() || undefined,
        slogan: body.slogan?.trim() || null,
        meetingType: meetingType ?? undefined,
        inPersonAddress: body.inPersonAddress === undefined ? undefined : inPersonAddress,
        onlinePlatform: body.onlinePlatform === undefined ? undefined : onlinePlatform,
        onlineMeetingId: body.onlineMeetingId === undefined ? undefined : onlineMeetingId,
        onlinePasscode: body.onlinePasscode === undefined ? undefined : onlinePasscode,
        president: body.president === undefined ? undefined : body.president?.trim() || null,
        vpe: body.vpe === undefined ? undefined : body.vpe?.trim() || null,
        vpm: body.vpm === undefined ? undefined : body.vpm?.trim() || null,
        vppr: body.vppr === undefined ? undefined : body.vppr?.trim() || null,
        secretary: body.secretary === undefined ? undefined : body.secretary?.trim() || null,
        treasurer: body.treasurer === undefined ? undefined : body.treasurer?.trim() || null,
        saa: body.saa === undefined ? undefined : body.saa?.trim() || null,
        ipp: body.ipp === undefined ? undefined : body.ipp?.trim() || null,
        mentors: body.mentors === undefined ? undefined : body.mentors?.trim() || null,
        sponsors: body.sponsors === undefined ? undefined : body.sponsors?.trim() || null,
        advisor: body.advisor === undefined ? undefined : body.advisor?.trim() || null,
        participantNotesTitle:
          body.participantNotesTitle === undefined ? undefined : body.participantNotesTitle?.trim() || null,
        participantNotesBody:
          body.participantNotesBody === undefined ? undefined : body.participantNotesBody || null,
        vpmContactNote: body.vpmContactNote === undefined ? undefined : body.vpmContactNote?.trim() || null,
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
        updatedAt: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update club:", error)
    return NextResponse.json({ error: "Failed to update club" }, { status: 500 })
  }
}
