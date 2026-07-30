import { describe, expect, it } from "vitest"

import {
  hasExpectedMobileExportSize,
  makeAgendaPngFilename,
  MOBILE_AGENDA_EXPORT,
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
})
