import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthSession } from "@/lib/auth"
import { canEditByRole } from "@/lib/permissions"

async function getMembership(clubId: string, userId: string) {
  return db.clubMembership.findUnique({
    where: { clubId_userId: { clubId, userId } },
    select: { role: true },
  })
}

function parseCsv(csv: string) {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) return [] as Array<{ name: string; memberNumber: string; credential: string }>

  const rows = lines.slice(1)
  return rows
    .map((line) => {
      const [name, memberNumber, credential] = line.split(",").map((part) => part?.trim() ?? "")
      return { name, memberNumber, credential }
    })
    .filter((row) => row.name)
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

  const items = await db.rosterMember.findMany({
    where: {
      clubId,
      OR: q
        ? [
            { name: { contains: q, mode: "insensitive" } },
            { memberNumber: { contains: q, mode: "insensitive" } },
            { credential: { contains: q, mode: "insensitive" } },
          ]
        : undefined,
    },
    orderBy: { name: "asc" },
  })

  return NextResponse.json({ items })
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
    }

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const created = await db.rosterMember.create({
      data: {
        clubId,
        name: body.name.trim(),
        memberNumber: body.memberNumber?.trim() || null,
        credential: body.credential?.trim() || null,
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

    const rows = parseCsv(body.csv)

    if (body.replace) {
      await db.rosterMember.deleteMany({ where: { clubId } })
    }

    if (rows.length > 0) {
      await db.rosterMember.createMany({
        data: rows.map((row) => ({
          clubId,
          name: row.name,
          memberNumber: row.memberNumber || null,
          credential: row.credential || null,
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
