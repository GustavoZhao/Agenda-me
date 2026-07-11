"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AgendaPreview } from "@/components/agenda-preview"
import { type AgendaSettings, DEFAULT_SETTINGS } from "@/lib/agenda"
import { Button } from "@/components/ui/button"
import { Moon, PencilLine, SunMedium } from "lucide-react"

type AgendaResponse = {
  id: string
  slug: string
  settings: AgendaSettings
  canEdit: boolean
}

export default function AgendaDetailPage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const [settings, setSettings] = useState<AgendaSettings>(DEFAULT_SETTINGS)
  const [canEdit, setCanEdit] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [theme, setTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("agenda-theme")
    if (storedTheme === "dark" || storedTheme === "light") {
      setTheme(storedTheme)
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark")
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    document.documentElement.classList.toggle("light", theme === "light")
    window.localStorage.setItem("agenda-theme", theme)
  }, [theme])

  useEffect(() => {
    async function loadAgenda() {
      if (!params.slug) return

      try {
        const response = await fetch(`/api/agendas/${encodeURIComponent(params.slug)}`)
        if (!response.ok) {
          setError("The agenda link is invalid or no longer available.")
          setLoading(false)
          return
        }

        const data = (await response.json()) as AgendaResponse
        setSettings(data.settings)
        setCanEdit(data.canEdit)
      } catch (err) {
        console.error("Failed to load agenda:", err)
        setError("Failed to load agenda.")
      } finally {
        setLoading(false)
      }
    }

    loadAgenda()
  }, [params.slug])

  const title = useMemo(() => settings.meetingTitle || "Meeting Agenda", [settings.meetingTitle])

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
        <div className="max-w-lg rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-foreground">Unable to load agenda</h1>
          <p className="mt-3 text-sm text-muted-foreground">{error}</p>
        </div>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading agenda...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">Shared agenda view</p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <SunMedium className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
              {theme === "dark" ? "Light" : "Dark"}
            </Button>
            {canEdit ? (
              <Button
                type="button"
                size="sm"
                onClick={() => router.push(`/?slug=${encodeURIComponent(params.slug)}`)}
              >
                <PencilLine className="size-4" aria-hidden="true" />
                Edit
              </Button>
            ) : null}
          </div>
        </div>
        <AgendaPreview settings={settings} fullWidth />
      </div>
    </main>
  )
}
