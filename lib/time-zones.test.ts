import { describe, expect, it } from "vitest"

import {
  convertAgendaTimeToZone,
  formatTimeZoneOffset,
  TIME_ZONE_OPTIONS,
} from "./time-zones"

describe("agenda time zones", () => {
  it("includes Beijing, Malaysia, and Indonesia in the display list", () => {
    const labels = TIME_ZONE_OPTIONS.map((option) => option.label)

    expect(labels).toContain("China (Beijing)")
    expect(labels).toContain("Malaysia (Kuala Lumpur)")
    expect(labels).toContain("Indonesia (Jakarta)")
    expect(labels).toContain("Indonesia (Makassar / Bali)")
  })

  it("converts from the meeting timezone instead of assuming China time", () => {
    expect(
      convertAgendaTimeToZone(
        "19:30",
        "2026-07-30",
        "Asia/Shanghai",
        "Asia/Jakarta"
      )
    ).toBe("18:30")

    expect(
      convertAgendaTimeToZone(
        "19:30",
        "2026-07-30",
        "Asia/Jakarta",
        "Asia/Shanghai"
      )
    ).toBe("20:30")
  })

  it("handles daylight saving time and half-hour UTC offsets", () => {
    expect(
      convertAgendaTimeToZone(
        "07:30",
        "2026-07-30",
        "America/New_York",
        "Asia/Shanghai"
      )
    ).toBe("19:30")

    expect(
      formatTimeZoneOffset(
        "Asia/Kolkata",
        "2026-07-30",
        "19:30",
        "Asia/Shanghai"
      )
    ).toBe("UTC+5:30")
  })
})
