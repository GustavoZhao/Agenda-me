import { describe, expect, it } from "vitest"

import {
  hasExpectedMobileExportSize,
  makeAgendaPngFilename,
  MOBILE_AGENDA_EXPORT,
  revealExportOnlyContent,
} from "./export-agenda"

describe("makeAgendaPngFilename", () => {
  it("includes the meeting title and date", () => {
    expect(makeAgendaPngFilename({
      meetingTitle: "Regular Meeting",
      meetingDate: "2026-07-30",
    })).toBe("Regular-Meeting-2026-07-30.png")
  })

  it("removes characters that are unsafe in filenames", () => {
    expect(makeAgendaPngFilename({
      meetingTitle: 'Club: Meeting / "Special"',
      meetingDate: "",
    })).toBe("Club-Meeting-Special.png")
  })

  it("exports a high-density image designed at a readable mobile width", () => {
    expect(MOBILE_AGENDA_EXPORT.cssWidth).toBe(400)
    expect(MOBILE_AGENDA_EXPORT.scale).toBe(3.2)
    expect(MOBILE_AGENDA_EXPORT.cssWidth * MOBILE_AGENDA_EXPORT.scale).toBe(
      MOBILE_AGENDA_EXPORT.pixelWidth
    )
    expect(hasExpectedMobileExportSize({ width: 1280, height: 4800 })).toBe(true)
    expect(hasExpectedMobileExportSize({ width: 1170, height: 4800 })).toBe(false)
    expect(hasExpectedMobileExportSize({ width: 1280, height: 0 })).toBe(false)
  })

  it("forces export-only text to be renderable in the cloned document", () => {
    const elements = new Map([
      [".agenda-export-session-stack", makeHiddenExportElement()],
      [".agenda-export-word", makeHiddenExportElement()],
      [".agenda-export-timezone", makeHiddenExportElement()],
    ])
    const clonedAgenda = {
      querySelectorAll: (selector: string) => [elements.get(selector)],
    } as unknown as HTMLElement

    revealExportOnlyContent(clonedAgenda)

    expect(elements.get(".agenda-export-session-stack")?.display).toBe("flex")
    expect(elements.get(".agenda-export-word")?.display).toBe("block")
    expect(elements.get(".agenda-export-timezone")?.display).toBe("inline")
    for (const element of elements.values()) {
      expect(element.hiddenRemoved).toBe(true)
      expect(element.priority).toBe("important")
    }
  })
})

function makeHiddenExportElement() {
  const element = {
    display: "none",
    hiddenRemoved: false,
    priority: "",
    classList: {
      remove: (className: string) => {
        if (className === "hidden") element.hiddenRemoved = true
      },
    },
    style: {
      setProperty: (_name: string, value: string, priority: string) => {
        element.display = value
        element.priority = priority
      },
    },
  }
  return element
}
