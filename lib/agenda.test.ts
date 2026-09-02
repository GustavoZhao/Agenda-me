import { describe, expect, it } from "vitest"

import {
  applyAgendaTemplateImport,
  BALLOT_COLLECTION_ACTIVITY,
  BOOK_CLUB_ACTIVITY,
  BREAK_ACTIVITY,
  computeSchedule,
  createAgendaTemplateSessions,
  getIndividualEvaluationLabel,
  getPresetTitleBadge,
  HARKMASTER_QUIZ_ACTIVITY,
  INTRODUCTION_OF_HARKMASTER_ACTIVITY,
  JOKE_MASTER_ACTIVITY,
  ACTIVITY_OPTIONS,
  CLUB_MISSION,
  DEFAULT_SETTINGS,
  getSectionRoleLabel,
  getSectionRowLabel,
  normalizeSettings,
  resetMeetingPreservingClub,
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

  it("uses the universal Toastmasters Club Mission", () => {
    expect(CLUB_MISSION).toContain("supportive and positive learning experience")
    expect(CLUB_MISSION).toContain("self-confidence and personal growth")
  })

  it("keeps legacy agendas as single-club meetings while normalizing joint club fields", () => {
    const legacy = normalizeSettings({ meetingTitle: "Legacy Meeting" })
    expect(legacy.isJointMeeting).toBe(false)
    expect(legacy.jointClubInfo.clubName).toBe("Partner Toastmasters Club")

    const joint = normalizeSettings({
      isJointMeeting: true,
      meetingNumber: "245",
      jointClubInfo: {
        ...DEFAULT_SETTINGS.jointClubInfo,
        clubName: "Global Speakers Club",
        meetingNumber: "88",
        president: "Partner President",
        participantNotesBody: "1. Attend three meetings. 2. Give a mini-speech.",
      },
    })
    expect(joint.isJointMeeting).toBe(true)
    expect(joint.meetingNumber).toBe("245")
    expect(joint.jointClubInfo).toMatchObject({
      clubName: "Global Speakers Club",
      meetingNumber: "88",
      president: "Partner President",
      participantNotesBody: "1. Attend three meetings. 2. Give a mini-speech.",
    })
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

  it("uses the DTM image badge in the regular preview while retaining its text code", () => {
    expect(getPresetTitleBadge("DTM")).toEqual({
      kind: "image",
      src: "/dtm-badge.svg",
      alt: "DTM badge",
      code: "DTM",
    })
  })

  it("resets meeting details to the Standard template while preserving the club", () => {
    const current = normalizeSettings({
      ...DEFAULT_SETTINGS,
      meetingTitle: "Annual Celebration",
      meetingDate: "2026-08-01",
      startTime: "20:30",
      meetingTimeZone: "Europe/London",
      meetingSaa: "Alex Smith",
      wordOfTheDay: "Resilience",
      clubInfo: {
        ...DEFAULT_SETTINGS.clubInfo,
        clubName: "Example Toastmasters Club",
        clubNumber: "12345678",
        president: "Jane Doe",
      },
    })

    const reset = resetMeetingPreservingClub(current)

    expect(reset.clubInfo).toEqual(current.clubInfo)
    expect(reset.clubInfo).not.toBe(current.clubInfo)
    expect(reset.meetingTitle).toBe("Regular Meeting")
    expect(reset.meetingDate).toBe("")
    expect(reset.startTime).toBe("19:00")
    expect(reset.meetingTimeZone).toBe("Europe/London")
    expect(reset.meetingSaa).toBe("Meeting SAA")
    expect(reset.wordOfTheDay).toBe("Word")
    expect(reset.sessions.filter((session) => session.activity === "Prepared Speech")).toHaveLength(3)
    expect(reset.sessions.some((session) => session.activity === "Table Topics")).toBe(true)
    expect(reset.sessions.some((session) => session.activity === BOOK_CLUB_ACTIVITY)).toBe(false)
  })
})

describe("meeting templates", () => {
  it("offers Joke Master as an optional activity but omits it from every default template", () => {
    expect(ACTIVITY_OPTIONS).toContain(JOKE_MASTER_ACTIVITY)
    expect(ACTIVITY_OPTIONS).not.toContain("Warm-up")

    for (const template of ["standard", "book-club", "speechathon"] as const) {
      expect(createAgendaTemplateSessions(template).some((session) => session.activity === JOKE_MASTER_ACTIVITY)).toBe(false)
    }
  })

  it("uses the global-friendly Toastmaster of the Meeting title", () => {
    const introduction = createAgendaTemplateSessions("standard").find(
      (session) => session.activity === "Introduction of the Meeting"
    )

    expect(introduction?.presenter).toBe("Toastmaster of the Meeting (ToM)")
  })

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

  it.each(["standard", "book-club", "speechathon"] as const)(
    "adds the Harkmaster and ballot sequence to the %s template",
    (template) => {
      const sessions = createAgendaTemplateSessions(template)
      const activities = sessions.map((session) => session.activity)

      expect(activities.indexOf(INTRODUCTION_OF_HARKMASTER_ACTIVITY)).toBe(
        activities.indexOf("Introduction of the Grammarian") + 1
      )
      expect(activities.indexOf(HARKMASTER_QUIZ_ACTIVITY)).toBe(
        activities.indexOf("Grammarian's Report") + 1
      )
      expect(activities.indexOf(BALLOT_COLLECTION_ACTIVITY)).toBe(
        activities.indexOf("Timer's Report") + 1
      )
      const ballotCollection = sessions.find((session) => session.activity === BALLOT_COLLECTION_ACTIVITY)
      expect(ballotCollection?.durationMax).toBe(2)
      expect(ballotCollection?.presenter).toBe("Meeting SAA")
    }
  )

  it("synchronizes ballot collection with the meeting SAA", () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      sessions: createAgendaTemplateSessions("standard", "Alex Smith"),
      meetingSaa: "Alex Smith",
    }

    const updated = setMeetingSaa(settings, "Taylor Lee")
    const ballotCollection = updated.sessions.find(
      (session) => session.activity === BALLOT_COLLECTION_ACTIVITY
    )

    expect(ballotCollection?.presenter).toBe("Taylor Lee")
  })

  it("repairs a previously saved ballot counter role from the meeting SAA", () => {
    const sessions = createAgendaTemplateSessions("standard").map((session) =>
      session.activity === BALLOT_COLLECTION_ACTIVITY
        ? { ...session, presenter: "Ballot Counter" }
        : session
    )

    const normalized = normalizeSettings({ meetingSaa: "Jordan Chen", sessions })

    expect(
      normalized.sessions.find((session) => session.activity === BALLOT_COLLECTION_ACTIVITY)?.presenter
    ).toBe("Jordan Chen")
  })

  it("synchronizes linked report names and titles when loading a saved agenda", () => {
    const sessions = createAgendaTemplateSessions("standard").map((session) => {
      if (session.activity === "Introduction of the Timer") {
        return { ...session, presenter: "Taylor Timer", title: "PM3" }
      }
      if (session.activity === INTRODUCTION_OF_HARKMASTER_ACTIVITY) {
        return { ...session, presenter: "Harper Harkmaster", title: "DL2" }
      }
      if (session.activity === "Timer's Report" || session.activity === HARKMASTER_QUIZ_ACTIVITY) {
        return { ...session, presenter: "Stale role", title: "" }
      }
      return session
    })

    const normalized = normalizeSettings({ sessions })
    const timerReport = normalized.sessions.find((session) => session.activity === "Timer's Report")
    const harkmasterQuiz = normalized.sessions.find((session) => session.activity === HARKMASTER_QUIZ_ACTIVITY)

    expect(timerReport).toMatchObject({ presenter: "Taylor Timer", title: "PM3" })
    expect(harkmasterQuiz).toMatchObject({ presenter: "Harper Harkmaster", title: "DL2" })
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

describe("smart import", () => {
  it("recognizes flexible separators, joint meetings, meeting numbers, Harkmaster and word fields", () => {
    const result = applyAgendaTemplateImport(DEFAULT_SETTINGS, [
      "Joint Meeting",
      "Meeting title：Across Borders",
      "Meeting No. 245",
      "1 September 2026 | 19:30 – 21:30",
      "ToM — Alex Chen",
      "Meeting SAA - Jordan Lee",
      "Harkmaster: Priya Shah",
      "Word of the Meeting: Serendipity (noun)",
      "Speaker 1 — Mei Lin",
      "Evaluator 1: Carlos Ruiz",
    ].join("\n"))

    expect(result.settings).toMatchObject({
      isJointMeeting: true,
      meetingTitle: "Across Borders",
      meetingNumber: "245",
      meetingDate: "2026-09-01",
      startTime: "19:30",
      meetingSaa: "Jordan Lee",
      wordOfTheDay: "Serendipity",
      wordPartOfSpeech: "noun",
    })
    expect(result.settings.sessions.find((session) => session.activity === INTRODUCTION_OF_HARKMASTER_ACTIVITY)?.presenter).toBe("Priya Shah")
    expect(result.settings.sessions.find((session) => session.activity === HARKMASTER_QUIZ_ACTIVITY)?.presenter).toBe("Priya Shah")
    expect(result.settings.sessions.find((session) => session.activity === "Prepared Speech")?.presenter).toBe("Mei Lin")
  })

  it("does not mistake a standalone role line for the meeting title", () => {
    const result = applyAgendaTemplateImport(DEFAULT_SETTINGS, "Meeting SAA: Alex Smith")
    expect(result.settings.meetingTitle).toBe(DEFAULT_SETTINGS.meetingTitle)
  })
})
