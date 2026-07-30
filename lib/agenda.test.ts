import { describe, expect, it } from "vitest"

import {
  applyAgendaTemplateImport,
  BREAK_ACTIVITY,
  computeSchedule,
  createAgendaTemplateSessions,
  getIndividualEvaluationLabel,
  DEFAULT_SETTINGS,
  getSectionRoleLabel,
  getSectionRowLabel,
  normalizeSettings,
  setMeetingSaa,
} from "./agenda"

describe("anonymous agenda defaults", () => {
  it("uses generic sample club content without BRICS-specific data or QR assets", () => {
    expect(DEFAULT_SETTINGS.clubInfo.clubName).toBe("Sample Toastmasters Club")
    expect(DEFAULT_SETTINGS.clubInfo.slogan).toBe("Your club slogan goes here")
    expect(DEFAULT_SETTINGS.clubInfo.clubNumber).toBe("00000000")
    expect(DEFAULT_SETTINGS.clubInfo.vpmWechatQr).toBe("")
    expect(DEFAULT_SETTINGS.clubInfo.vpmWhatsappQr).toBe("")
    expect(DEFAULT_SETTINGS.meetingTimeZone).toBe("Asia/Shanghai")
    expect(JSON.stringify(DEFAULT_SETTINGS)).not.toContain("BRICS")
  })

  it("keeps the meeting SAA separate from the club officer SAA", () => {
    const result = applyAgendaTemplateImport(
      normalizeSettings(DEFAULT_SETTINGS),
      "Meeting SAA: Alex Smith",
    )

    expect(result.settings.meetingSaa).toBe("Alex Smith")
    expect(result.settings.clubInfo.saa).toBe("John Doe")
    expect(result.settings.sessions.find((session) => session.activity === BREAK_ACTIVITY)?.presenter).toBe("Alex Smith")
  })

  it("assigns Welcome and Break to the meeting SAA", () => {
    const settings = setMeetingSaa(normalizeSettings(DEFAULT_SETTINGS), "Taylor Lee")
    const schedule = computeSchedule(settings)

    expect(schedule.rows.find((row) => row.activity === "Welcome")?.presenter).toBe("Taylor Lee")
    expect(settings.sessions.find((session) => session.activity === BREAK_ACTIVITY)?.presenter).toBe("Taylor Lee")
  })

  it("shows Guest Talk as the break title and Meeting SAA as its presenter", () => {
    const schedule = computeSchedule(normalizeSettings(DEFAULT_SETTINGS))
    const breakRow = schedule.rows.find((row) => row.activity === BREAK_ACTIVITY)

    expect(breakRow).toBeDefined()
    expect(getSectionRowLabel(breakRow!, "break")).toBe("Guest Talk")
    expect(getSectionRoleLabel(breakRow!, "break")).toBe("Meeting SAA")
  })
})

describe("meeting templates", () => {
  it("creates a standard meeting with three linked speech evaluations", () => {
    const sessions = createAgendaTemplateSessions("standard")
    const speeches = sessions.filter((session) => session.activity === "Prepared Speech")
    const evaluations = sessions.filter((session) => session.activity === "Individual Evaluation")

    expect(speeches).toHaveLength(3)
    expect(evaluations.map((session) => session.evaluatedSessionId)).toEqual(
      speeches.map((session) => session.id)
    )
    expect(sessions.some((session) => session.activity === "Table Topics")).toBe(true)
  })

  it("creates the requested Book Club and Speechathon speech counts", () => {
    const bookClub = createAgendaTemplateSessions("book-club")
    const speechathon = createAgendaTemplateSessions("speechathon")

    expect(bookClub.filter((session) => session.activity === "Prepared Speech")).toHaveLength(2)
    expect(bookClub.some((session) => session.activity === "Book Club Discussion")).toBe(true)
    expect(speechathon.filter((session) => session.activity === "Prepared Speech")).toHaveLength(5)
    expect(speechathon.filter((session) => session.activity === "Individual Evaluation")).toHaveLength(5)
  })

  it("describes the speaker linked to an individual evaluation", () => {
    const sessions = createAgendaTemplateSessions("standard")
    const speech = sessions.find((session) => session.activity === "Prepared Speech")!
    const evaluation = sessions.find(
      (session) =>
        session.activity === "Individual Evaluation" &&
        session.evaluatedSessionId === speech.id
    )!

    speech.presenter = "Alex Smith"

    expect(getIndividualEvaluationLabel(evaluation, sessions)).toBe(
      "Evaluation of Alex Smith’s Speech"
    )
  })
})
