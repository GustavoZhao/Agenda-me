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

type ClubDetail = {
  id: string
  name: string
  clubNumber: string | null
  area: string | null
  division: string | null
  district: string | null
  timezone: string | null
  wechatQrUrl: string | null
  whatsappQrUrl: string | null
  memberships: Array<{
    id: string
    role: "owner" | "admin" | "editor" | "viewer"
    user: {
      id: string
      name: string | null
      email: string | null
      image: string | null
    }
  }>
}

export default function ClubSettingsPage() {
  const [clubs, setClubs] = useState<ClubSummary[]>([])
  const [activeClubId, setActiveClubId] = useState<string>("")
  const [club, setClub] = useState<ClubDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    async function loadClubs() {
      try {
        const response = await fetch("/api/clubs")
        if (!response.ok) return
        const data = (await response.json()) as { items: ClubSummary[] }
        setClubs(data.items)

        const stored = window.localStorage.getItem("active-club-id")
        const selected = data.items.find((item) => item.club.id === stored)?.club.id ?? data.items[0]?.club.id ?? ""
        setActiveClubId(selected)
      } finally {
        setLoading(false)
      }
    }

    loadClubs()
  }, [])

  useEffect(() => {
    async function loadClub() {
      if (!activeClubId) return
      const response = await fetch(`/api/clubs/${encodeURIComponent(activeClubId)}`)
      if (!response.ok) return
      const data = (await response.json()) as { club: ClubDetail }
      setClub(data.club)
      window.localStorage.setItem("active-club-id", activeClubId)
    }

    loadClub()
  }, [activeClubId])

  const canEdit = useMemo(() => {
    const role = clubs.find((item) => item.club.id === activeClubId)?.role
    return role === "owner" || role === "admin"
  }, [activeClubId, clubs])

  function patchClub(partial: Partial<ClubDetail>) {
    setClub((prev) => (prev ? { ...prev, ...partial } : prev))
  }

  async function save() {
    if (!club || !canEdit) return
    setSaving(true)
    setMessage(null)

    const response = await fetch(`/api/clubs/${encodeURIComponent(club.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(club),
    })

    setSaving(false)
    if (!response.ok) {
      setMessage("Failed to save club settings.")
      return
    }

    setMessage("Club settings updated.")
  }

  async function upload(kind: "wechat_qr" | "whatsapp_qr", event: ChangeEvent<HTMLInputElement>) {
    if (!club || !event.target.files?.[0]) return

    const file = event.target.files[0]
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result ?? ""))
      reader.onerror = () => reject(new Error("read failed"))
      reader.readAsDataURL(file)
    })

    const response = await fetch(`/api/clubs/${encodeURIComponent(club.id)}/assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, fileName: file.name, dataUrl }),
    })

    if (!response.ok) {
      setMessage("Failed to upload QR image.")
      return
    }

    const data = (await response.json()) as { url: string }
    if (kind === "wechat_qr") patchClub({ wechatQrUrl: data.url })
    if (kind === "whatsapp_qr") patchClub({ whatsappQrUrl: data.url })
    setMessage("QR image uploaded.")
  }

  async function updateMemberRole(membershipId: string, role: "owner" | "admin" | "editor" | "viewer") {
    if (!club || !canEdit) return

    const response = await fetch(
      `/api/clubs/${encodeURIComponent(club.id)}/memberships/${encodeURIComponent(membershipId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      }
    )

    if (!response.ok) {
      setMessage("Failed to update member role.")
      return
    }

    setClub((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        memberships: prev.memberships.map((member) =>
          member.id === membershipId ? { ...member, role } : member
        ),
      }
    })
    setMessage("Member role updated.")
  }

  if (loading) {
    return <main className="min-h-screen bg-background px-4 py-6">Loading...</main>
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Club Settings</h1>
            <p className="text-sm text-muted-foreground">Manage club profile fields and QR code assets per club.</p>
          </div>
          <Link href="/">
            <Button type="button" variant="outline" size="sm">Back to Editor</Button>
          </Link>
        </header>

        <section className="rounded-lg border border-border bg-card p-4">
          <label className="mb-2 block text-sm font-medium text-foreground">Active Club</label>
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
        </section>

        {club ? (
          <section className="rounded-lg border border-border bg-card p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Club Name" value={club.name ?? ""} onChange={(value) => patchClub({ name: value })} disabled={!canEdit} />
              <Field label="Club Number" value={club.clubNumber ?? ""} onChange={(value) => patchClub({ clubNumber: value })} disabled={!canEdit} />
              <Field label="Area" value={club.area ?? ""} onChange={(value) => patchClub({ area: value })} disabled={!canEdit} />
              <Field label="Division" value={club.division ?? ""} onChange={(value) => patchClub({ division: value })} disabled={!canEdit} />
              <Field label="District" value={club.district ?? ""} onChange={(value) => patchClub({ district: value })} disabled={!canEdit} />
              <Field label="Timezone" value={club.timezone ?? ""} onChange={(value) => patchClub({ timezone: value })} disabled={!canEdit} />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <QrUploader
                label="WeChat QR"
                previewUrl={club.wechatQrUrl}
                onChange={(event) => upload("wechat_qr", event)}
                disabled={!canEdit}
              />
              <QrUploader
                label="WhatsApp QR"
                previewUrl={club.whatsappQrUrl}
                onChange={(event) => upload("whatsapp_qr", event)}
                disabled={!canEdit}
              />
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Button type="button" onClick={save} disabled={!canEdit || saving}>
                {saving ? "Saving..." : "Save Club Settings"}
              </Button>
              {message ? <span className="text-sm text-muted-foreground">{message}</span> : null}
            </div>

            <div className="mt-6">
              <h2 className="mb-2 text-sm font-semibold text-foreground">Member Roles</h2>
              <div className="space-y-2">
                {club.memberships.map((member) => (
                  <article key={member.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{member.user.name || "Unnamed User"}</p>
                      <p className="text-xs text-muted-foreground">{member.user.email || "No email"}</p>
                    </div>
                    <select
                      value={member.role}
                      onChange={(event) =>
                        updateMemberRole(
                          member.id,
                          event.target.value as "owner" | "admin" | "editor" | "viewer"
                        )
                      }
                      disabled={!canEdit}
                      className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                    >
                      <option value="owner">owner</option>
                      <option value="admin">admin</option>
                      <option value="editor">editor</option>
                      <option value="viewer">viewer</option>
                    </select>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}

function Field({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  disabled: boolean
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground disabled:opacity-60"
      />
    </label>
  )
}

function QrUploader({
  label,
  previewUrl,
  onChange,
  disabled,
}: {
  label: string
  previewUrl: string | null
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  disabled: boolean
}) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="mb-2 text-sm font-medium text-foreground">{label}</p>
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt={`${label} preview`} className="mb-2 h-28 w-28 rounded border border-border object-contain" />
      ) : (
        <p className="mb-2 text-xs text-muted-foreground">No image uploaded yet.</p>
      )}
      <input type="file" accept="image/*" onChange={onChange} disabled={disabled} />
    </div>
  )
}
