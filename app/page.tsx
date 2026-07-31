"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signOut as nextAuthSignOut } from "next-auth/react"
import {
  type AgendaSettings,
  DEFAULT_SETTINGS,
  normalizeSettings,
  resetMeetingPreservingClub,
} from "@/lib/agenda"
import { AgendaSettingsPanel } from "@/components/agenda-settings"
import { AgendaPreview } from "@/components/agenda-preview"
import { AgendaToolbar } from "@/components/agenda-toolbar"
import { Button } from "@/components/ui/button"
import { exportAgendaAsPng } from "@/lib/export-agenda"
import { Building2, Eye, Link2, ListChecks, LogOut, Settings2, UserPlus, X } from "lucide-react"

const GUEST_STORAGE_KEY = "toastmasters-agenda-guest-v2"
const MEMBER_STORAGE_KEY = "toastmasters-agenda-member-v2"

type Tab = "settings" | "preview"

type ClubSummary = {
  role: "owner" | "admin" | "editor" | "viewer"
  club: {
    id: string
    name: string
  }
}

function PageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [settings, setSettings] = useState<AgendaSettings>(DEFAULT_SETTINGS)
  const [tab, setTab] = useState<Tab>("settings")
  const [loaded, setLoaded] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [shareMessage, setShareMessage] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [currentSlug, setCurrentSlug] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [memberName, setMemberName] = useState("")
  const [clubs, setClubs] = useState<ClubSummary[]>([])
  const [activeClubId, setActiveClubId] = useState("")
  const [showSignOutDialog, setShowSignOutDialog] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [showGuestGuide, setShowGuestGuide] = useState(true)

  const editingSlug = searchParams.get("slug")

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
      } finally {
        setAuthChecked(true)
      }
    }

    loadSession()
  }, [])

  // Keep guest drafts separate from signed-in club data so signing out never
  // exposes the previous member's club profile in the anonymous template.
  useEffect(() => {
    if (!authChecked || editingSlug) return
    const storageKey = isAuthenticated ? MEMBER_STORAGE_KEY : GUEST_STORAGE_KEY
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AgendaSettings>
        setSettings(normalizeSettings(parsed))
      } else {
        setSettings(DEFAULT_SETTINGS)
      }
    } catch {
      setSettings(DEFAULT_SETTINGS)
    }
    setLoaded(true)
  }, [authChecked, editingSlug, isAuthenticated])

  useEffect(() => {
    if (!loaded || !authChecked || editingSlug) return
    const storageKey = isAuthenticated ? MEMBER_STORAGE_KEY : GUEST_STORAGE_KEY
    try {
      localStorage.setItem(storageKey, JSON.stringify(settings))
    } catch {
      // ignore storage errors
    }
  }, [authChecked, editingSlug, isAuthenticated, loaded, settings])

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
            clubName: detail.club.name,
            slogan: detail.club.slogan ?? "",
            meetingType: detail.club.meetingType,
            inPersonAddress: detail.club.inPersonAddress ?? "",
            onlinePlatform: detail.club.onlinePlatform ?? "",
            onlineMeetingId: detail.club.onlineMeetingId ?? "",
            onlinePasscode: detail.club.onlinePasscode ?? "",
            president: detail.club.president ?? "",
            vpe: detail.club.vpe ?? "",
            vpm: detail.club.vpm ?? "",
            vppr: detail.club.vppr ?? "",
            secretary: detail.club.secretary ?? "",
            treasurer: detail.club.treasurer ?? "",
            saa: detail.club.saa ?? "",
            ipp: detail.club.ipp ?? "",
            mentors: detail.club.mentors ?? "",
            sponsors: detail.club.sponsors ?? "",
            advisor: detail.club.advisor ?? "",
            participantNotesTitle: detail.club.participantNotesTitle ?? "",
            participantNotesBody: detail.club.participantNotesBody ?? "",
            vpmContactNote: detail.club.vpmContactNote ?? "",
            clubNumber: detail.club.clubNumber ?? "",
            area: detail.club.area ?? "",
            division: detail.club.division ?? "",
            district: detail.club.district ?? "",
            vpmWechatQr: detail.club.wechatQrUrl ?? "",
            vpmWhatsappQr: detail.club.whatsappQrUrl ?? "",
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
    if (confirm("Start a new Standard meeting? Your club information will be kept, but the current meeting details will be cleared.")) {
      setSettings((current) => resetMeetingPreservingClub(current))
      setCurrentSlug(null)
      setShareMessage(null)
      if (editingSlug) {
        router.replace("/")
      }
    }
  }

  async function saveAndShare() {
    if (!isAuthenticated) {
      setShowGuestGuide(true)
      setShareMessage("Create an account or sign in to save club information and share a finished agenda link.")
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
        const errorPayload = (await response.json().catch(() => ({}))) as { error?: string }
        setShareMessage(errorPayload.error || "Failed to create shareable link. Please try again.")
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

  async function confirmSignOut() {
    setIsSigningOut(true)
    await nextAuthSignOut({ redirect: false })
    window.location.assign("/")
  }

  async function exportAgenda() {
    setIsExporting(true)
    setShareMessage(null)
    try {
      await exportAgendaAsPng(settings)
      setShareMessage("Agenda PNG exported successfully.")
    } catch (error) {
      console.error("Failed to export agenda:", error)
      setShareMessage("Failed to export the agenda image. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
    <main
      className={`min-h-screen overflow-x-hidden bg-background transition-[filter] duration-200 ${
        showSignOutDialog ? "pointer-events-none brightness-50 blur-[2px]" : ""
      }`}
      aria-hidden={showSignOutDialog}
    >
      <div className="mx-auto max-w-7xl px-2 py-6 sm:px-3 lg:px-4">
        {/* Top toolbar */}
        <header className="mb-6 flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <h1 className="bg-gradient-to-r from-[#772432] via-[#004165] to-[#A98822] bg-clip-text text-2xl font-black leading-tight text-transparent [font-family:var(--font-montserrat)] sm:text-[1.7rem] dark:from-[#F2DF74] dark:via-[#8DC8E8] dark:to-[#E9A3AD]">
              Speechaholic Agenda Builder
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Plan meeting roles, sessions, speeches, and timing, then preview, print, or export a polished
              agenda for your Toastmasters meeting.
            </p>
          </div>
          <AgendaToolbar
            activeClubId={activeClubId}
            clubs={clubs}
            isAuthenticated={isAuthenticated}
            memberName={memberName}
            theme={theme}
            isExporting={isExporting}
            onActiveClubChange={setActiveClubId}
            onExport={exportAgenda}
            onPrint={() => window.print()}
            onReset={reset}
            onSave={saveAndShare}
            onSignOut={() => setShowSignOutDialog(true)}
            onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
          />
        </header>

        {authChecked && !isAuthenticated && showGuestGuide ? (
          <section className="relative mb-6 rounded-xl border border-dashed border-border bg-muted/25 p-4 pr-12 print:hidden">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Orientation tip</p>
              <h2 className="mt-1 text-sm font-semibold text-foreground">Save and share your club agenda</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Create a free account to save club information and publish a reusable agenda link.
              </p>
              <button
                type="button"
                onClick={() => setShowGuestGuide(false)}
                className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Close getting started guide"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: UserPlus, title: "1. Create an account", text: "Register or sign in to keep your work.", link: "/auth/signin", linkText: "Register or sign in" },
                { icon: Building2, title: "2. Add your club", text: "Save the club profile, officers, meeting details, and roster." },
                { icon: ListChecks, title: "3. Build the agenda", text: "Configure meeting information, roles, sessions, and timing." },
                { icon: Link2, title: "4. Save and share", text: "Save the finished agenda and copy its permanent sharing link." },
              ].map((step) => (
                <li key={step.title} className="rounded-lg bg-background/70 p-3">
                  <step.icon className="mb-2 size-4 text-muted-foreground" aria-hidden="true" />
                  <h3 className="text-xs font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.text}</p>
                  {step.link ? (
                    <Link href={step.link} className="mt-2 inline-block text-xs font-medium text-primary underline-offset-4 hover:underline">
                      {step.linkText}
                    </Link>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

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
    {showSignOutDialog ? (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm print:hidden"
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isSigningOut) setShowSignOutDialog(false)
        }}
      >
        <section
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="sign-out-title"
          aria-describedby="sign-out-description"
          className="w-full max-w-sm overflow-hidden rounded-xl border border-[#F2DF74]/40 bg-card shadow-2xl"
        >
          <div className="bg-gradient-to-r from-[#3B0104] to-[#781327] px-5 py-4 text-white">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <LogOut className="size-5" aria-hidden="true" />
                <h2 id="sign-out-title" className="text-lg font-semibold">Sign out</h2>
              </div>
              <button
                type="button"
                className="rounded-md p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
                onClick={() => setShowSignOutDialog(false)}
                disabled={isSigningOut}
                aria-label="Close sign out dialog"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="space-y-5 p-5">
            <p id="sign-out-description" className="text-sm text-muted-foreground">
              Are you sure you want to sign out of your account?
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSignOutDialog(false)}
                disabled={isSigningOut}
              >
                No
              </Button>
              <Button type="button" onClick={confirmSignOut} disabled={isSigningOut}>
                <LogOut className="size-4" aria-hidden="true" />
                {isSigningOut ? "Signing out…" : "Sign out"}
              </Button>
            </div>
          </div>
        </section>
      </div>
    ) : null}
    </>
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
