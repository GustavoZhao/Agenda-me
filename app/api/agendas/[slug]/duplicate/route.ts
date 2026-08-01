import { NextResponse } from "next/server"

import { getAuthSession } from "@/lib/auth"
import { normalizeSettings, type AgendaSettings } from "@/lib/agenda"
import { db } from "@/lib/db"
import { canCreateAgendaByRole } from "@/lib/permissions"
import { makeReadableSlug } from "@/lib/slug"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { slug } = await params
  const source = await db.agenda.findUnique({
    where: { slug },
    select: {
      clubId: true,
      title: true,
      meetingDate: true,
      settingsJson: true,
    },
  })

  if (!source) {
    return NextResponse.json({ error: "Agenda not found" }, { status: 404 })
  }

  const membership = await db.clubMembership.findUnique({
    where: {
      clubId_userId: {
        clubId: source.clubId,
        userId: session.user.id,
      },
    },
    select: { role: true },
  })

  if (!membership || !canCreateAgendaByRole(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    let duplicateSlug = makeReadableSlug(10)
    for (let i = 0; i < 5; i += 1) {
      const exists = await db.agenda.findUnique({ where: { slug: duplicateSlug } })
      if (!exists) break
      duplicateSlug = makeReadableSlug(10)
    }

    const duplicatedSettings = normalizeSettings(source.settingsJson as Partial<AgendaSettings>)
    const duplicate = await db.agenda.create({
      data: {
        slug: duplicateSlug,
        clubId: source.clubId,
        ownerId: session.user.id,
        title: source.title,
        meetingDate: source.meetingDate,
        settingsJson: duplicatedSettings,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        meetingDate: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ ...duplicate, canEdit: true }, { status: 201 })
  } catch (error) {
    console.error("Failed to duplicate agenda:", error)
    return NextResponse.json({ error: "Failed to duplicate agenda" }, { status: 500 })
  }
}
