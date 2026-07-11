import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthSession } from "@/lib/auth"
import { normalizeSettings, type AgendaSettings } from "@/lib/agenda"
import { canEditByRole, canManageByRole } from "@/lib/permissions"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const agenda = await db.agenda.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      ownerId: true,
      title: true,
      meetingDate: true,
      settingsJson: true,
      updatedAt: true,
      clubId: true,
    },
  })

  if (!agenda) {
    return NextResponse.json({ error: "Agenda not found" }, { status: 404 })
  }

  const settings = normalizeSettings(agenda.settingsJson as Partial<AgendaSettings>)
  const session = await getAuthSession()
  let canEdit = false

  if (session?.user?.id) {
    const membership = await db.clubMembership.findUnique({
      where: {
        clubId_userId: {
          clubId: agenda.clubId,
          userId: session.user.id,
        },
      },
      select: { role: true },
    })
    canEdit = membership ? canEditByRole(membership.role) : false
  }

  return NextResponse.json({
    ...agenda,
    settings,
    canEdit,
  })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { slug } = await params

  const existing = await db.agenda.findUnique({
    where: { slug },
    select: {
      id: true,
      clubId: true,
    },
  })

  if (!existing) {
    return NextResponse.json({ error: "Agenda not found" }, { status: 404 })
  }

  const membership = await db.clubMembership.findUnique({
    where: {
      clubId_userId: {
        clubId: existing.clubId,
        userId: session.user.id,
      },
    },
    select: { role: true },
  })

  if (!membership || !canEditByRole(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = (await req.json()) as Partial<AgendaSettings>
    const settings = normalizeSettings(body)

    const updated = await db.agenda.update({
      where: { slug },
      data: {
        title: settings.meetingTitle || "Meeting Agenda",
        meetingDate: settings.meetingDate || null,
        settingsJson: settings,
      },
      select: {
        id: true,
        slug: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update agenda:", error)
    return NextResponse.json({ error: "Failed to update agenda" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { slug } = await params

  const existing = await db.agenda.findUnique({
    where: { slug },
    select: {
      id: true,
      clubId: true,
    },
  })

  if (!existing) {
    return NextResponse.json({ error: "Agenda not found" }, { status: 404 })
  }

  const membership = await db.clubMembership.findUnique({
    where: {
      clubId_userId: {
        clubId: existing.clubId,
        userId: session.user.id,
      },
    },
    select: { role: true },
  })

  if (!membership || !canManageByRole(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await db.agenda.delete({ where: { slug } })
  return NextResponse.json({ ok: true })
}
