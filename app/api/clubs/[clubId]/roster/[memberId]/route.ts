import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthSession } from "@/lib/auth"
import { canEditByRole } from "@/lib/permissions"

async function canEdit(clubId: string, userId: string) {
  const membership = await db.clubMembership.findUnique({
    where: { clubId_userId: { clubId, userId } },
    select: { role: true },
  })

  return membership ? canEditByRole(membership.role) : false
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ clubId: string; memberId: string }> }
) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { clubId, memberId } = await params
  if (!(await canEdit(clubId, session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = (await req.json()) as {
      name?: string
      memberNumber?: string
      credential?: string
      email?: string
      status?: string
      currentPosition?: string
      pathwaysEnrolled?: string
    }

    if (!body.memberNumber?.trim() || !body.name?.trim() || !body.credential?.trim()) {
      return NextResponse.json(
        { error: "Customer ID, Name, and Credentials are required." },
        { status: 400 }
      )
    }

    const existing = await db.rosterMember.findFirst({
      where: {
        id: memberId,
        clubId,
      },
      select: { id: true },
    })

    if (!existing) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    const updated = await db.rosterMember.update({
      where: { id: memberId },
      data: {
        name: body.name.trim(),
        memberNumber: body.memberNumber.trim(),
        credential: body.credential.trim(),
        email: body.email?.trim() || null,
        status: body.status?.trim() || null,
        currentPosition: body.currentPosition?.trim() || null,
        pathwaysEnrolled: body.pathwaysEnrolled?.trim() || null,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update roster member:", error)
    return NextResponse.json({ error: "Failed to update roster member" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ clubId: string; memberId: string }> }
) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { clubId, memberId } = await params
  if (!(await canEdit(clubId, session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await db.rosterMember.deleteMany({
    where: {
      id: memberId,
      clubId,
    },
  })

  return NextResponse.json({ ok: true })
}
