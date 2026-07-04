import { getStore } from "@netlify/blobs"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import type { AgendaSettings } from "@/lib/agenda"
import { normalizeSettings } from "@/lib/agenda"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Partial<AgendaSettings>
    const settings = normalizeSettings(body)

    // Generate a unique ID for this shared agenda
    const shareId = `agenda-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

    // Store in Netlify Blobs
    const store = getStore("agenda-shares")
    await store.set(shareId, JSON.stringify(settings), { metadata: { createdAt: new Date().toISOString() } })

    return NextResponse.json({ shareId }, { status: 201 })
  } catch (error) {
    console.error("Failed to save agenda:", error)
    return NextResponse.json({ error: "Failed to save agenda" }, { status: 500 })
  }
}
