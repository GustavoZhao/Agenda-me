import { describe, expect, it } from "vitest"

import { makeAgendaPngFilename } from "./export-agenda"

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
})
