import { getStore } from "@netlify/blobs"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import type { AgendaSettings } from "@/lib/agenda"
import { normalizeSettings } from "@/lib/agenda"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const store = getStore("agenda-shares")
    const data = await store.get(id)

    if (!data) {
      return NextResponse.json(
        { error: "The shared agenda link is invalid or has expired." },
        { status: 404 }
      )
    }

    const parsed = JSON.parse(data) as Partial<AgendaSettings>
    const settings = normalizeSettings(parsed)

    return NextResponse.json(settings, { status: 200 })
  } catch (error) {
    console.error("Failed to retrieve agenda:", error)
    return NextResponse.json(
      { error: "Failed to retrieve agenda" },
      { status: 500 }
    )
  }
}
