"use client"

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react"
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
  const [creating, setCreating] = useState(false)
  const [newClubName, setNewClubName] = useState("")
  const [notesTitleType, setNotesTitleType] = useState<"default" | "custom">("default")
  const [message, setMessage] = useState<string | null>(null)
  const notesRef = useRef<HTMLTextAreaElement | null>(null)

  async function loadClubs(preferredClubId?: string) {
    try {
      const response = await fetch("/api/clubs")
      if (!response.ok) return

      const data = (await response.json()) as { items: ClubSummary[] }
      setClubs(data.items)

      const stored = window.localStorage.getItem("active-club-id")
      const selected =
        data.items.find((item) => item.club.id === preferredClubId)?.club.id ??
        data.items.find((item) => item.club.id === stored)?.club.id ??
        data.items[0]?.club.id ??
        ""
      setActiveClubId(selected)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClubs()
  }, [])

  useEffect(() => {
    async function loadClub() {
      if (!activeClubId) return
      const response = await fetch(`/api/clubs/${encodeURIComponent(activeClubId)}`)
      if (!response.ok) return
      const data = (await response.json()) as { club: ClubDetail }
      setClub(data.club)
      const title = data.club.participantNotesTitle?.trim() || ""
      setNotesTitleType(title && title !== "How to Become a Member" ? "custom" : "default")
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

    if ((club.meetingType === "in_person" || club.meetingType === "hybrid") && !club.inPersonAddress?.trim()) {
      setMessage("In-person address is required for In-person or Hybrid meetings.")
      return
    }

    if (club.meetingType === "online" || club.meetingType === "hybrid") {
      if (!club.onlinePlatform?.trim() || !club.onlineMeetingId?.trim() || !club.onlinePasscode?.trim()) {
        setMessage("Online platform, meeting ID, and passcode are required for Online or Hybrid meetings.")
        return
      }
    }

    if (notesTitleType === "custom" && !club.participantNotesTitle?.trim()) {
      setMessage("Please provide a custom title for participant notes.")
      return
    }

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

  function applyNotesFormatting(action: "bold" | "italic" | "ol" | "ul") {
    if (!club) return

    const textarea = notesRef.current
    if (!textarea) return

    const fullText = club.participantNotesBody ?? ""
    const start = textarea.selectionStart ?? 0
    const end = textarea.selectionEnd ?? 0
    const selected = fullText.slice(start, end)

    const fallbackLineStart = fullText.lastIndexOf("\n", start - 1) + 1
    const fallbackLineEndRaw = fullText.indexOf("\n", end)
    const fallbackLineEnd = fallbackLineEndRaw === -1 ? fullText.length : fallbackLineEndRaw
    const hasSelection = start !== end

    const replaceStart = hasSelection ? start : fallbackLineStart
    const replaceEnd = hasSelection ? end : fallbackLineEnd
    const target = fullText.slice(replaceStart, replaceEnd)

    let formatted = target
    if (action === "bold") {
      formatted = `**${target || "text"}**`
    } else if (action === "italic") {
      formatted = `*${target || "text"}*`
    } else if (action === "ol") {
      const lines = (target || "List item").split("\n")
      formatted = lines
        .map((line, index) => `${index + 1}. ${line.replace(/^\s*(?:\d+\.\s+|[-*]\s+)?/, "")}`)
        .join("\n")
    } else if (action === "ul") {
      const lines = (target || "List item").split("\n")
      formatted = lines
        .map((line) => `- ${line.replace(/^\s*(?:\d+\.\s+|[-*]\s+)?/, "")}`)
        .join("\n")
    }

    const nextText = `${fullText.slice(0, replaceStart)}${formatted}${fullText.slice(replaceEnd)}`
    patchClub({ participantNotesBody: nextText })

    requestAnimationFrame(() => {
      textarea.focus()
      const cursor = replaceStart + formatted.length
      textarea.setSelectionRange(cursor, cursor)
    })
  }

  async function createClub() {
    const name = newClubName.trim()
    if (!name) {
      setMessage("Please enter a club name.")
      return
    }

    setCreating(true)
    setMessage(null)

    const response = await fetch("/api/clubs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })

    if (!response.ok) {
      setCreating(false)
      setMessage("Failed to create club.")
      return
    }

    const data = (await response.json()) as { id: string }
    setNewClubName("")
    await loadClubs(data.id)
    setCreating(false)
    setMessage("Club created. You can now edit its profile and upload QR codes.")
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

          <div className="mt-4 border-t border-border pt-4">
            <label className="mb-2 block text-sm font-medium text-foreground">Create New Club</label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={newClubName}
                onChange={(event) => setNewClubName(event.target.value)}
                placeholder="New club name"
                className="h-9 min-w-56 flex-1 rounded-md border border-border bg-background px-3 text-sm text-foreground"
              />
              <Button type="button" onClick={createClub} disabled={creating}>
                {creating ? "Creating..." : "Create Club"}
              </Button>
            </div>
          </div>
        </section>

        {club ? (
          <section className="rounded-lg border border-border bg-card p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Club Name" value={club.name ?? ""} onChange={(value) => patchClub({ name: value })} disabled={!canEdit} />
              <Field label="Club Slogan" value={club.slogan ?? ""} onChange={(value) => patchClub({ slogan: value })} disabled={!canEdit} />
              <SelectField
                label="Meeting Type"
                value={club.meetingType}
                onChange={(value) => patchClub({ meetingType: value as "in_person" | "online" | "hybrid" })}
                disabled={!canEdit}
                options={[
                  { value: "in_person", label: "In-person" },
                  { value: "online", label: "Online" },
                  { value: "hybrid", label: "Hybrid" },
                ]}
              />
              <Field label="Club Number" value={club.clubNumber ?? ""} onChange={(value) => patchClub({ clubNumber: value })} disabled={!canEdit} />
              <Field label="Area" value={club.area ?? ""} onChange={(value) => patchClub({ area: value })} disabled={!canEdit} />
              <Field label="Division" value={club.division ?? ""} onChange={(value) => patchClub({ division: value })} disabled={!canEdit} />
              <Field label="District" value={club.district ?? ""} onChange={(value) => patchClub({ district: value })} disabled={!canEdit} />
              <Field label="Timezone" value={club.timezone ?? ""} onChange={(value) => patchClub({ timezone: value })} disabled={!canEdit} />
            </div>

            {club.meetingType === "in_person" || club.meetingType === "hybrid" ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-1">
                <Field
                  label="In-person Address"
                  value={club.inPersonAddress ?? ""}
                  onChange={(value) => patchClub({ inPersonAddress: value })}
                  disabled={!canEdit}
                />
              </div>
            ) : null}

            {club.meetingType === "online" || club.meetingType === "hybrid" ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Field
                  label="Online Platform"
                  value={club.onlinePlatform ?? ""}
                  onChange={(value) => patchClub({ onlinePlatform: value })}
                  disabled={!canEdit}
                />
                <Field
                  label="Online Meeting ID"
                  value={club.onlineMeetingId ?? ""}
                  onChange={(value) => patchClub({ onlineMeetingId: value })}
                  disabled={!canEdit}
                />
                <Field
                  label="Online Passcode"
                  value={club.onlinePasscode ?? ""}
                  onChange={(value) => patchClub({ onlinePasscode: value })}
                  disabled={!canEdit}
                />
              </div>
            ) : null}

            <div className="mt-6 rounded-md border border-border p-4">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Executive Committee</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="President" value={club.president ?? ""} onChange={(value) => patchClub({ president: value })} disabled={!canEdit} />
                <Field label="VPE" value={club.vpe ?? ""} onChange={(value) => patchClub({ vpe: value })} disabled={!canEdit} />
                <Field label="VPM" value={club.vpm ?? ""} onChange={(value) => patchClub({ vpm: value })} disabled={!canEdit} />
                <Field label="VPPR" value={club.vppr ?? ""} onChange={(value) => patchClub({ vppr: value })} disabled={!canEdit} />
                <Field label="Secretary" value={club.secretary ?? ""} onChange={(value) => patchClub({ secretary: value })} disabled={!canEdit} />
                <Field label="Treasurer" value={club.treasurer ?? ""} onChange={(value) => patchClub({ treasurer: value })} disabled={!canEdit} />
                <Field label="SAA (Zoom Master)" value={club.saa ?? ""} onChange={(value) => patchClub({ saa: value })} disabled={!canEdit} />
                <Field label="IPP" value={club.ipp ?? ""} onChange={(value) => patchClub({ ipp: value })} disabled={!canEdit} />
                <Field label="Club Mentors" value={club.mentors ?? ""} onChange={(value) => patchClub({ mentors: value })} disabled={!canEdit} />
                <Field label="Club Sponsors" value={club.sponsors ?? ""} onChange={(value) => patchClub({ sponsors: value })} disabled={!canEdit} />
                <Field label="Club Advisor" value={club.advisor ?? ""} onChange={(value) => patchClub({ advisor: value })} disabled={!canEdit} />
              </div>
            </div>

            <div className="mt-6 rounded-md border border-border p-4">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Notes for Participants</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField
                  label="Notes Title"
                  value={notesTitleType}
                  onChange={(value) => {
                    const mode = value as "default" | "custom"
                    setNotesTitleType(mode)
                    if (mode === "default") {
                      patchClub({ participantNotesTitle: "How to Become a Member" })
                    } else if ((club.participantNotesTitle ?? "").trim() === "How to Become a Member") {
                      patchClub({ participantNotesTitle: "" })
                    }
                  }}
                  disabled={!canEdit}
                  options={[
                    { value: "default", label: "How to Become a Member" },
                    { value: "custom", label: "Custom" },
                  ]}
                />

                {notesTitleType === "custom" ? (
                  <Field
                    label="Custom Notes Title"
                    value={club.participantNotesTitle ?? ""}
                    onChange={(value) => patchClub({ participantNotesTitle: value })}
                    disabled={!canEdit}
                  />
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => applyNotesFormatting("bold")} disabled={!canEdit}>Bold</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => applyNotesFormatting("italic")} disabled={!canEdit}>Italic</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => applyNotesFormatting("ol")} disabled={!canEdit}>Numbered List</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => applyNotesFormatting("ul")} disabled={!canEdit}>Bulleted List</Button>
              </div>

              <label className="mt-3 block text-sm">
                <span className="mb-1 block text-muted-foreground">Notes Content</span>
                <textarea
                  ref={notesRef}
                  value={club.participantNotesBody ?? ""}
                  onChange={(event) => patchClub({ participantNotesBody: event.target.value })}
                  disabled={!canEdit}
                  className="min-h-36 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground disabled:opacity-60"
                />
              </label>
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

            <div className="mt-3">
              <label className="block text-sm">
                <span className="mb-1 block text-muted-foreground">QR Contact Note</span>
                <textarea
                  value={club.vpmContactNote ?? ""}
                  onChange={(event) => patchClub({ vpmContactNote: event.target.value })}
                  disabled={!canEdit}
                  className="min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground disabled:opacity-60"
                />
              </label>
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

function SelectField({
  label,
  value,
  onChange,
  disabled,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  disabled: boolean
  options: Array<{ value: string; label: string }>
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground disabled:opacity-60"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
