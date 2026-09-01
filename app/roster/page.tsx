"use client"

import { ChangeEvent, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import { truncateLabel } from "@/lib/display"
import { Upload } from "lucide-react"

type ClubSummary = {
  role: "owner" | "admin" | "editor" | "viewer"
  club: {
    id: string
    name: string
  }
}

type RosterItem = {
  id: string
  name: string
  memberNumber: string | null
  credential: string | null
  email: string | null
  status: string | null
  currentPosition: string | null
  pathwaysEnrolled: string | null
}

type MemberDraft = Omit<RosterItem, "id">

const EMPTY_MEMBER: MemberDraft = {
  memberNumber: "",
  name: "",
  credential: "",
  email: "",
  status: "",
  currentPosition: "",
  pathwaysEnrolled: "",
}

export default function RosterPage() {
  const [clubs, setClubs] = useState<ClubSummary[]>([])
  const [activeClubId, setActiveClubId] = useState("")
  const [query, setQuery] = useState("")
  const [items, setItems] = useState<RosterItem[]>([])
  const [newMember, setNewMember] = useState<MemberDraft>(EMPTY_MEMBER)
  const [selectedFileName, setSelectedFileName] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [isLoadingRoster, setIsLoadingRoster] = useState(false)
  const [rosterError, setRosterError] = useState<string | null>(null)

  useEffect(() => {
    async function loadClubs() {
      const response = await fetch("/api/clubs")
      if (!response.ok) return
      const data = (await response.json()) as { items: ClubSummary[] }
      setClubs(data.items)

      const stored = window.localStorage.getItem("active-club-id")
      const selected = data.items.find((item) => item.club.id === stored)?.club.id ?? data.items[0]?.club.id ?? ""
      setActiveClubId(selected)
    }

    loadClubs()
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function loadRoster() {
      if (!activeClubId) return
      setIsLoadingRoster(true)
      setRosterError(null)

      try {
        const response = await fetch(
          `/api/clubs/${encodeURIComponent(activeClubId)}/roster?q=${encodeURIComponent(query)}`,
          { cache: "no-store", signal: controller.signal }
        )

        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string }
          throw new Error(data.error || "Failed to load the saved member roster.")
        }

        const data = (await response.json()) as { items: RosterItem[] }
        setItems(data.items)
        window.localStorage.setItem("active-club-id", activeClubId)
      } catch (error) {
        if (controller.signal.aborted) return
        setItems([])
        setRosterError(error instanceof Error ? error.message : "Failed to load the saved member roster.")
      } finally {
        if (!controller.signal.aborted) setIsLoadingRoster(false)
      }
    }

    const timer = window.setTimeout(loadRoster, 200)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [activeClubId, query])

  const canEdit = useMemo(() => {
    const role = clubs.find((item) => item.club.id === activeClubId)?.role
    return role === "owner" || role === "admin" || role === "editor"
  }, [activeClubId, clubs])

  async function addMember() {
    if (
      !activeClubId ||
      !newMember.memberNumber?.trim() ||
      !newMember.name.trim() ||
      !newMember.credential?.trim()
    ) {
      setMessage("Customer ID, Name, and Credentials are required.")
      return
    }

    const response = await fetch(`/api/clubs/${encodeURIComponent(activeClubId)}/roster`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMember),
    })

    if (!response.ok) {
      setMessage("Failed to add roster member.")
      return
    }

    const created = (await response.json()) as RosterItem
    setItems((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
    setNewMember(EMPTY_MEMBER)
    setMessage("Member added.")
  }

  async function removeMember(memberId: string) {
    if (!activeClubId) return

    const response = await fetch(`/api/clubs/${encodeURIComponent(activeClubId)}/roster/${encodeURIComponent(memberId)}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      setMessage("Failed to delete member.")
      return
    }

    setItems((prev) => prev.filter((item) => item.id !== memberId))
  }

  async function saveMember(member: RosterItem) {
    if (!activeClubId) return

    const response = await fetch(`/api/clubs/${encodeURIComponent(activeClubId)}/roster/${encodeURIComponent(member.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(member),
    })

    if (!response.ok) {
      setMessage("Failed to update member.")
      return
    }

    setMessage("Member updated.")
  }

  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    if (!activeClubId || !event.target.files?.[0]) return

    const text = await event.target.files[0].text()
    setSelectedFileName(event.target.files[0].name)
    const response = await fetch(`/api/clubs/${encodeURIComponent(activeClubId)}/roster`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        csv: text,
        replace: true,
      }),
    })

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string }
      setMessage(data.error || "Failed to import the roster file.")
      return
    }

    const result = (await response.json()) as { imported: number }
    setMessage(`Imported ${result.imported} roster rows.`)

    const refreshed = await fetch(`/api/clubs/${encodeURIComponent(activeClubId)}/roster`)
    if (refreshed.ok) {
      const data = (await refreshed.json()) as { items: RosterItem[] }
      setItems(data.items)
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Roster</h1>
            <p className="text-sm text-muted-foreground">Maintain each club roster and credential records.</p>
          </div>
          <Link href="/">
            <Button type="button" variant="outline" size="sm">Back to Editor</Button>
          </Link>
        </header>

        <section className="rounded-lg border border-border bg-card p-4 space-y-3">
          <label className="block text-sm font-medium text-foreground">Active Club</label>
          <select
            aria-label="Active club"
            value={activeClubId}
            onChange={(event) => setActiveClubId(event.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {clubs.map((item) => (
              <option key={item.club.id} value={item.club.id}>
                {truncateLabel(item.club.name)} ({item.role})
              </option>
            ))}
          </select>

          <div className="flex flex-wrap items-center gap-3">
            <label className={buttonVariants({ variant: "outline", size: "sm", className: !canEdit ? "pointer-events-none opacity-50" : "cursor-pointer" })}>
              <Upload className="size-4" aria-hidden="true" />
              Choose CSV File
              <input
                type="file"
                accept=".csv,.tsv,text/csv,text/tab-separated-values"
                onChange={importCsv}
                disabled={!canEdit}
                className="sr-only"
              />
            </label>
            <span className="text-xs text-muted-foreground">
              {selectedFileName || "No file selected"}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Club officers can download the membership roster from the Toastmasters website:
            Profile → Club Central → Membership Management → Export Excel/CSV. Upload the exported
            CSV file here to synchronize your club&apos;s member roster.
          </p>
        </section>

        <section className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Add Member</h2>
          <p className="text-xs text-muted-foreground"><span className="text-destructive">*</span> Required fields</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <MemberInput label="Customer ID" required value={newMember.memberNumber ?? ""} onChange={(memberNumber) => setNewMember((current) => ({ ...current, memberNumber }))} disabled={!canEdit} />
            <MemberInput label="Name" required value={newMember.name} onChange={(name) => setNewMember((current) => ({ ...current, name }))} disabled={!canEdit} />
            <MemberInput label="Credentials" required value={newMember.credential ?? ""} onChange={(credential) => setNewMember((current) => ({ ...current, credential }))} disabled={!canEdit} />
            <MemberInput label="Email" type="email" value={newMember.email ?? ""} onChange={(email) => setNewMember((current) => ({ ...current, email }))} disabled={!canEdit} />
            <MemberInput label="Status" value={newMember.status ?? ""} onChange={(status) => setNewMember((current) => ({ ...current, status }))} disabled={!canEdit} />
            <MemberInput label="Current Position" value={newMember.currentPosition ?? ""} onChange={(currentPosition) => setNewMember((current) => ({ ...current, currentPosition }))} disabled={!canEdit} />
            <MemberInput label="Pathways Enrolled" value={newMember.pathwaysEnrolled ?? ""} onChange={(pathwaysEnrolled) => setNewMember((current) => ({ ...current, pathwaysEnrolled }))} disabled={!canEdit} />
          </div>
          <Button
            type="button"
            onClick={addMember}
            disabled={!canEdit || !newMember.memberNumber?.trim() || !newMember.name.trim() || !newMember.credential?.trim()}
          >
            Add Member
          </Button>
        </section>

        <section className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">Members</h2>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              className="w-52 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            />
          </div>

          <div className="space-y-2">
            {isLoadingRoster ? (
              <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                Loading saved members…
              </p>
            ) : rosterError ? (
              <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
                {rosterError} Please refresh the page or try again later.
              </p>
            ) : items.length === 0 ? (
              <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                {query ? "No members match your search." : "No saved members were found for this club."}
              </p>
            ) : null}
            {items.map((item) => (
              <article
                key={item.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3 ${
                  item.status?.trim().toLowerCase() === "unpaidmember" ? "bg-muted/60 opacity-60 grayscale" : ""
                }`}
              >
                <div className="grid w-full gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {([
                    ["memberNumber", "Customer ID", true, "text"],
                    ["name", "Name", true, "text"],
                    ["credential", "Credentials", true, "text"],
                    ["email", "Email", false, "email"],
                    ["status", "Status", false, "text"],
                    ["currentPosition", "Current Position", false, "text"],
                    ["pathwaysEnrolled", "Pathways Enrolled", false, "text"],
                  ] as const).map(([key, label, required, type]) => (
                    <MemberInput
                      key={key}
                      label={label}
                      required={required}
                      type={type}
                      value={item[key] ?? ""}
                      onChange={(value) =>
                        setItems((current) =>
                          current.map((candidate) =>
                            candidate.id === item.id ? { ...candidate, [key]: value } : candidate
                          )
                        )
                      }
                      disabled={!canEdit}
                      compact
                    />
                  ))}
                </div>
                {canEdit ? (
                  <div className="flex items-center gap-2">
                    <Button type="button" size="sm" onClick={() => saveMember(item)}>
                      Save
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => removeMember(item.id)}>
                      Delete
                    </Button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </div>
    </main>
  )
}

function MemberInput({
  label,
  value,
  onChange,
  disabled,
  required = false,
  type = "text",
  compact = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  disabled: boolean
  required?: boolean
  type?: "text" | "email"
  compact?: boolean
}) {
  return (
    <label className="block min-w-0 text-xs text-muted-foreground">
      <span className="mb-1 block">
        {label}{required ? <span className="text-destructive"> *</span> : null}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder={label}
        className={`w-full rounded-md border border-border bg-background px-3 text-sm text-foreground disabled:opacity-60 ${
          compact ? "py-1.5" : "py-2"
        }`}
      />
    </label>
  )
}
