import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { db } from "@/lib/db"

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidPassword(password: string): boolean {
  if (password.length < 6) return false
  const hasLetter = /[A-Za-z]/.test(password)
  const hasNumber = /\d/.test(password)
  return hasLetter && hasNumber
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string
      password?: string
      name?: string
    }

    const email = body.email?.trim().toLowerCase() ?? ""
    const password = body.password ?? ""
    const name = body.name?.trim() || null

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters and include both letters and numbers" },
        { status: 400 }
      )
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing?.passwordHash) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 409 })
    }

    const passwordHash = await hash(password, 12)

    if (existing && !existing.passwordHash) {
      await db.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          name: existing.name ?? name,
        },
      })
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    await db.user.create({
      data: {
        email,
        name,
        passwordHash,
      },
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    console.error("Failed to register user:", error)
    return NextResponse.json({ error: "Failed to register" }, { status: 500 })
  }
}
