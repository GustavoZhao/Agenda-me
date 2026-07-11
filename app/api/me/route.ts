import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user) {
    return NextResponse.json({ authenticated: false })
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    },
  })
}
