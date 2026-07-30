"use client"

import { useState } from "react"
import { Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { applyAgendaTemplateImport, type AgendaSettings } from "@/lib/agenda"

type Props = {
  settings: AgendaSettings
  onChange: (next: AgendaSettings) => void
}

export function SmartImport({ settings, onChange }: Props) {
  const [templateText, setTemplateText] = useState("")
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [pendingImport, setPendingImport] = useState<ReturnType<typeof applyAgendaTemplateImport> | null>(null)

  function handleAnalyze() {
    const pasted = templateText.trim()
    if (!pasted) {
      setPendingImport(null)
      setStatusMessage("Paste the role announcement first, then analyze it.")
      return
    }

    const result = applyAgendaTemplateImport(settings, pasted)
    if (result.matchedFields.length === 0) {
      setPendingImport(null)
      setStatusMessage("No recognizable meeting fields were found in that text.")
      return
    }

    setPendingImport(result)
    setStatusMessage(`Found ${result.matchedFields.join(", ")}. Review the preview below, then apply.`)
  }

  function handleApply() {
    if (!pendingImport) return
    onChange(pendingImport.settings)
    setStatusMessage(`Applied ${pendingImport.matchedFields.join(", ")}.`)
    setPendingImport(null)
  }

  function handleReset() {
    setTemplateText("")
    setStatusMessage(null)
    setPendingImport(null)
  }

  return (
    <section className="rounded-xl border border-primary/20 bg-card p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-card-foreground">Smart Import</h2>
        <p className="text-sm text-muted-foreground">
          Paste a role announcement or signup post here, then auto-fill the meeting date, time, and meeting roles.
        </p>
      </div>

      <label className="flex min-w-0 flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">Paste role template</span>
        <textarea
          className="min-h-40 resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/40"
          value={templateText}
          onChange={(event) => setTemplateText(event.target.value)}
          placeholder={"Paste text like:\nBook your role for our next meeting!\nJuly 11 | 19:30 - 21:05 (UTC+8)\nMeeting SAA: John Doe\n..."}
        />
        <span className="text-xs text-muted-foreground">
          The parser understands role lists, date/time lines, and meeting themes. Meeting SAA never changes the club officer record.
        </span>
      </label>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={handleAnalyze}>
          <Upload className="size-4" aria-hidden="true" />
          Analyze
        </Button>
        <Button type="button" size="sm" onClick={handleApply} disabled={!pendingImport}>
          Apply Changes
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={handleReset}>
          <X className="size-4" aria-hidden="true" />
          Clear
        </Button>
      </div>

      {statusMessage ? <p className="mt-3 text-sm text-muted-foreground">{statusMessage}</p> : null}

      {pendingImport ? (
        <div className="mt-4 rounded-lg border border-border bg-background/70 p-4">
          <h3 className="text-sm font-semibold text-foreground">Preview</h3>
          <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            {pendingImport.previewItems.map((item) => (
              <div key={`${item.label}-${item.value}`} className="rounded-md border border-border/70 bg-card px-3 py-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</dt>
                <dd className="mt-1 text-sm text-foreground">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </section>
  )
}
