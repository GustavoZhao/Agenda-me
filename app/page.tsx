"use client"

import { useEffect, useState } from "react"
import { type AgendaSettings, DEFAULT_SETTINGS, normalizeSettings } from "@/lib/agenda"
import { AgendaSettingsPanel } from "@/components/agenda-settings"
import { AgendaPreview } from "@/components/agenda-preview"
import { Button } from "@/components/ui/button"
import { Eye, Moon, Printer, RotateCcw, Settings2, SunMedium } from "lucide-react"

const STORAGE_KEY = "toastmasters-agenda-v1"

type Tab = "settings" | "preview"

export default function Page() {
  const [settings, setSettings] = useState<AgendaSettings>(DEFAULT_SETTINGS)
  const [tab, setTab] = useState<Tab>("settings")
  const [loaded, setLoaded] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("light")

  // Restore config from local storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AgendaSettings>
        setSettings(normalizeSettings(parsed))
      }
    } catch {
      // ignore parse errors
    }
    setLoaded(true)
  }, [])

  // Persist config
  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // ignore storage errors
    }
  }, [settings, loaded])

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

  function reset() {
    if (confirm("Reset to the default agenda template? Your current changes will be lost.")) {
      setSettings(DEFAULT_SETTINGS)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {/* Top toolbar */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">BRICS+ Meeting Agenda</h1>
            <p className="text-sm text-muted-foreground">Configure sessions and timing to auto-generate the meeting agenda</p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <Button type="button" variant="outline" size="sm" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <SunMedium className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
              {theme === "dark" ? "Light" : "Dark"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Reset
            </Button>
            <Button type="button" size="sm" onClick={() => window.print()}>
              <Printer className="size-4" aria-hidden="true" />
              Print
            </Button>
          </div>
        </header>

        {/* Tab switch */}
        <div className="mb-6 inline-flex rounded-lg border border-border bg-card p-1 print:hidden">
          <TabButton active={tab === "settings"} onClick={() => setTab("settings")}>
            <Settings2 className="size-4" aria-hidden="true" />
            Settings
          </TabButton>
          <TabButton active={tab === "preview"} onClick={() => setTab("preview")}>
            <Eye className="size-4" aria-hidden="true" />
            Preview
          </TabButton>
        </div>

        {/* Content: Settings mode shows the config panel beside a compact preview;
            Preview mode hides the settings panel and shows a full-width agenda. */}
        {tab === "settings" ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <AgendaSettingsPanel settings={settings} onChange={setSettings} />
            </div>
            <div className="lg:sticky lg:top-6 lg:self-start">
              <AgendaPreview settings={settings} />
            </div>
          </div>
        ) : (
          <AgendaPreview settings={settings} fullWidth />
        )}
      </div>
    </main>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  )
}
