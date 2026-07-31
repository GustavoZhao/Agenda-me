"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type AgendaListItem = {
  id: string
  slug: string
  title: string
  meetingDate: string | null
  updatedAt: string
  canEdit: boolean
}

export default function MyAgendasPage() {
  const [query, setQuery] = useState("")
  const [items, setItems] = useState<AgendaListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const response = await fetch(`/api/agendas?q=${encodeURIComponent(query)}`)
        if (!response.ok) {
          setError("Failed to load your agendas. Please sign in first.")
          setLoading(false)
          return
        }
        const data = (await response.json()) as { items: AgendaListItem[] }
        setItems(data.items)
        setError(null)
      } catch {
        setError("Failed to load your agendas.")
      } finally {
        setLoading(false)
      }
    }

    const timer = window.setTimeout(load, 200)
    return () => window.clearTimeout(timer)
  }, [query])

  async function remove(slug: string) {
    const confirmed = window.confirm("Delete this agenda?")
    if (!confirmed) return

    const response = await fetch(`/api/agendas/${encodeURIComponent(slug)}`, { method: "DELETE" })
    if (!response.ok) {
      window.alert("Failed to delete agenda.")
      return
    }

    setItems((prev) => prev.filter((item) => item.slug !== slug))
  }

  const empty = useMemo(() => !loading && !error && items.length === 0, [items.length, loading, error])

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">My Agendas</h1>
            <p className="text-sm text-muted-foreground">Search, open, and delete your previously saved agendas.</p>
          </div>
          <Link href="/">
            <Button type="button" variant="outline" size="sm">
              Back to Editor
            </Button>
          </Link>
        </header>

        <div className="mb-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title or date"
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none ring-ring/40 transition focus:ring"
          />
        </div>

        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}

        {empty ? <p className="text-sm text-muted-foreground">No agendas found.</p> : null}

        <div className="space-y-2">
          {items.map((item) => (
            <article key={item.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-medium text-foreground">{item.title || "Meeting Agenda"}</h2>
                  <p className="text-xs text-muted-foreground">
                    Date: {item.meetingDate || "N/A"} · Updated: {new Date(item.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/agenda/${item.slug}`}>
                    <Button type="button" variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                  {item.canEdit ? (
                    <Link href={`/?slug=${encodeURIComponent(item.slug)}`}>
                      <Button type="button" size="sm">
                        Edit
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      disabled
                      title="You can view this agenda, but only its creator or a club editor can edit it."
                    >
                      Edit
                    </Button>
                  )}
                  <Button type="button" variant="outline" size="sm" onClick={() => remove(item.slug)}>
                    Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
