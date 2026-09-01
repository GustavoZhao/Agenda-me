import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthSession } from "@/lib/auth"
import { canEditByRole } from "@/lib/permissions"
import { parseToastmastersRoster } from "@/lib/roster-csv"

async function getMembership(clubId: string, userId: string) {
  return db.clubMembership.findUnique({
    where: { clubId_userId: { clubId, userId } },
    select: { role: true },
  })
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ clubId: string }> }
) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { clubId } = await params
  const membership = await getMembership(clubId, session.user.id)
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")?.trim() ?? ""

  try {
    const items = await db.rosterMember.findMany({
      where: {
        clubId,
        OR: q
          ? [
              { name: { contains: q, mode: "insensitive" } },
              { memberNumber: { contains: q, mode: "insensitive" } },
              { credential: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { status: { contains: q, mode: "insensitive" } },
              { currentPosition: { contains: q, mode: "insensitive" } },
              { pathwaysEnrolled: { contains: q, mode: "insensitive" } },
            ]
          : undefined,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error("Failed to load roster:", error)
    return NextResponse.json({ error: "Failed to load the saved member roster." }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ clubId: string }> }
) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { clubId } = await params
  const membership = await getMembership(clubId, session.user.id)
  if (!membership || !canEditByRole(membership.role)) {
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

    const created = await db.rosterMember.create({
      data: {
        clubId,
        name: body.name.trim(),
        memberNumber: body.memberNumber.trim(),
        credential: body.credential.trim(),
        email: body.email?.trim() || null,
        status: body.status?.trim() || null,
        currentPosition: body.currentPosition?.trim() || null,
        pathwaysEnrolled: body.pathwaysEnrolled?.trim() || null,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error("Failed to create roster member:", error)
    return NextResponse.json({ error: "Failed to create roster member" }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ clubId: string }> }
) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { clubId } = await params
  const membership = await getMembership(clubId, session.user.id)
  if (!membership || !canEditByRole(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = (await req.json()) as {
      csv?: string
      replace?: boolean
    }

    if (!body.csv?.trim()) {
      return NextResponse.json({ error: "CSV content is required" }, { status: 400 })
    }

    const rows = parseToastmastersRoster(body.csv)

    if (!rows.length) {
      return NextResponse.json(
        { error: "No valid roster rows were found. Customer ID, Name, and Credentials are required." },
        { status: 400 }
      )
    }

    if (body.replace) {
      await db.rosterMember.deleteMany({ where: { clubId } })
    }

    if (rows.length > 0) {
      await db.rosterMember.createMany({
        data: rows.map((row) => ({
          clubId,
          name: row.name,
          memberNumber: row.memberNumber,
          credential: row.credential,
          email: row.email || null,
          status: row.status || null,
          currentPosition: row.currentPosition || null,
          pathwaysEnrolled: row.pathwaysEnrolled || null,
        })),
        skipDuplicates: true,
      })
    }

    return NextResponse.json({ imported: rows.length })
  } catch (error) {
    console.error("Failed to import roster:", error)
    return NextResponse.json({ error: "Failed to import roster" }, { status: 500 })
  }
}
