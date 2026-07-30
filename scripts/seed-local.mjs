import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const databaseUrl = new URL(process.env.DATABASE_URL ?? "")
if (!["localhost", "127.0.0.1", "::1"].includes(databaseUrl.hostname)) {
  throw new Error("Local seed refused: DATABASE_URL must point to this computer.")
}

const email = process.env.LOCAL_ADMIN_EMAIL?.trim().toLowerCase()
const password = process.env.LOCAL_ADMIN_PASSWORD ?? ""
const name = process.env.LOCAL_ADMIN_NAME?.trim() || "Local Administrator"

if (!email || password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
  throw new Error("Set a valid LOCAL_ADMIN_EMAIL and a password with at least 8 characters, letters, and numbers.")
}

const db = new PrismaClient()

try {
  const passwordHash = await hash(password, 12)
  const user = await db.user.upsert({
    where: { email },
    update: { name, passwordHash },
    create: { email, name, passwordHash },
  })

  const existingMembership = await db.clubMembership.findFirst({
    where: { userId: user.id },
  })

  if (!existingMembership) {
    await db.club.create({
      data: {
        slug: "local-sample-club",
        name: "Sample Toastmasters Club",
        slogan: "Where leaders are made",
        meetingType: "online",
        onlinePlatform: "Zoom",
        clubNumber: "00000000",
        createdById: user.id,
        memberships: {
          create: {
            userId: user.id,
            role: "owner",
          },
        },
      },
    })
  }

  console.log(`Local administrator ready: ${email}`)
} finally {
  await db.$disconnect()
}
