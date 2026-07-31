import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthSession } from "@/lib/auth"
import { normalizeSettings, type AgendaSettings } from "@/lib/agenda"
import { makeReadableSlug } from "@/lib/slug"
import { canCreateAgendaByRole, canUpdateAgendaByRole } from "@/lib/permissions"

async function ensureDefaultClub(userId: string) {
  const membership = await db.clubMembership.findFirst({
    where: { userId },
    include: { club: true },
    orderBy: { createdAt: "asc" },
  })

  if (membership) return membership.club

  const slug = `club-${makeReadableSlug(8)}`
  const club = await db.club.create({
    data: {
      slug,
      name: "My Club",
      createdById: userId,
      memberships: {
        create: {
          userId,
          role: "owner",
        },
      },
    },
  })

  return club
}

export async function GET(req: Request) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")?.trim() ?? ""

  const memberships = await db.clubMembership.findMany({
    where: { userId: session.user.id },
    select: { clubId: true, role: true },
  })

  const clubIds = memberships.map((m: { clubId: string }) => m.clubId)
  const rolesByClubId = new Map(memberships.map((membership) => [membership.clubId, membership.role]))

  const agendas = await db.agenda.findMany({
    where: {
      clubId: { in: clubIds },
      OR: q
        ? [
            { title: { contains: q, mode: "insensitive" } },
            { meetingDate: { contains: q, mode: "insensitive" } },
          ]
        : undefined,
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      meetingDate: true,
      updatedAt: true,
      clubId: true,
      ownerId: true,
    },
  })

  return NextResponse.json({
    items: agendas.map((agenda) => ({
      id: agenda.id,
      slug: agenda.slug,
      title: agenda.title,
      meetingDate: agenda.meetingDate,
      updatedAt: agenda.updatedAt,
      canEdit: canUpdateAgendaByRole(
        rolesByClubId.get(agenda.clubId) ?? null,
        agenda.ownerId === session.user.id
      ),
    })),
  })
}

export async function POST(req: Request) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = (await req.json()) as Partial<AgendaSettings> & {
      clubId?: string
    }

    const settings = normalizeSettings(body)

    let club

    if (body.clubId) {
      const membership = await db.clubMembership.findUnique({
        where: {
          clubId_userId: {
            clubId: body.clubId,
            userId: session.user.id,
          },
        },
        include: {
          club: true,
        },
      })

      if (!membership || !canCreateAgendaByRole(membership.role)) {
        return NextResponse.json(
          { error: "Join or claim a club before saving an agenda." },
          { status: 403 }
        )
      }

      club = membership.club
    } else {
      club = await ensureDefaultClub(session.user.id)
    }

    let slug = makeReadableSlug(10)
    for (let i = 0; i < 5; i += 1) {
      const exists = await db.agenda.findUnique({ where: { slug } })
      if (!exists) break
      slug = makeReadableSlug(10)
    }

    const created = await db.agenda.create({
      data: {
        slug,
        clubId: club.id,
        ownerId: session.user.id,
        title: settings.meetingTitle || "Meeting Agenda",
        meetingDate: settings.meetingDate || null,
        settingsJson: settings,
      },
      select: {
        id: true,
        slug: true,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error("Failed to create agenda:", error)
    return NextResponse.json({ error: "Failed to create agenda" }, { status: 500 })
  }
}
