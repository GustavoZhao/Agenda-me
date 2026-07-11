import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import type { ClubRole } from "@prisma/client"

const ALL_ROLES: ClubRole[] = ["owner", "admin", "editor", "viewer"]

function isValidRole(value: string): value is ClubRole {
  return ALL_ROLES.includes(value as ClubRole)
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

  if (!actor || (actor.role !== "owner" && actor.role !== "admin")) {
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
    if (!body.role || !isValidRole(body.role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    if (target.userId === session.user.id && body.role !== "owner") {
      return NextResponse.json({ error: "You cannot demote yourself" }, { status: 400 })
    }

    if (actor.role === "admin") {
      if (target.role === "owner" || target.role === "admin") {
        return NextResponse.json({ error: "Admins cannot modify owner/admin roles" }, { status: 403 })
      }
      if (body.role === "owner" || body.role === "admin") {
        return NextResponse.json({ error: "Admins can only assign editor/viewer" }, { status: 403 })
      }
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
