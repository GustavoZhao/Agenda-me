import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user) {
    return NextResponse.json({ authenticated: false })
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true },
  })

  if (!user) {
    return NextResponse.json({ authenticated: false })
  }

  return NextResponse.json({
    authenticated: true,
    user,
  })
}

export async function PATCH(req: Request) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await req.json()) as { name?: string }
  const name = body.name?.trim()
  if (!name || name.length > 80) {
    return NextResponse.json({ error: "Nickname must contain 1–80 characters." }, { status: 400 })
  }

  const user = await db.user.update({
    where: { id: session.user.id },
    data: { name },
    select: { id: true, name: true, email: true, image: true },
  })

  return NextResponse.json({ user })
}
