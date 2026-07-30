import { NextResponse } from "next/server"

import { getAuthSession } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ clubId: string }> }
) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { clubId } = await params
  const club = await db.club.findUnique({
    where: { id: clubId },
    select: { id: true, name: true },
  })

  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 })
  }

  try {
    const membership = await db.clubMembership.upsert({
      where: {
        clubId_userId: {
          clubId,
          userId: session.user.id,
        },
      },
      update: {},
      create: {
        clubId,
        userId: session.user.id,
        role: "viewer",
      },
      select: {
        role: true,
      },
    })

    return NextResponse.json({
      club,
      role: membership.role,
    })
  } catch (error) {
    console.error("Failed to claim club:", error)
    return NextResponse.json({ error: "Failed to claim club" }, { status: 500 })
  }
}
