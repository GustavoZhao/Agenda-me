"use client"

import { useState } from "react"
import { FileImage, Moon, PencilLine, Printer, SunMedium } from "lucide-react"

import type { AgendaSettings } from "@/lib/agenda"
import { exportAgendaAsPng } from "@/lib/export-agenda"
import { Button } from "@/components/ui/button"

type Props = {
  settings: AgendaSettings
  theme: "light" | "dark"
  onThemeToggle: () => void
  onEdit?: () => void
}

export function SharedAgendaActions({
  settings,
  theme,
  onThemeToggle,
  onEdit,
}: Props) {
  const [isExporting, setIsExporting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function exportAgenda() {
    setIsExporting(true)
    setMessage(null)

    try {
      await exportAgendaAsPng(settings)
      setMessage("Agenda PNG exported.")
    } catch (error) {
      console.error("Failed to export shared agenda:", error)
      setMessage("Failed to export the agenda image. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="print:hidden">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onThemeToggle}>
          {theme === "dark" ? (
            <SunMedium className="size-4" aria-hidden="true" />
          ) : (
            <Moon className="size-4" aria-hidden="true" />
          )}
          {theme === "dark" ? "Light" : "Dark"}
        </Button>
        <Button type="button" size="sm" onClick={() => window.print()}>
          <Printer className="size-4" aria-hidden="true" />
          Print
        </Button>
        <Button type="button" size="sm" onClick={exportAgenda} disabled={isExporting}>
          <FileImage className="size-4" aria-hidden="true" />
          {isExporting ? "Exporting…" : "Export"}
        </Button>
        {onEdit ? (
          <Button type="button" size="sm" onClick={onEdit}>
            <PencilLine className="size-4" aria-hidden="true" />
            Edit
          </Button>
        ) : null}
      </div>
      {message ? (
        <p
          className={`mt-2 text-right text-xs ${
            message.startsWith("Failed") ? "text-destructive" : "text-muted-foreground"
          }`}
          role="status"
        >
          {message}
        </p>
      ) : null}
    </div>
  )
}
