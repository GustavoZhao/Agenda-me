"use client"

import { ChangeEvent, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

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
}

export default function RosterPage() {
  const [clubs, setClubs] = useState<ClubSummary[]>([])
  const [activeClubId, setActiveClubId] = useState("")
  const [query, setQuery] = useState("")
  const [items, setItems] = useState<RosterItem[]>([])
  const [newName, setNewName] = useState("")
  const [newNumber, setNewNumber] = useState("")
  const [newCredential, setNewCredential] = useState("")
  const [message, setMessage] = useState<string | null>(null)

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
    async function loadRoster() {
      if (!activeClubId) return
      const response = await fetch(`/api/clubs/${encodeURIComponent(activeClubId)}/roster?q=${encodeURIComponent(query)}`)
      if (!response.ok) return
      const data = (await response.json()) as { items: RosterItem[] }
      setItems(data.items)
      window.localStorage.setItem("active-club-id", activeClubId)
    }

    const timer = window.setTimeout(loadRoster, 200)
    return () => window.clearTimeout(timer)
  }, [activeClubId, query])

  const canEdit = useMemo(() => {
    const role = clubs.find((item) => item.club.id === activeClubId)?.role
    return role === "owner" || role === "admin" || role === "editor"
  }, [activeClubId, clubs])

  async function addMember() {
    if (!activeClubId || !newName.trim()) return

    const response = await fetch(`/api/clubs/${encodeURIComponent(activeClubId)}/roster`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        memberNumber: newNumber,
        credential: newCredential,
      }),
    })

    if (!response.ok) {
      setMessage("Failed to add roster member.")
      return
    }

    const created = (await response.json()) as RosterItem
    setItems((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
    setNewName("")
    setNewNumber("")
    setNewCredential("")
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
    const response = await fetch(`/api/clubs/${encodeURIComponent(activeClubId)}/roster`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        csv: text,
        replace: false,
      }),
    })

    if (!response.ok) {
      setMessage("Failed to import CSV.")
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
            value={activeClubId}
            onChange={(event) => setActiveClubId(event.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {clubs.map((item) => (
              <option key={item.club.id} value={item.club.id}>
                {item.club.name} ({item.role})
              </option>
            ))}
          </select>

          <div className="flex flex-wrap items-center gap-2">
            <input type="file" accept=".csv,text/csv" onChange={importCsv} disabled={!canEdit} />
            <span className="text-xs text-muted-foreground">CSV columns: name,memberNumber,credential</span>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Add Member</h2>
          <div className="grid gap-2 sm:grid-cols-3">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" className="rounded-md border border-border bg-background px-3 py-2 text-sm" disabled={!canEdit} />
            <input value={newNumber} onChange={(e) => setNewNumber(e.target.value)} placeholder="Member Number" className="rounded-md border border-border bg-background px-3 py-2 text-sm" disabled={!canEdit} />
            <input value={newCredential} onChange={(e) => setNewCredential(e.target.value)} placeholder="Credential" className="rounded-md border border-border bg-background px-3 py-2 text-sm" disabled={!canEdit} />
          </div>
          <Button type="button" onClick={addMember} disabled={!canEdit}>Add Member</Button>
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
            {items.map((item) => (
              <article key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3">
                <div className="grid w-full gap-2 sm:grid-cols-3">
                  <input
                    value={item.name}
                    onChange={(event) =>
                      setItems((prev) =>
                        prev.map((candidate) =>
                          candidate.id === item.id ? { ...candidate, name: event.target.value } : candidate
                        )
                      )
                    }
                    className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                    disabled={!canEdit}
                    placeholder="Name"
                  />
                  <input
                    value={item.memberNumber ?? ""}
                    onChange={(event) =>
                      setItems((prev) =>
                        prev.map((candidate) =>
                          candidate.id === item.id ? { ...candidate, memberNumber: event.target.value } : candidate
                        )
                      )
                    }
                    className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                    disabled={!canEdit}
                    placeholder="Member Number"
                  />
                  <input
                    value={item.credential ?? ""}
                    onChange={(event) =>
                      setItems((prev) =>
                        prev.map((candidate) =>
                          candidate.id === item.id ? { ...candidate, credential: event.target.value } : candidate
                        )
                      )
                    }
                    className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                    disabled={!canEdit}
                    placeholder="Credential"
                  />
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
