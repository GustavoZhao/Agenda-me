"use client"

import Link from "next/link"
import { FileImage, LogIn, LogOut, Moon, Printer, RotateCcw, Save, SunMedium, UserRound } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { truncateLabel } from "@/lib/display"

type ClubSummary = {
  role: "owner" | "admin" | "editor" | "viewer"
  club: {
    id: string
    name: string
  }
}

type Props = {
  activeClubId: string
  clubs: ClubSummary[]
  isAuthenticated: boolean
  memberName: string
  theme: "light" | "dark"
  onActiveClubChange: (clubId: string) => void
  onExport: () => void
  onPrint: () => void
  onReset: () => void
  onSave: () => void
  onSignOut: () => void
  onThemeToggle: () => void
  isExporting: boolean
}

export function AgendaToolbar({
  activeClubId,
  clubs,
  isAuthenticated,
  memberName,
  theme,
  onActiveClubChange,
  onExport,
  onPrint,
  onReset,
  onSave,
  onSignOut,
  onThemeToggle,
  isExporting,
}: Props) {
  return (
    <div className="flex w-full min-w-0 flex-wrap items-center gap-2 print:hidden xl:w-auto xl:justify-end">
      {isAuthenticated ? (
        <Link
          href="/profile"
          className="inline-flex h-9 max-w-full items-center gap-2 rounded-md border border-border bg-card px-3 text-sm text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title="Open personal profile"
        >
          <UserRound className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{memberName}</span>
        </Link>
      ) : null}

      {isAuthenticated && clubs.length > 0 ? (
        <select
          value={activeClubId}
          onChange={(event) => onActiveClubChange(event.target.value)}
          className="h-9 max-w-full min-w-0 rounded-md border border-border bg-background px-2 text-sm text-foreground sm:max-w-52"
          aria-label="Active club"
        >
          {clubs.map((item) => (
            <option key={item.club.id} value={item.club.id} title={item.club.name}>
              {truncateLabel(item.club.name)} ({item.role})
            </option>
          ))}
        </select>
      ) : null}

      {isAuthenticated ? (
        <>
          <Link href="/my-agendas"><Button type="button" variant="outline" size="sm">My Agendas</Button></Link>
          <Link href="/club-settings"><Button type="button" variant="outline" size="sm">Club Settings</Button></Link>
          <Link href="/roster"><Button type="button" variant="outline" size="sm">Roster</Button></Link>
        </>
      ) : null}

      {isAuthenticated ? (
        <Button type="button" variant="outline" size="sm" onClick={onSignOut}>
          <LogOut className="size-4" aria-hidden="true" />
          Sign out
        </Button>
      ) : (
        <Link href="/auth/signin" className={buttonVariants({ variant: "outline", size: "sm" })}>
          <LogIn className="size-4" aria-hidden="true" />
          Sign in / Sign up
        </Link>
      )}
      <Button type="button" variant="outline" size="sm" onClick={onThemeToggle}>
        {theme === "dark" ? <SunMedium className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
        {theme === "dark" ? "Light" : "Dark"}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onReset}>
        <RotateCcw className="size-4" aria-hidden="true" />
        Reset
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onSave}>
        <Save className="size-4" aria-hidden="true" />
        Save
      </Button>
      <Button type="button" size="sm" onClick={onPrint}>
        <Printer className="size-4" aria-hidden="true" />
        Print
      </Button>
      <Button type="button" size="sm" onClick={onExport} disabled={isExporting}>
        <FileImage className="size-4" aria-hidden="true" />
        {isExporting ? "Exporting…" : "Export"}
      </Button>
    </div>
  )
}
