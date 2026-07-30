import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { canManageMembersByRole } from "@/lib/permissions"

type ClaimRole = "editor" | "viewer"

function isValidClaimRole(value: string): value is ClaimRole {
  return value === "editor" || value === "viewer"
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ clubId: string; membershipId: string }> }
) {
  const { getAuthSession } = await import("@/lib/auth")
  const session = await getAuthSession()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { clubId, membershipId } = await params

  const actor = await db.clubMembership.findUnique({
    where: {
      clubId_userId: {
        clubId,
        userId: session.user.id,
      },
    },
    select: { role: true },
  })

  if (!actor || !canManageMembersByRole(actor.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const target = await db.clubMembership.findFirst({
    where: {
      id: membershipId,
      clubId,
    },
    select: {
      id: true,
      userId: true,
      role: true,
    },
  })

  if (!target) {
    return NextResponse.json({ error: "Membership not found" }, { status: 404 })
  }

  try {
    const body = (await req.json()) as { role?: string }
    if (!body.role || !isValidClaimRole(body.role)) {
      return NextResponse.json(
        { error: "Claimed members can only be assigned viewer or editor" },
        { status: 400 }
      )
    }

    if (target.userId === session.user.id || target.role === "owner" || target.role === "admin") {
      return NextResponse.json({ error: "The club owner/admin role cannot be changed here" }, { status: 403 })
    }

    const updated = await db.clubMembership.update({
      where: { id: membershipId },
      data: {
        role: body.role,
      },
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
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update membership role:", error)
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 })
  }
}
