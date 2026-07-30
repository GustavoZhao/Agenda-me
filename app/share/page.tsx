"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AgendaPreview } from "@/components/agenda-preview"
import { SharedAgendaActions } from "@/components/shared-agenda-actions"
import { type AgendaSettings, DEFAULT_SETTINGS } from "@/lib/agenda"

function SharePageContent() {
  const searchParams = useSearchParams()
  const [settings, setSettings] = useState<AgendaSettings>(DEFAULT_SETTINGS)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<"light" | "dark">("light")

  const shareId = searchParams.get("id")

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
    async function loadSharedAgenda() {
      if (!shareId) {
        setError("No agenda ID provided in the link.")
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/share/${encodeURIComponent(shareId)}`)

        if (!response.ok) {
          setError("The shared agenda link is invalid or has expired.")
          setLoading(false)
          return
        }

        const data = (await response.json()) as AgendaSettings
        setSettings(data)
      } catch (err) {
        console.error("Error loading shared agenda:", err)
        setError("Failed to load the shared agenda.")
      } finally {
        setLoading(false)
      }
    }

    loadSharedAgenda()
  }, [shareId])

  const title = useMemo(() => settings.meetingTitle || "Meeting Agenda", [settings.meetingTitle])

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
        <div className="max-w-lg rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-foreground">Unable to load shared agenda</h1>
          <p className="mt-3 text-sm text-muted-foreground">{error}</p>
        </div>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Loading shared agenda…</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3 print:hidden">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">Shared agenda view</p>
          </div>
          <SharedAgendaActions
            settings={settings}
            theme={theme}
            onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
          />
        </div>
        <AgendaPreview settings={settings} fullWidth />
      </div>
    </main>
  )
}

export default function SharePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background">Loading shared agenda…</div>}>
      <SharePageContent />
    </Suspense>
  )
}
