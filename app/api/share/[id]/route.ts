import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import type { AgendaSettings } from "@/lib/agenda"
import { normalizeSettings } from "@/lib/agenda"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await db.sharedAgenda.findUnique({
      where: { id },
      select: { settingsJson: true },
    })

    if (!data) {
      return NextResponse.json(
        { error: "The shared agenda link is invalid or has expired." },
        { status: 404 }
      )
    }

    const settings = normalizeSettings(data.settingsJson as Partial<AgendaSettings>)

    return NextResponse.json(settings, { status: 200 })
  } catch (error) {
    console.error("Failed to retrieve agenda:", error)
    return NextResponse.json(
      { error: "Failed to retrieve agenda" },
      { status: 500 }
    )
  }
}
