"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  type AgendaSettings,
  DEFAULT_SETTINGS,
  normalizeSettings,
} from "@/lib/agenda"
import { AgendaSettingsPanel } from "@/components/agenda-settings"
import { AgendaPreview } from "@/components/agenda-preview"
import { Button } from "@/components/ui/button"
import { Eye, LogIn, LogOut, Moon, Printer, RotateCcw, Save, Settings2, SunMedium } from "lucide-react"

const STORAGE_KEY = "toastmasters-agenda-v1"

type Tab = "settings" | "preview"

type ClubSummary = {
  role: "owner" | "admin" | "editor" | "viewer"
  club: {
    id: string
    name: string
  }
}

function PageContent() {
  const searchParams = useSearchParams()
  const [settings, setSettings] = useState<AgendaSettings>(DEFAULT_SETTINGS)
  const [tab, setTab] = useState<Tab>("settings")
  const [loaded, setLoaded] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [shareMessage, setShareMessage] = useState<string | null>(null)
  const [currentSlug, setCurrentSlug] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [memberName, setMemberName] = useState("")
  const [clubs, setClubs] = useState<ClubSummary[]>([])
  const [activeClubId, setActiveClubId] = useState("")

  const editingSlug = searchParams.get("slug")

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

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch("/api/me")
        const data = (await response.json()) as {
          authenticated: boolean
          user?: {
            name?: string | null
          }
        }
        setIsAuthenticated(data.authenticated)
        setMemberName(data.authenticated ? data.user?.name?.trim() || "Member" : "")
      } catch {
        setIsAuthenticated(false)
        setMemberName("")
      }
    }

    loadSession()
  }, [])

  useEffect(() => {
    async function loadClubs() {
      if (!isAuthenticated) return

      try {
        const clubsResponse = await fetch("/api/clubs")
        if (!clubsResponse.ok) return

        const clubsData = (await clubsResponse.json()) as { items: ClubSummary[] }
        setClubs(clubsData.items)

        if (clubsData.items.length === 0) return

        const stored = window.localStorage.getItem("active-club-id")
        const activeClubId = clubsData.items.find((item) => item.club.id === stored)?.club.id ?? clubsData.items[0].club.id
        setActiveClubId(activeClubId)
      } catch {
        // ignore profile loading errors
      }
    }

    loadClubs()
  }, [isAuthenticated])

  useEffect(() => {
    async function loadActiveClubProfile() {
      if (!isAuthenticated || !activeClubId) return

      try {

        const detailResponse = await fetch(`/api/clubs/${encodeURIComponent(activeClubId)}`)
        if (!detailResponse.ok) return

        const detail = (await detailResponse.json()) as {
          club: {
            name: string
            slogan: string | null
            meetingType: "in_person" | "online" | "hybrid"
            inPersonAddress: string | null
            onlinePlatform: string | null
            onlineMeetingId: string | null
            onlinePasscode: string | null
            president: string | null
            vpe: string | null
            vpm: string | null
            vppr: string | null
            secretary: string | null
            treasurer: string | null
            saa: string | null
            ipp: string | null
            mentors: string | null
            sponsors: string | null
            advisor: string | null
            participantNotesTitle: string | null
            participantNotesBody: string | null
            vpmContactNote: string | null
            clubNumber: string | null
            area: string | null
            division: string | null
            district: string | null
            timezone: string | null
            wechatQrUrl: string | null
            whatsappQrUrl: string | null
          }
        }

        window.localStorage.setItem("active-club-id", activeClubId)

        setSettings((prev) => ({
          ...prev,
          clubInfo: {
            ...prev.clubInfo,
            clubName: detail.club.name || prev.clubInfo.clubName,
            slogan: detail.club.slogan || prev.clubInfo.slogan,
            meetingType: detail.club.meetingType || prev.clubInfo.meetingType,
            inPersonAddress: detail.club.inPersonAddress || prev.clubInfo.inPersonAddress,
            onlinePlatform: detail.club.onlinePlatform || prev.clubInfo.onlinePlatform,
            onlineMeetingId: detail.club.onlineMeetingId || prev.clubInfo.onlineMeetingId,
            onlinePasscode: detail.club.onlinePasscode || prev.clubInfo.onlinePasscode,
            president: detail.club.president || prev.clubInfo.president,
            vpe: detail.club.vpe || prev.clubInfo.vpe,
            vpm: detail.club.vpm || prev.clubInfo.vpm,
            vppr: detail.club.vppr || prev.clubInfo.vppr,
            secretary: detail.club.secretary || prev.clubInfo.secretary,
            treasurer: detail.club.treasurer || prev.clubInfo.treasurer,
            saa: detail.club.saa || prev.clubInfo.saa,
            ipp: detail.club.ipp || prev.clubInfo.ipp,
            mentors: detail.club.mentors || prev.clubInfo.mentors,
            sponsors: detail.club.sponsors || prev.clubInfo.sponsors,
            advisor: detail.club.advisor || prev.clubInfo.advisor,
            participantNotesTitle: detail.club.participantNotesTitle || prev.clubInfo.participantNotesTitle,
            participantNotesBody: detail.club.participantNotesBody || prev.clubInfo.participantNotesBody,
            vpmContactNote: detail.club.vpmContactNote || prev.clubInfo.vpmContactNote,
            clubNumber: detail.club.clubNumber || prev.clubInfo.clubNumber,
            area: detail.club.area || prev.clubInfo.area,
            division: detail.club.division || prev.clubInfo.division,
            district: detail.club.district || prev.clubInfo.district,
            vpmWechatQr: detail.club.wechatQrUrl || prev.clubInfo.vpmWechatQr,
            vpmWhatsappQr: detail.club.whatsappQrUrl || prev.clubInfo.vpmWhatsappQr,
          },
        }))
      } catch {
        // ignore profile loading errors
      }
    }

    loadActiveClubProfile()
  }, [activeClubId, isAuthenticated])

  useEffect(() => {
    async function loadForEdit() {
      if (!editingSlug) return
      try {
        const response = await fetch(`/api/agendas/${encodeURIComponent(editingSlug)}`)
        if (!response.ok) return
        const data = (await response.json()) as { settings: AgendaSettings }
        setSettings(normalizeSettings(data.settings))
        setCurrentSlug(editingSlug)
      } catch {
        // ignore load failure
      }
    }

    loadForEdit()
  }, [editingSlug])

  function reset() {
    if (confirm("Reset to the default agenda template? Your current changes will be lost.")) {
      setSettings(DEFAULT_SETTINGS)
    }
  }

  async function saveAndShare() {
    if (!isAuthenticated) {
      try {
        const response = await fetch("/api/share/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        })

        if (!response.ok) {
          setShareMessage("Failed to create temporary share link. Please try again.")
          return
        }

        const payload = (await response.json()) as { shareId?: string }
        if (!payload.shareId) {
          setShareMessage("Temporary link was created but no URL was returned.")
          return
        }

        const url = `${window.location.origin}/share?id=${encodeURIComponent(payload.shareId)}`

        try {
          await navigator.clipboard.writeText(url)
        } catch {
          // ignore clipboard errors
        }

        window.open(url, "_blank", "noopener,noreferrer")
        setShareMessage("Temporary share link created. The link has been copied to your clipboard.")
      } catch (error) {
        console.error("Error creating temporary share link:", error)
        setShareMessage("Failed to create temporary share link. Please try again.")
      }
      return
    }

    try {
      const slug = currentSlug ?? editingSlug
      const response = await fetch(slug ? `/api/agendas/${encodeURIComponent(slug)}` : "/api/agendas", {
        method: slug ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slug ? settings : { ...settings, clubId: activeClubId || undefined }),
      })

      if (!response.ok) {
        setShareMessage("Failed to create shareable link. Please try again.")
        return
      }

      const payload = (await response.json()) as { slug?: string }
      const nextSlug = payload.slug ?? slug

      if (!nextSlug) {
        setShareMessage("Save succeeded but no agenda URL was returned.")
        return
      }

      setCurrentSlug(nextSlug)
      const url = `${window.location.origin}/agenda/${encodeURIComponent(nextSlug)}`

      try {
        await navigator.clipboard.writeText(url)
      } catch {
        // ignore clipboard errors and still open the page
      }

      setShareMessage("Agenda saved to a fixed link. The link has been copied to your clipboard.")
    } catch (error) {
      console.error("Error creating share link:", error)
      setShareMessage("Failed to save agenda. Please try again.")
    }
  }

  async function signIn() {
    window.location.href = "/auth/signin"
  }

  async function signOut() {
    window.location.href = "/api/auth/signout"
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-2 py-6 sm:px-3 lg:px-4">
        {/* Top toolbar */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">BRICS+ Meeting Agenda</h1>
            <p className="text-sm text-muted-foreground">Configure sessions and timing to auto-generate the meeting agenda</p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            {isAuthenticated ? (
              <span className="rounded-md border border-border bg-card px-3 py-1 text-sm text-foreground">
                {memberName}
              </span>
            ) : null}
            {isAuthenticated && clubs.length > 0 ? (
              <select
                value={activeClubId}
                onChange={(event) => setActiveClubId(event.target.value)}
                className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground"
                aria-label="Active club"
              >
                {clubs.map((item) => (
                  <option key={item.club.id} value={item.club.id}>
                    {item.club.name} ({item.role})
                  </option>
                ))}
              </select>
            ) : null}
            <Link href="/my-agendas">
              <Button type="button" variant="outline" size="sm">My Agendas</Button>
            </Link>
            <Link href="/club-settings">
              <Button type="button" variant="outline" size="sm">Club Settings</Button>
            </Link>
            <Link href="/roster">
              <Button type="button" variant="outline" size="sm">Roster</Button>
            </Link>
            <Button type="button" variant="outline" size="sm" onClick={isAuthenticated ? signOut : signIn}>
              {isAuthenticated ? <LogOut className="size-4" aria-hidden="true" /> : <LogIn className="size-4" aria-hidden="true" />}
              {isAuthenticated ? "Sign out" : "Sign in"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <SunMedium className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
              {theme === "dark" ? "Light" : "Dark"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Reset
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={saveAndShare}>
              <Save className="size-4" aria-hidden="true" />
              Save
            </Button>
            <Button type="button" size="sm" onClick={() => window.print()}>
              <Printer className="size-4" aria-hidden="true" />
              Print
            </Button>
          </div>
        </header>

        {shareMessage ? (
          <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
            {shareMessage}
          </p>
        ) : null}

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
          <div className="grid gap-4 lg:grid-cols-[minmax(360px,1fr)_minmax(0,1.35fr)]">
            <div className="min-h-0 lg:max-h-[calc(100vh-11rem)] lg:overflow-y-auto lg:pr-1">
              <AgendaSettingsPanel settings={settings} onChange={setSettings} showClubInfo={false} />
            </div>
            <div className="min-h-0 lg:max-h-[calc(100vh-11rem)] lg:overflow-y-auto lg:pr-1">
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

export default function Page() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-background">Loading...</main>}>
      <PageContent />
    </Suspense>
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
