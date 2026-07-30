"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, Mail, MapPin, Pencil, UserRound, Video } from "lucide-react"

import { Button } from "@/components/ui/button"

type Profile = {
  name: string
  email: string
}

type ClubItem = {
  role: "owner" | "admin" | "editor" | "viewer"
  club: {
    id: string
    name: string
    slogan: string | null
    clubNumber: string | null
    meetingType: "in_person" | "online" | "hybrid"
    inPersonAddress: string | null
    onlinePlatform: string | null
  }
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [name, setName] = useState("")
  const [clubs, setClubs] = useState<ClubItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [profileResponse, clubsResponse] = await Promise.all([
          fetch("/api/me"),
          fetch("/api/clubs"),
        ])

        if (profileResponse.status === 401 || clubsResponse.status === 401) {
          router.replace("/auth/signin")
          return
        }

        const profileData = (await profileResponse.json()) as {
          authenticated: boolean
          user?: { name?: string | null; email?: string | null }
        }
        const clubsData = (await clubsResponse.json()) as { items?: ClubItem[] }

        if (!profileData.authenticated) {
          router.replace("/auth/signin")
          return
        }

        const nextProfile = {
          name: profileData.user?.name?.trim() || "Member",
          email: profileData.user?.email?.trim() || "",
        }
        setProfile(nextProfile)
        setName(nextProfile.name)
        setClubs(clubsData.items ?? [])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [router])

  async function saveProfile() {
    const nextName = name.trim()
    if (!nextName) {
      setMessage("Please enter a nickname.")
      return
    }

    setSaving(true)
    setMessage(null)
    const response = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nextName }),
    })
    setSaving(false)

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string }
      setMessage(data.error || "Failed to update profile.")
      return
    }

    setProfile((current) => current ? { ...current, name: nextName } : current)
    setMessage("Profile updated.")
  }

  function editClub(clubId: string) {
    window.localStorage.setItem("active-club-id", clubId)
    router.push("/club-settings")
  }

  if (loading) {
    return <main className="min-h-screen bg-background px-4 py-8 text-foreground">Loading profile…</main>
  }

  if (!profile) return null

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
              <UserRound className="size-6 text-primary" aria-hidden="true" />
              Personal Profile
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage your nickname and club information.</p>
          </div>
          <Link href="/">
            <Button type="button" variant="outline">Back to Editor</Button>
          </Link>
        </header>

        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="bg-gradient-to-r from-[#3B0104] to-[#781327] px-5 py-4 text-white">
            <h2 className="font-semibold">Account Information</h2>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1.5 block font-medium text-foreground">Nickname</span>
              <input
                value={name}
                maxLength={80}
                onChange={(event) => setName(event.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-foreground"
              />
            </label>
            <div className="text-sm">
              <span className="mb-1.5 block font-medium text-foreground">Email</span>
              <div className="flex h-10 items-center gap-2 rounded-md border border-border bg-muted/40 px-3 text-muted-foreground">
                <Mail className="size-4" aria-hidden="true" />
                <span className="truncate">{profile.email || "No email"}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <Button type="button" onClick={saveProfile} disabled={saving || name.trim() === profile.name}>
                {saving ? "Saving…" : "Save Profile"}
              </Button>
              {message ? <span className="text-sm text-muted-foreground">{message}</span> : null}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">My Clubs</h2>
            <p className="text-sm text-muted-foreground">View your recorded club details or open the complete editor.</p>
          </div>

          {clubs.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {clubs.map(({ club, role }) => (
                <article key={club.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-foreground">{club.name}</h3>
                      <p className="mt-1 text-sm italic text-muted-foreground">{club.slogan || "No slogan entered"}</p>
                    </div>
                    <span className="rounded-full bg-secondary px-2 py-1 text-xs font-medium capitalize text-secondary-foreground">
                      {role}
                    </span>
                  </div>
                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Building2 className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <dt className="text-muted-foreground">Club number:</dt>
                      <dd className="text-foreground">{club.clubNumber || "Not entered"}</dd>
                    </div>
                    <div className="flex items-center gap-2">
                      {club.meetingType === "in_person" ? (
                        <MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      ) : (
                        <Video className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      )}
                      <dt className="text-muted-foreground">Meeting:</dt>
                      <dd className="truncate text-foreground">
                        {club.meetingType === "in_person"
                          ? club.inPersonAddress || "In-person"
                          : club.onlinePlatform || (club.meetingType === "hybrid" ? "Hybrid" : "Online")}
                      </dd>
                    </div>
                  </dl>
                  <Button type="button" variant="outline" className="mt-5 w-full" onClick={() => editClub(club.id)}>
                    <Pencil className="size-4" aria-hidden="true" />
                    View or edit club information
                  </Button>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
              No clubs have been added to this account yet.
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
