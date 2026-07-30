import type { AgendaSettings } from "@/lib/agenda"

export const MOBILE_AGENDA_EXPORT = {
  cssWidth: 400,
  scale: 3.2,
  pixelWidth: 1280,
} as const

export function hasExpectedMobileExportSize(canvas: Pick<HTMLCanvasElement, "width" | "height">) {
  return canvas.width === MOBILE_AGENDA_EXPORT.pixelWidth && canvas.height > 0
}

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

  const canvas = await html2canvas(agenda, {
    backgroundColor: getComputedStyle(agenda).backgroundColor,
    logging: false,
    scale: MOBILE_AGENDA_EXPORT.scale,
    useCORS: true,
    width: MOBILE_AGENDA_EXPORT.cssWidth,
    windowWidth: MOBILE_AGENDA_EXPORT.cssWidth,
    onclone: (clonedDocument) => {
      const clonedAgenda = clonedDocument.getElementById("agenda-sheet")
      if (!clonedAgenda) return

      clonedAgenda.dataset.exportLayout = "mobile"
      clonedAgenda.style.width = `${MOBILE_AGENDA_EXPORT.cssWidth}px`
      clonedAgenda.style.maxWidth = "none"
      clonedAgenda.style.margin = "0"

      const wrapper = clonedAgenda.parentElement
      if (wrapper) {
        wrapper.style.width = `${MOBILE_AGENDA_EXPORT.cssWidth}px`
        wrapper.style.maxWidth = "none"
        wrapper.style.margin = "0"
      }
    },
  })

  if (!hasExpectedMobileExportSize(canvas)) {
    throw new Error("The browser could not render the agenda at the expected mobile size.")
  }

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
