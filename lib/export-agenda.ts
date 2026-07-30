import type { AgendaSettings } from "@/lib/agenda"

const EXPORT_WIDTH = 1080

function sanitizeFilenamePart(value: string): string {
  return value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export function makeAgendaPngFilename(settings: Pick<AgendaSettings, "meetingTitle" | "meetingDate">): string {
  const title = sanitizeFilenamePart(settings.meetingTitle) || "toastmasters-agenda"
  const date = sanitizeFilenamePart(settings.meetingDate)
  return `${title}${date ? `-${date}` : ""}.png`
}

export async function exportAgendaAsPng(settings: AgendaSettings): Promise<void> {
  const agenda = document.getElementById("agenda-sheet")
  if (!(agenda instanceof HTMLElement)) {
    throw new Error("Agenda preview is unavailable.")
  }

  await document.fonts.ready
  const { default: html2canvas } = await import("html2canvas-pro")

  const elementWidth = Math.max(1, agenda.getBoundingClientRect().width)
  const scale = Math.min(3, Math.max(1, EXPORT_WIDTH / elementWidth))
  const canvas = await html2canvas(agenda, {
    backgroundColor: getComputedStyle(agenda).backgroundColor,
    logging: false,
    scale,
    useCORS: true,
  })

  const filename = makeAgendaPngFilename(settings)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result)
      else reject(new Error("The browser could not create the PNG image."))
    }, "image/png")
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}
