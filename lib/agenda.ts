export type TimerThresholds = {
  green: number // minute mark when timer shows green
  yellow: number // minute mark when timer shows yellow
  red: number // minute mark when timer shows red (time's up)
}

export type Session = {
  id: string
  activity: string
  presenter: string
  title?: string // Role holder's Pathways / level / DTM marker
  durationMin: number // minimum allowed duration (minutes)
  durationMax: number // maximum allowed duration (minutes); used for schedule end time
  buffer: number // transition buffer after this session (minutes)
  timerGreen: number
  timerYellow: number
  timerRed: number
  speechTitle?: string // Prepared Speech: talk title
  tableTopicsTheme?: string // Table Topics: session theme
  participantTimeLimit?: number // Table Topics: minutes allowed per participant
  evaluatedSessionId?: string // Individual Evaluation: prepared speech being evaluated
}

// Default green / yellow / red minute marks based on the session's max duration
export function computeDefaultTimerThresholds(durationMax: number): TimerThresholds {
  if (durationMax <= 2) {
    return { green: 1, yellow: 1.5, red: 2 }
  }
  if (durationMax === 3) {
    return { green: 1, yellow: 2.5, red: 3 }
  }
  return { green: durationMax - 2, yellow: durationMax - 1, red: durationMax }
}

export function formatDurationRange(min: number, max: number): string {
  if (min === max) return `${max}′`
  return `${min}–${max}′`
}

export function formatTimerMinute(value: number): string {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1)
}

// Visual section dividers in the Sessions panel
export const SESSION_SECTION_LABELS: Record<string, string> = {
  "prepared-speeches": "Prepared Speeches",
  "table-topics": "Table Topics",
  "book-club": "BRICS+ Book Club",
  break: "Break and Networking",
  evaluations: "Evaluations",
  closing: "Closing",
}

const LEGACY_BREAK_NAME = "Tea Break and Networking"
const LEGACY_WARM_UP_NAME = "Warm-up"
export const JOKE_MASTER_ACTIVITY = "Joke Master"
export const BREAK_ACTIVITY = "Break and Networking"
export const BOOK_CLUB_ACTIVITY = "BRICS+ Book Club"
export const BOOK_CLUB_DISCUSSION_ACTIVITY = "Book Club Discussion"
export const BOOK_CLUB_TABLE_TOPICS_ACTIVITY = "Book Club Table Topics"
export const BOOK_CLUB_MINI_FEEDBACK_ACTIVITY = "Book Club Mini Feedback"
export const BOOK_CLUB_GRAMMARIAN_REPORT_ACTIVITY = "Grammarian's Report on Table Topics"
export const BOOK_CLUB_CLOSING_REFLECTION_ACTIVITY = "Book Club Closing Reflection"
export const TABLE_TOPICS_EVALUATION_ACTIVITY = "Table Topics Evaluation"
export const INTRODUCTION_OF_HARKMASTER_ACTIVITY = "Introduction of the Harkmaster"
export const HARKMASTER_QUIZ_ACTIVITY = "Quiz of the Harkmaster"
export const BALLOT_COLLECTION_ACTIVITY = "Ballot Collection"

export function getSessionSection(activity: string): string | null {
  if (activity === "Prepared Speech") return "prepared-speeches"
  if (activity === "Table Topics") return "table-topics"
  if (
    activity === BOOK_CLUB_ACTIVITY ||
    activity === BOOK_CLUB_DISCUSSION_ACTIVITY ||
    activity === BOOK_CLUB_TABLE_TOPICS_ACTIVITY ||
    activity === BOOK_CLUB_MINI_FEEDBACK_ACTIVITY ||
    activity === BOOK_CLUB_GRAMMARIAN_REPORT_ACTIVITY ||
    activity === BOOK_CLUB_CLOSING_REFLECTION_ACTIVITY
  ) {
    return "book-club"
  }
  if (activity === BREAK_ACTIVITY || activity === LEGACY_BREAK_NAME) return "break"
  if (
    activity === "Individual Evaluation" ||
    activity === TABLE_TOPICS_EVALUATION_ACTIVITY ||
    activity === "General Evaluation" ||
    activity === "Grammarian's Report" ||
    activity === HARKMASTER_QUIZ_ACTIVITY ||
    activity === "Timer's Report" ||
    activity === BALLOT_COLLECTION_ACTIVITY
  ) {
    return "evaluations"
  }
  if (activity === "Closing and Awards") return "closing"
  return null
}

export type SessionDisplayGroup = {
  key: string
  divider: string | null
  items: { session: Session; index: number }[]
}

// Group consecutive sessions that belong to the same visual section
export function groupSessionsForDisplay(sessions: Session[]): SessionDisplayGroup[] {
  const groups: SessionDisplayGroup[] = []
  let current: SessionDisplayGroup | null = null

  sessions.forEach((session, index) => {
    const section = getSessionSection(session.activity)
    const key = section ?? "general"
    const divider = section ? SESSION_SECTION_LABELS[section] : null

    if (!current || current.key !== key) {
      current = { key, divider, items: [] }
      groups.push(current)
    }
    current.items.push({ session, index })
  })

  return groups
}

// Club officers and shared club-level information (persisted, rarely changes)
export type ClubInfo = {
  clubName: string
  slogan: string
  meetingType: "in_person" | "online" | "hybrid"
  inPersonAddress: string
  onlinePlatform: string
  onlineMeetingId: string
  onlinePasscode: string
  participantNotesTitle: string
  participantNotesBody: string
  clubNumber: string
  area: string
  division: string
  district: string
  president: string
  vpe: string
  vpm: string
  vppr: string
  secretary: string
  treasurer: string
  saa: string
  ipp: string
  mentors: string
  sponsors: string
  advisor: string
  vpmWechatQr: string // data URL of uploaded QR image
  vpmWhatsappQr: string // data URL of uploaded QR image
  vpmContactNote: string
  zoomMeetingId: string
  zoomPasscode: string
}

export type JointClubInfo = {
  clubName: string
  slogan: string
  clubNumber: string
  meetingNumber: string
  area: string
  division: string
  district: string
  president: string
  vpe: string
  vpm: string
  vppr: string
  secretary: string
  treasurer: string
  saa: string
  ipp: string
  mentors: string
  sponsors: string
  advisor: string
  vpmWechatQr: string
  vpmWhatsappQr: string
  vpmContactNote: string
}

export type AgendaSettings = {
  meetingTitle: string
  meetingNumber: string
  meetingDate: string
  startTime: string // "HH:MM"
  meetingTimeZone: string // IANA time zone used to interpret the meeting start time
  preWelcome: number // Welcome duration before the meeting officially starts (minutes)
  meetingSaa: string // Meeting role; distinct from the club officer with the same title
  defaultBuffer: number
  wordOfTheDay: string
  wordPartOfSpeech: string
  wordOfTheDayMeaning: string
  sessions: Session[]
  clubInfo: ClubInfo
  isJointMeeting: boolean
  jointClubInfo: JointClubInfo
}

// Fixed club identity — this template is used by a single club.
export const CLUB_NAME = "BRICS+ Online Advanced Toastmasters Club"
export const CLUB_MISSION = "We provide a supportive and positive learning experience in which members are empowered to develop communication and leadership skills, resulting in greater self-confidence and personal growth."
export const CLUB_LOGO_SRC = "/toastmasters-logo.svg"
export const CLUB_META = "Area K4, Division K, District 85, Club No. 28678559"

// The Executive Committee roster fields, in display order, with their labels
export type OfficerFieldKey =
  | "president"
  | "vpe"
  | "vpm"
  | "vppr"
  | "secretary"
  | "treasurer"
  | "saa"
  | "ipp"
  | "mentors"
  | "sponsors"
  | "advisor"

export const OFFICER_FIELDS: { key: OfficerFieldKey; label: string }[] = [
  { key: "president", label: "President" },
  { key: "vpe", label: "VPE" },
  { key: "vpm", label: "VPM" },
  { key: "vppr", label: "VPPR" },
  { key: "secretary", label: "Secretary" },
  { key: "treasurer", label: "Treasurer" },
  { key: "saa", label: "SAA (Zoom Master)" },
  { key: "ipp", label: "IPP" },
  { key: "mentors", label: "Club Mentor(s)" },
  { key: "sponsors", label: "Club Sponsor(s)" },
  { key: "advisor", label: "Club Advisor(s)" },
]

export const CHINA_OFFSET_MINUTES = 8 * 60

export const TIMEZONE_CONVERSIONS = [
  { label: "Brazil", offsetMinutes: -3 * 60 },
  { label: "South Africa", offsetMinutes: 2 * 60 },
  { label: "Russia", offsetMinutes: 3 * 60 },
  { label: "India", offsetMinutes: 5 * 60 + 30 },
] as const

export function formatTimeInTimezone(time: string, offsetMinutes: number): string {
  return formatTime(parseTime(time) + offsetMinutes - CHINA_OFFSET_MINUTES)
}

export function getMeetingTimeConversions(time: string): Array<{ label: string; time: string }> {
  return TIMEZONE_CONVERSIONS.map(({ label, offsetMinutes }) => ({
    label,
    time: formatTimeInTimezone(time, offsetMinutes),
  }))
}

export const DEFAULT_CLUB_INFO: ClubInfo = {
  clubName: "Sample Toastmasters Club",
  slogan: "Your club slogan goes here",
  meetingType: "online",
  inPersonAddress: "",
  onlinePlatform: "Zoom",
  onlineMeetingId: "",
  onlinePasscode: "",
  participantNotesTitle: "How to Become a Member",
  participantNotesBody: "Add your club's membership criteria and next steps here.",
  clubNumber: "00000000",
  area: "",
  division: "",
  district: "",
  president: "John Doe",
  vpe: "John Doe",
  vpm: "John Doe",
  vppr: "John Doe",
  secretary: "John Doe",
  treasurer: "John Doe",
  saa: "John Doe",
  ipp: "John Doe",
  mentors: "John Doe",
  sponsors: "John Doe",
  advisor: "John Doe",
  vpmWechatQr: "",
  vpmWhatsappQr: "",
  vpmContactNote: "Add your VPM contact details or QR codes here.",
  zoomMeetingId: "",
  zoomPasscode: "",
}

export const DEFAULT_JOINT_CLUB_INFO: JointClubInfo = {
  clubName: "Partner Toastmasters Club",
  slogan: "Partner club slogan goes here",
  clubNumber: "",
  meetingNumber: "",
  area: "",
  division: "",
  district: "",
  president: "",
  vpe: "",
  vpm: "",
  vppr: "",
  secretary: "",
  treasurer: "",
  saa: "",
  ipp: "",
  mentors: "",
  sponsors: "",
  advisor: "",
  vpmWechatQr: "",
  vpmWhatsappQr: "",
  vpmContactNote: "",
}

// Preset activities in the dropdown menu
export const ACTIVITY_OPTIONS = [
  JOKE_MASTER_ACTIVITY,
  "Opening Remarks",
  "Introduction of the Meeting",
  "Introduction of the Timer",
  "Introduction of the Grammarian",
  INTRODUCTION_OF_HARKMASTER_ACTIVITY,
  "Table Topics",
  BOOK_CLUB_ACTIVITY,
  BOOK_CLUB_DISCUSSION_ACTIVITY,
  BOOK_CLUB_TABLE_TOPICS_ACTIVITY,
  BOOK_CLUB_MINI_FEEDBACK_ACTIVITY,
  BOOK_CLUB_GRAMMARIAN_REPORT_ACTIVITY,
  BOOK_CLUB_CLOSING_REFLECTION_ACTIVITY,
  "Prepared Speech",
  BREAK_ACTIVITY,
  "Individual Evaluation",
  TABLE_TOPICS_EVALUATION_ACTIVITY,
  "General Evaluation",
  "Grammarian's Report",
  HARKMASTER_QUIZ_ACTIVITY,
  "Timer's Report",
  BALLOT_COLLECTION_ACTIVITY,
  "Closing and Awards",
] as const

// Preferred running order used by the "Auto-sort" button
export const CANONICAL_ORDER = [
  JOKE_MASTER_ACTIVITY,
  "Opening Remarks",
  "Introduction of the Meeting",
  "Introduction of the Timer",
  "Introduction of the Grammarian",
  INTRODUCTION_OF_HARKMASTER_ACTIVITY,
  "Prepared Speech",
  BREAK_ACTIVITY,
  BOOK_CLUB_DISCUSSION_ACTIVITY,
  BOOK_CLUB_TABLE_TOPICS_ACTIVITY,
  BOOK_CLUB_MINI_FEEDBACK_ACTIVITY,
  BOOK_CLUB_GRAMMARIAN_REPORT_ACTIVITY,
  BOOK_CLUB_CLOSING_REFLECTION_ACTIVITY,
  "Table Topics",
  "Individual Evaluation",
  TABLE_TOPICS_EVALUATION_ACTIVITY,
  "General Evaluation",
  "Grammarian's Report",
  HARKMASTER_QUIZ_ACTIVITY,
  "Timer's Report",
  BALLOT_COLLECTION_ACTIVITY,
  "Closing and Awards",
]

// Stable-sort sessions by the canonical order; unlisted items keep their
// relative order and are appended at the end.
export function sortSessions(sessions: Session[]): Session[] {
  const rank = (activity: string) => {
    const i = CANONICAL_ORDER.indexOf(activity)
    return i === -1 ? Number.MAX_SAFE_INTEGER : i
  }
  return sessions
    .map((s, i) => ({ s, i }))
    .sort((a, b) => rank(a.s.activity) - rank(b.s.activity) || a.i - b.i)
    .map((o) => o.s)
}

let idCounter = 0
export function makeId() {
  idCounter += 1
  return `s-${Date.now().toString(36)}-${idCounter}`
}

type LegacySession = Partial<Session> & { duration?: number }

export function makeSession(partial: LegacySession = {}): Session {
  const legacyDuration = partial.duration
  const durationMax = partial.durationMax ?? legacyDuration ?? 5
  const durationMin = partial.durationMin ?? legacyDuration ?? durationMax
  const timers = computeDefaultTimerThresholds(durationMax)

  return {
    id: makeId(),
    activity: partial.activity ?? "",
    presenter: partial.presenter ?? "",
    title: partial.title ?? "",
    durationMin,
    durationMax,
    buffer: partial.buffer ?? 1,
    timerGreen: partial.timerGreen ?? timers.green,
    timerYellow: partial.timerYellow ?? timers.yellow,
    timerRed: partial.timerRed ?? timers.red,
    speechTitle: partial.speechTitle ?? "",
    tableTopicsTheme: partial.tableTopicsTheme ?? "",
    participantTimeLimit: partial.participantTimeLimit ?? 2,
    evaluatedSessionId: partial.evaluatedSessionId ?? "",
  }
}

function withUpdatedTimers(session: Session, partial: Partial<Session>): Partial<Session> {
  const durationMax = partial.durationMax ?? session.durationMax
  const durationMin = partial.durationMin ?? session.durationMin
  const durationChanged =
    partial.durationMax !== undefined || partial.durationMin !== undefined
  const timers = durationChanged ? computeDefaultTimerThresholds(durationMax) : null

  return {
    ...partial,
    durationMin,
    durationMax,
    ...(timers
      ? {
          timerGreen: partial.timerGreen ?? timers.green,
          timerYellow: partial.timerYellow ?? timers.yellow,
          timerRed: partial.timerRed ?? timers.red,
        }
      : {}),
  }
}

export function patchSession(session: Session, partial: Partial<Session>): Session {
  return { ...session, ...withUpdatedTimers(session, partial) }
}

export function setMeetingSaa(settings: AgendaSettings, meetingSaa: string): AgendaSettings {
  const previousMeetingSaa = settings.meetingSaa?.trim()
  return {
    ...settings,
    meetingSaa,
    sessions: settings.sessions.map((session) => {
      if (session.activity !== BREAK_ACTIVITY && session.activity !== BALLOT_COLLECTION_ACTIVITY) return session
      if (session.activity === BALLOT_COLLECTION_ACTIVITY) return { ...session, presenter: meetingSaa }
      const presenter = session.presenter?.trim()
      if (presenter && presenter !== previousMeetingSaa && presenter !== "Meeting SAA") return session
      return { ...session, presenter: meetingSaa }
    }),
  }
}

export type AgendaTemplateId = "standard" | "book-club" | "speechathon"

function openingSessions(): Session[] {
  return [
    makeSession({ activity: "Opening Remarks", presenter: "President", durationMax: 3 }),
    makeSession({ activity: "Introduction of the Meeting", presenter: "Toastmaster of the Meeting (ToM)", durationMax: 5 }),
    makeSession({ activity: "Introduction of the Timer", presenter: "Timer", durationMax: 2 }),
    makeSession({ activity: "Introduction of the Grammarian", presenter: "Grammarian", durationMax: 3 }),
    makeSession({ activity: INTRODUCTION_OF_HARKMASTER_ACTIVITY, presenter: "Harkmaster", durationMax: 2 }),
  ]
}

function preparedSpeeches(count: number): Session[] {
  return Array.from({ length: count }, (_, index) =>
    makeSession({
      activity: "Prepared Speech",
      presenter: `Speaker ${index + 1}`,
      durationMin: 5,
      durationMax: 7,
      buffer: 2,
    })
  )
}

function individualEvaluations(speeches: Session[]): Session[] {
  return speeches.map((speech, index) =>
    makeSession({
      activity: "Individual Evaluation",
      presenter: `Evaluator ${index + 1}`,
      durationMax: 3,
      evaluatedSessionId: speech.id,
    })
  )
}

function breakSession(meetingSaa: string): Session {
  return makeSession({
    activity: BREAK_ACTIVITY,
    presenter: meetingSaa || "Meeting SAA",
    speechTitle: "Guest Talk",
    durationMax: 10,
    buffer: 2,
  })
}

function evaluationReports(meetingSaa: string): Session[] {
  return [
    makeSession({ activity: "General Evaluation", presenter: "General Evaluator", durationMin: 5, durationMax: 7 }),
    makeSession({ activity: "Grammarian's Report", presenter: "Grammarian", durationMax: 3 }),
    makeSession({ activity: HARKMASTER_QUIZ_ACTIVITY, presenter: "Harkmaster", durationMax: 3 }),
    makeSession({ activity: "Timer's Report", presenter: "Timer", durationMax: 3 }),
    makeSession({ activity: BALLOT_COLLECTION_ACTIVITY, presenter: meetingSaa || "Meeting SAA", durationMax: 2 }),
    makeSession({ activity: "Closing and Awards", presenter: "President", durationMax: 5, buffer: 0 }),
  ]
}

export function createAgendaTemplateSessions(
  template: AgendaTemplateId,
  meetingSaa = "Meeting SAA",
): Session[] {
  const opening = openingSessions()

  if (template === "book-club") {
    const speeches = preparedSpeeches(2)
    return [
      ...opening,
      makeSession({ activity: BOOK_CLUB_DISCUSSION_ACTIVITY, presenter: "Book Club Master", durationMax: 25, buffer: 0 }),
      makeSession({
        activity: BOOK_CLUB_TABLE_TOPICS_ACTIVITY,
        presenter: "Book Club Master",
        participantTimeLimit: 2,
        durationMax: 25,
      }),
      makeSession({ activity: BOOK_CLUB_MINI_FEEDBACK_ACTIVITY, presenter: "Book Club Master", durationMax: 4 }),
      makeSession({ activity: BOOK_CLUB_GRAMMARIAN_REPORT_ACTIVITY, presenter: "Grammarian", durationMax: 2 }),
      makeSession({ activity: BOOK_CLUB_CLOSING_REFLECTION_ACTIVITY, presenter: "Book Club Master", durationMax: 5, buffer: 2 }),
      ...speeches,
      breakSession(meetingSaa),
      ...individualEvaluations(speeches),
      ...evaluationReports(meetingSaa),
    ]
  }

  const speechCount = template === "speechathon" ? 5 : 3
  const speeches = preparedSpeeches(speechCount)
  const tableTopics = template === "standard"
    ? [makeSession({
        activity: "Table Topics",
        presenter: "Table Topics Master",
        participantTimeLimit: 2,
        durationMax: 18,
        buffer: 0,
      })]
    : []
  const tableTopicsEvaluation = template === "standard"
    ? [makeSession({ activity: TABLE_TOPICS_EVALUATION_ACTIVITY, presenter: "Table Topics Evaluator", durationMax: 4 })]
    : []

  return [
    ...opening,
    ...speeches,
    ...tableTopics,
    breakSession(meetingSaa),
    ...individualEvaluations(speeches),
    ...tableTopicsEvaluation,
    ...evaluationReports(meetingSaa),
  ]
}

export const DEFAULT_SETTINGS: AgendaSettings = {
  meetingTitle: "Regular Meeting",
  meetingNumber: "",
  meetingDate: "",
  startTime: "19:00",
  meetingTimeZone: "Asia/Shanghai",
  preWelcome: 5,
  meetingSaa: "Meeting SAA",
  defaultBuffer: 1,
  wordOfTheDay: "Word",
  wordPartOfSpeech: "Part of Speech",
  wordOfTheDayMeaning: "Definition: Add a concise definition and an example sentence.",
  sessions: [
    makeSession({ activity: "Opening Remarks", presenter: "President", durationMin: 3, durationMax: 3 }),
    makeSession({ activity: "Introduction of the Meeting", presenter: "Toastmaster of the Meeting (ToM)", durationMin: 5, durationMax: 5 }),
    makeSession({ activity: "Introduction of the Timer", presenter: "Timer", durationMin: 2, durationMax: 2 }),
    makeSession({ activity: "Introduction of the Grammarian", presenter: "Grammarian", durationMin: 3, durationMax: 3 }),
    makeSession({ activity: INTRODUCTION_OF_HARKMASTER_ACTIVITY, presenter: "Harkmaster", durationMin: 2, durationMax: 2 }),
    makeSession({
      activity: BOOK_CLUB_DISCUSSION_ACTIVITY,
      presenter: "Book Club Master",
      durationMin: 25,
      durationMax: 25,
      buffer: 0,
    }),
    makeSession({
      activity: BOOK_CLUB_TABLE_TOPICS_ACTIVITY,
      presenter: "Book Club Master",
      tableTopicsTheme: "",
      participantTimeLimit: 2,
      durationMin: 25,
      durationMax: 25,
      buffer: 1,
    }),
    makeSession({
      activity: BOOK_CLUB_MINI_FEEDBACK_ACTIVITY,
      presenter: "Book Club Master",
      durationMin: 3,
      durationMax: 4,
      buffer: 1,
    }),
    makeSession({
      activity: BOOK_CLUB_GRAMMARIAN_REPORT_ACTIVITY,
      presenter: "Grammarian",
      durationMin: 2,
      durationMax: 2,
      buffer: 1,
    }),
    makeSession({
      activity: BOOK_CLUB_CLOSING_REFLECTION_ACTIVITY,
      presenter: "Book Club Master",
      durationMin: 5,
      durationMax: 5,
      buffer: 2,
    }),
    makeSession({
      activity: "Prepared Speech",
      presenter: "Speaker 1",
      speechTitle: "",
      durationMin: 5,
      durationMax: 7,
      buffer: 2,
    }),
    makeSession({
      activity: "Prepared Speech",
      presenter: "Speaker 2",
      speechTitle: "",
      durationMin: 5,
      durationMax: 7,
      buffer: 2,
    }),
    makeSession({
      activity: "Prepared Speech",
      presenter: "Speaker 3",
      speechTitle: "",
      durationMin: 5,
      durationMax: 7,
      buffer: 2,
    }),
    makeSession({
      activity: BREAK_ACTIVITY,
      presenter: "Meeting SAA",
      speechTitle: "Guest Talk",
      durationMin: 10,
      durationMax: 10,
      buffer: 2,
    }),
    makeSession({ activity: "Individual Evaluation", presenter: "Evaluator 1", durationMin: 3, durationMax: 3 }),
    makeSession({ activity: "Individual Evaluation", presenter: "Evaluator 2", durationMin: 3, durationMax: 3 }),
    makeSession({ activity: "Individual Evaluation", presenter: "Evaluator 3", durationMin: 3, durationMax: 3 }),
    makeSession({ activity: TABLE_TOPICS_EVALUATION_ACTIVITY, presenter: "Table Topics Evaluator", durationMin: 3, durationMax: 4 }),
    makeSession({ activity: "General Evaluation", presenter: "General Evaluator", durationMin: 5, durationMax: 7 }),
    makeSession({ activity: "Grammarian's Report", presenter: "Grammarian", durationMin: 3, durationMax: 3 }),
    makeSession({ activity: HARKMASTER_QUIZ_ACTIVITY, presenter: "Harkmaster", durationMin: 3, durationMax: 3 }),
    makeSession({ activity: "Timer's Report", presenter: "Timer", durationMin: 3, durationMax: 3 }),
    makeSession({ activity: BALLOT_COLLECTION_ACTIVITY, presenter: "Meeting SAA", durationMin: 2, durationMax: 2 }),
    makeSession({
      activity: "Closing and Awards",
      presenter: "President",
      durationMin: 5,
      durationMax: 5,
      buffer: 0,
    }),
  ],
  clubInfo: DEFAULT_CLUB_INFO,
  isJointMeeting: false,
  jointClubInfo: DEFAULT_JOINT_CLUB_INFO,
}

export function resetMeetingPreservingClub(settings: AgendaSettings): AgendaSettings {
  const current = normalizeSettings(settings)

  return {
    ...DEFAULT_SETTINGS,
    // The timezone is configured with the club profile and should remain the
    // default when starting a fresh meeting for the same club.
    meetingTimeZone: current.meetingTimeZone,
    sessions: createAgendaTemplateSessions("standard", DEFAULT_SETTINGS.meetingSaa),
    clubInfo: { ...current.clubInfo },
  }
}

export type ComputedRow = Session & {
  start: string
  end: string
}

export type PreviewBlock =
  | { type: "row"; row: ComputedRow }
  | { type: "section"; key: string; label: string; rows: ComputedRow[] }

// Session column label inside a grouped section (omit repeated section title)
export function getSectionRowLabel(row: ComputedRow, sectionKey: string | null): string {
  if (sectionKey === "prepared-speeches") {
    return row.speechTitle?.trim() || "(Untitled)"
  }
  if (sectionKey === "book-club") {
    if (row.activity === BOOK_CLUB_DISCUSSION_ACTIVITY) return "Discussion"
    if (row.activity === BOOK_CLUB_TABLE_TOPICS_ACTIVITY) return "Table Topics"
    if (row.activity === BOOK_CLUB_MINI_FEEDBACK_ACTIVITY) return "Mini Feedback"
    if (row.activity === BOOK_CLUB_GRAMMARIAN_REPORT_ACTIVITY) return "Grammarian's Report on Table Topics"
    if (row.activity === BOOK_CLUB_CLOSING_REFLECTION_ACTIVITY) return "Closing Reflection"
    return "Discussion + Table Topics"
  }
  if (sectionKey === "table-topics") {
    return row.tableTopicsTheme?.trim() || "(Untitled Theme)"
  }
  if (sectionKey === "break") {
    return row.speechTitle?.trim() || "Guest Talk"
  }
  if (sectionKey === "evaluations") {
    return row.activity || "(Untitled)"
  }
  if (sectionKey === "closing") {
    return row.activity?.trim() || "(Untitled)"
  }
  return row.activity?.trim() || "(Untitled)"
}

export function getSectionRoleLabel(row: ComputedRow, sectionKey: string | null): string {
  if (sectionKey === "prepared-speeches") {
    return row.presenter?.trim() || "—"
  }
  if (sectionKey === "book-club") {
    const parts = [
      row.presenter?.trim(),
      row.activity === BOOK_CLUB_TABLE_TOPICS_ACTIVITY && row.participantTimeLimit ? `${row.participantTimeLimit}′ each` : "",
    ]
    return parts.filter(Boolean).join(" · ") || "—"
  }
  if (sectionKey === "table-topics") {
    const parts = [row.presenter?.trim(), row.participantTimeLimit ? `${row.participantTimeLimit}′ each` : ""]
    return parts.filter(Boolean).join(" · ") || "—"
  }
  if (sectionKey === "break") {
    return row.presenter?.trim() || "—"
  }
  if (sectionKey === "closing") {
    return row.presenter?.trim() || "—"
  }
  if (sectionKey === "evaluations") {
    return row.presenter?.trim() || "—"
  }
  return row.presenter?.trim() || "—"
}

export function getIndividualEvaluationLabel(
  evaluation: Pick<Session, "activity" | "evaluatedSessionId">,
  sessions: Array<Pick<Session, "id" | "presenter">>
): string | null {
  if (evaluation.activity !== "Individual Evaluation" || !evaluation.evaluatedSessionId) {
    return null
  }

  const speech = sessions.find((session) => session.id === evaluation.evaluatedSessionId)
  if (!speech) return null

  const speaker = speech.presenter?.trim() || "the Speaker"
  return `Evaluation of ${speaker}’s Speech`
}

// Build preview table blocks with ALL CAPS section headers
export function buildPreviewBlocks(rows: ComputedRow[]): PreviewBlock[] {
  const blocks: PreviewBlock[] = []
  let currentSection: PreviewBlock | null = null

  for (const row of rows) {
    if (row.id === "pre-welcome") {
      if (currentSection?.type === "section") {
        blocks.push(currentSection)
        currentSection = null
      }
      blocks.push({ type: "row", row })
      continue
    }

    const section = getSessionSection(row.activity)
    const key = section ?? "general"

    if (section) {
      if (currentSection?.type === "section" && currentSection.key === key) {
        currentSection.rows.push(row)
      } else {
        if (currentSection?.type === "section") blocks.push(currentSection)
        currentSection = {
          type: "section",
          key,
          label: SESSION_SECTION_LABELS[section].toUpperCase(),
          rows: [row],
        }
      }
    } else {
      if (currentSection?.type === "section") {
        blocks.push(currentSection)
        currentSection = null
      }
      blocks.push({ type: "row", row })
    }
  }

  if (currentSection?.type === "section") blocks.push(currentSection)
  return blocks
}

// Parse "HH:MM" into total minutes
function parseTime(t: string): number {
  const [h, m] = t.split(":").map((x) => Number.parseInt(x, 10))
  if (Number.isNaN(h) || Number.isNaN(m)) return 0
  return h * 60 + m
}

function formatTime(totalMinutes: number): string {
  const wrapped = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60)
  const h = Math.floor(wrapped / 60)
  const m = wrapped % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}

// Compute start/end time of each session from the start time and per-session duration/buffer
export function computeSchedule(settings: AgendaSettings): {
  rows: ComputedRow[]
  totalDuration: number
  startTime: string
  endTime: string
} {
  const meetingStart = parseTime(settings.startTime)
  const rows: ComputedRow[] = []
  let totalDuration = 0

  // Welcome before the meeting officially starts: ends at the start time, begins earlier
  const hasPreWelcome = settings.preWelcome > 0
  if (hasPreWelcome) {
    const start = meetingStart - settings.preWelcome
    const welcomeTimers = computeDefaultTimerThresholds(settings.preWelcome)
    rows.push({
      id: "pre-welcome",
      activity: "Welcome",
      presenter: settings.meetingSaa?.trim() || "Meeting SAA",
      durationMin: settings.preWelcome,
      durationMax: settings.preWelcome,
      buffer: 0,
      timerGreen: welcomeTimers.green,
      timerYellow: welcomeTimers.yellow,
      timerRed: welcomeTimers.red,
      start: formatTime(start),
      end: formatTime(meetingStart),
    })
  }

  let cursor = meetingStart
  settings.sessions.forEach((s, index) => {
    const start = cursor
    const end = start + s.durationMax
    rows.push({ ...s, start: formatTime(start), end: formatTime(end) })
    totalDuration += s.durationMax
    cursor = end
    // No buffer after the last session
    if (index < settings.sessions.length - 1) {
      cursor += s.buffer
      totalDuration += s.buffer
    }
  })

  return {
    rows,
    totalDuration,
    startTime: formatTime(meetingStart),
    endTime: formatTime(cursor),
  }
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0) return `${h} hr${m > 0 ? ` ${m} min` : ""}`
  return `${m} min`
}

export function encodeAgendaSettings(settings: AgendaSettings): string {
  return encodeURIComponent(JSON.stringify(normalizeSettings(settings)))
}

export function decodeAgendaSettings(encoded: string): AgendaSettings | null {
  try {
    const decoded = decodeURIComponent(encoded)
    const parsed = JSON.parse(decoded) as Partial<AgendaSettings>
    return normalizeSettings(parsed)
  } catch {
    return null
  }
}

// Normalize persisted settings (legacy activity names, missing optional fields)
type LegacyStoredSession = Partial<Session> & { duration?: number }

const LINKED_ROLE_ACTIVITY_PAIRS = [
  ["Introduction of the Grammarian", "Grammarian's Report"],
  ["Introduction of the Timer", "Timer's Report"],
  [INTRODUCTION_OF_HARKMASTER_ACTIVITY, HARKMASTER_QUIZ_ACTIVITY],
] as const

function synchronizeLinkedRoleSessions(sessions: Session[]): Session[] {
  const sources = new Map<string, Session | undefined>(
    LINKED_ROLE_ACTIVITY_PAIRS.map(([sourceActivity, targetActivity]) => [
      targetActivity,
      sessions.find((session) => session.activity === sourceActivity),
    ])
  )

  return sessions.map((session) => {
    const source = sources.get(session.activity)
    return source
      ? { ...session, presenter: source.presenter, title: source.title ?? "" }
      : session
  })
}

export function normalizeSettings(raw: Partial<AgendaSettings>): AgendaSettings {
  const meetingSaa = raw.meetingSaa?.trim() || DEFAULT_SETTINGS.meetingSaa
  const sessions = (raw.sessions ?? DEFAULT_SETTINGS.sessions).map((rawSession) => {
    const s = rawSession as LegacyStoredSession
    const legacyDuration = s.duration
    const durationMax = s.durationMax ?? legacyDuration ?? 5
    const durationMin = s.durationMin ?? legacyDuration ?? durationMax
    const timers = computeDefaultTimerThresholds(durationMax)

    return {
      id: s.id ?? makeId(),
      activity:
        s.activity === LEGACY_BREAK_NAME
          ? BREAK_ACTIVITY
          : s.activity === LEGACY_WARM_UP_NAME
            ? JOKE_MASTER_ACTIVITY
            : (s.activity ?? ""),
      presenter: s.activity === BALLOT_COLLECTION_ACTIVITY ? meetingSaa : (s.presenter ?? ""),
      title: s.title ?? "",
      durationMin,
      durationMax,
      buffer: s.buffer ?? 1,
      timerGreen: s.timerGreen ?? timers.green,
      timerYellow: s.timerYellow ?? timers.yellow,
      timerRed: s.timerRed ?? timers.red,
      speechTitle: s.speechTitle ?? (s.activity === BREAK_ACTIVITY || s.activity === LEGACY_BREAK_NAME ? "Guest Talk" : ""),
      tableTopicsTheme: s.tableTopicsTheme ?? "",
      participantTimeLimit: s.participantTimeLimit ?? 2,
      evaluatedSessionId: s.evaluatedSessionId ?? "",
    }
  })

  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    meetingTimeZone: raw.meetingTimeZone || DEFAULT_SETTINGS.meetingTimeZone,
    sessions: synchronizeLinkedRoleSessions(sessions),
    clubInfo: { ...DEFAULT_CLUB_INFO, ...(raw.clubInfo ?? {}) },
    isJointMeeting: raw.isJointMeeting ?? false,
    jointClubInfo: { ...DEFAULT_JOINT_CLUB_INFO, ...(raw.jointClubInfo ?? {}) },
  }
}

type ParsedAgendaTemplate = {
  meetingTitle?: string
  meetingNumber?: string
  meetingDate?: string
  startTime?: string
  tableTopicsTheme?: string
  wordOfTheDay?: string
  wordPartOfSpeech?: string
  isJointMeeting?: boolean
  toastmaster?: string
  tableTopicsMaster?: string
  generalEvaluator?: string
  sergeantAtArms?: string
  grammarian?: string
  timer?: string
  harkmaster?: string
  speakerNames: string[]
  evaluatorNames: string[]
}

const MONTH_LOOKUP: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
}

function formatDateValue(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function normalizeClockTime(value: string): string {
  const [hours, minutes] = value.split(":").map((part) => Number.parseInt(part, 10))
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
}

function parseTemplateDate(value: string): string | null {
  const numeric = value.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/)
  if (numeric) {
    return `${numeric[1]}-${numeric[2].padStart(2, "0")}-${numeric[3].padStart(2, "0")}`
  }

  const dayFirstNumeric = value.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b/)
  if (dayFirstNumeric) {
    return `${dayFirstNumeric[3]}-${dayFirstNumeric[2].padStart(2, "0")}-${dayFirstNumeric[1].padStart(2, "0")}`
  }

  const match = value.match(/\b(?:([A-Za-z]+)\s+(\d{1,2})|(\d{1,2})\s+([A-Za-z]+))(?:,?\s*(\d{4}))?\b/)
  if (!match) return null

  const monthName = match[1] ?? match[4]
  const dayValue = match[2] ?? match[3]
  const monthIndex = MONTH_LOOKUP[monthName.toLowerCase()]
  if (monthIndex === undefined) return null

  const day = Number.parseInt(dayValue, 10)
  if (Number.isNaN(day)) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const year = match[5] ? Number.parseInt(match[5], 10) : today.getFullYear()
  let date = new Date(year, monthIndex, day)

  if (!match[5] && date < today) {
    date = new Date(year + 1, monthIndex, day)
  }

  return formatDateValue(date)
}

function parseTemplateTimeRange(value: string): string | null {
  const match = value.match(/\b(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})\b/)
  if (!match) return null
  return normalizeClockTime(match[1])
}

function firstRoleValue(lines: string[], pattern: RegExp): string | null {
  for (const line of lines) {
    const match = line.match(pattern)
    if (match?.[1]?.trim()) return match[1].trim()
  }
  return null
}

function firstMatchingRoleValue(lines: string[], patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const value = firstRoleValue(lines, pattern)
    if (value) return value
  }
  return null
}

function parseAgendaTemplate(text: string): ParsedAgendaTemplate {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[•●▪◦*#✅☑️\-–—]+\s*/, "").replace(/：/g, ":"))
    .filter(Boolean)

  const parsed: ParsedAgendaTemplate = {
    speakerNames: [],
    evaluatorNames: [],
  }

  const explicitTitle = firstMatchingRoleValue(lines, [
    /(?:meeting\s+)?title\s*(?::|[-–—])\s*(.+)$/i,
    /meeting\s+theme\s*(?::|[-–—])\s*(.+)$/i,
  ])
  const invitationTitle = lines.find((line) => /book your role for/i.test(line))
  if (explicitTitle || invitationTitle) {
    parsed.meetingTitle = explicitTitle ?? invitationTitle?.replace(/^book your role for\s*/i, "").replace(/[!?.]+$/, "").trim()
  }

  parsed.meetingNumber = firstMatchingRoleValue(lines, [
    /(?:club\s+)?meeting\s*(?:no\.?|number|#)\s*(?::|[-–—])?\s*#?([A-Za-z0-9-]+)$/i,
  ]) ?? undefined
  parsed.isJointMeeting = lines.some((line) => /\bjoint\s+(?:club\s+)?meeting\b/i.test(line)) || undefined

  const themeLine = lines.find((line) => /\btheme\s*:/i.test(line))
  if (themeLine) {
    const theme = themeLine.replace(/^.*\btheme\s*:\s*/i, "").trim()
    if (theme) parsed.tableTopicsTheme = theme
  }

  const dateLine = lines.find((line) => /\d{1,2}:\d{2}\s*[-–—]\s*\d{1,2}:\d{2}/.test(line))
  if (dateLine) {
    parsed.meetingDate = parseTemplateDate(dateLine) ?? undefined
    parsed.startTime = parseTemplateTimeRange(dateLine) ?? undefined
  }

  parsed.toastmaster = firstMatchingRoleValue(lines, [
    /toastmaster\s+of\s+the\s+meeting\s*(?:\(tom\))?\s*(?::|[-–—])\s*(.+)$/i,
    /tom\s*(?::|[-–—])\s*(.+)$/i,
    /toastmaster\s*(?::|[-–—])\s*(.+)$/i,
    /master of ceremonies\s*(?::|[-–—])\s*(.+)$/i,
    /\btm\b\s*(?::|[-–—])\s*(.+)$/i,
  ]) ?? undefined
  parsed.tableTopicsMaster = firstMatchingRoleValue(lines, [
    /table topics master\s*(?::|[-–—])\s*(.+)$/i,
    /topics master\s*(?::|[-–—])\s*(.+)$/i,
    /\bttm\b\s*(?::|[-–—])\s*(.+)$/i,
    /\btable topics\s*(?::|[-–—])\s*(.+)$/i,
  ]) ?? undefined
  parsed.generalEvaluator = firstMatchingRoleValue(lines, [
    /general evaluator\s*(?::|[-–—])\s*(.+)$/i,
    /gen(?:eral)? eval(?:uator)?\s*(?::|[-–—])\s*(.+)$/i,
    /evaluation master\s*(?::|[-–—])\s*(.+)$/i,
    /\bge\b\s*(?::|[-–—])\s*(.+)$/i,
  ]) ?? undefined
  parsed.sergeantAtArms = firstMatchingRoleValue(lines, [
    /(?:meeting\s+)?sergeant[-\s]?at[-\s]?arms\s*(?::|[-–—])\s*(.+)$/i,
    /(?:meeting\s+)?saa\s*(?::|[-–—])\s*(.+)$/i,
  ]) ?? undefined
  parsed.grammarian = firstMatchingRoleValue(lines, [
    /\bgrammarian\b\s*(?::|[-–—])\s*(.+)$/i,
    /word master\s*(?::|[-–—])\s*(.+)$/i,
  ]) ?? undefined
  parsed.timer = firstMatchingRoleValue(lines, [
    /\btimer\b\s*(?::|[-–—])\s*(.+)$/i,
    /timekeeper\s*(?::|[-–—])\s*(.+)$/i,
  ]) ?? undefined
  parsed.harkmaster = firstMatchingRoleValue(lines, [
    /hark\s*master\s*(?::|[-–—])\s*(.+)$/i,
    /harkmaster\s*(?::|[-–—])\s*(.+)$/i,
  ]) ?? undefined
  parsed.wordOfTheDay = firstMatchingRoleValue(lines, [
    /word\s+of\s+the\s+(?:day|meeting)\s*(?::|[-–—])\s*(.+?)(?:\s*\(([^)]+)\))?$/i,
    /\bwotd\b\s*(?::|[-–—])\s*(.+)$/i,
  ]) ?? undefined
  const wordLine = lines.find((line) => /word\s+of\s+the\s+(?:day|meeting)|\bwotd\b/i.test(line))
  const partMatch = wordLine?.match(/\(([^)]+)\)\s*$/)
  if (partMatch) {
    parsed.wordPartOfSpeech = partMatch[1].trim()
    if (parsed.wordOfTheDay) parsed.wordOfTheDay = parsed.wordOfTheDay.replace(/\s*\([^)]+\)\s*$/, "").trim()
  }

  for (const line of lines) {
    const speakerMatch = line.match(/(?:prepared\s+)?speaker\s*(\d+)\s*(?::|[-–—])\s*(.+)$/i)
    if (speakerMatch) {
      const index = Number.parseInt(speakerMatch[1], 10) - 1
      if (index >= 0) parsed.speakerNames[index] = speakerMatch[2].trim()
      continue
    }

    const evaluatorMatch = line.match(/(?:speech\s+)?evaluator\s*(\d+)\s*(?::|[-–—])\s*(.+)$/i)
    if (evaluatorMatch) {
      const index = Number.parseInt(evaluatorMatch[1], 10) - 1
      if (index >= 0) parsed.evaluatorNames[index] = evaluatorMatch[2].trim()
    }
  }

  return parsed
}

function applyValuesToActivity(sessions: Session[], activity: string, values: string[]): Session[] {
  let valueIndex = 0
  return sessions.map((session) => {
    if (session.activity !== activity) return session
    const presenter = values[valueIndex]
    if (!presenter) return session
    valueIndex += 1
    return { ...session, presenter }
  })
}

export type AgendaImportPreviewItem = {
  label: string
  value: string
}

type PathwayBadge = {
  pathway: string
  abbr: string
  badgeSrc: string
}

export type TitlePresetOption = {
  value: string
  label: string
}

export type MembershipCredentialEntry = {
  name: string
  normalizedName: string
  tokens: string[]
  credential: string
}

export const MEMBERSHIP_CSV_PATH = "/Club-Membership20260711.csv"

const PATHWAY_BADGES: PathwayBadge[] = [
  { pathway: "Dynamic Leadership", abbr: "DL", badgeSrc: "/pathways-badge-dynamic-leadership.svg" },
  { pathway: "Engaging Humor", abbr: "EH", badgeSrc: "/pathways-badge-engaging-humor.svg" },
  { pathway: "Motivational Strategies", abbr: "MS", badgeSrc: "/pathways-badge-motivational-strategies.svg" },
  { pathway: "Persuasive Influence", abbr: "PI", badgeSrc: "/pathways-badge-persuasive-influence.svg" },
  { pathway: "Presentation Mastery", abbr: "PM", badgeSrc: "/pathways-badge-presentation-mastery.svg" },
  { pathway: "Visionary Communication", abbr: "VC", badgeSrc: "/pathways-badge-visionary-communication.svg" },
]

const LEGACY_PATHWAY_BADGES: PathwayBadge[] = [
  { pathway: "Effective Coaching", abbr: "EC", badgeSrc: "/effective-coaching-path.svg" },
  { pathway: "Innovative Planning", abbr: "IP", badgeSrc: "/innovative-planning-path.svg" },
  { pathway: "Leadership Development", abbr: "LD", badgeSrc: "/leadership-development-path.svg" },
  { pathway: "Strategic Relations", abbr: "SR", badgeSrc: "/strategic-relationships-path.svg" },
  { pathway: "Team Collaboration", abbr: "TC", badgeSrc: "/team-collaboration-path.svg" },
]

const ALL_PATHWAY_BADGES: PathwayBadge[] = [...PATHWAY_BADGES, ...LEGACY_PATHWAY_BADGES]

export const TITLE_PRESET_OPTIONS: TitlePresetOption[] = [
  ...PATHWAY_BADGES.flatMap((item) =>
    [1, 2, 3, 4, 5].map((level) => ({
      value: `${item.abbr}${level}`,
      label: `${item.pathway}, Level ${level} (${item.abbr}${level})`,
    })),
  ),
  ...LEGACY_PATHWAY_BADGES.map((item) => ({
    value: item.pathway,
    label: item.pathway,
  })),
  { value: "DTM", label: "DTM" },
]

export const TITLE_OTHER_OPTION = "__other__"

export function getPathwaysBadgeSrc(title: string): string | null {
  const normalized = title.trim().toLowerCase()
  if (!normalized) return null

  const matchByLevel = ALL_PATHWAY_BADGES.find((item) => new RegExp(`^${item.abbr}[1-5]$`, "i").test(normalized))
  if (matchByLevel) return matchByLevel.badgeSrc

  const match = ALL_PATHWAY_BADGES.find((item) => normalized.includes(item.pathway.toLowerCase()))
  return match?.badgeSrc ?? null
}

export function getPresetTitleBadge(title: string):
  | { kind: "image"; src: string; alt: string; code?: string }
  | { kind: "code"; code: string }
  | null {
  const normalized = title.trim().toUpperCase()
  if (!normalized) return null

  // The detailed DTM SVG relies on a large set of internal gradients that
  // html2canvas cannot consistently preserve. Use a compact typographic badge
  // so it remains legible in both the live preview and exported PNG.
  if (normalized === "DTM") return { kind: "image", src: "/dtm-badge.svg", alt: "DTM badge", code: "DTM" }

  const abbrLevelMatch = normalized.match(/^([A-Z]{2})([1-5])$/)
  if (abbrLevelMatch) {
    const pathway = ALL_PATHWAY_BADGES.find((item) => item.abbr === abbrLevelMatch[1])
    if (pathway) {
      return {
        kind: "image",
        src: pathway.badgeSrc,
        alt: `${pathway.pathway} badge`,
        code: `${pathway.abbr}${abbrLevelMatch[2]}`,
      }
    }
  }

  const byPathwayName = ALL_PATHWAY_BADGES.find((item) => normalized === item.pathway.toUpperCase())
  if (byPathwayName) {
    return {
      kind: "image",
      src: byPathwayName.badgeSrc,
      alt: `${byPathwayName.pathway} badge`,
    }
  }

  const levelByNameMatch = normalized.match(/^(.+?)\s*LEVEL\s*([1-5])$/)
  if (levelByNameMatch) {
    const pathway = ALL_PATHWAY_BADGES.find((item) => levelByNameMatch[1].trim() === item.pathway.toUpperCase())
    if (pathway) {
      return {
        kind: "image",
        src: pathway.badgeSrc,
        alt: `${pathway.pathway} badge`,
        code: `${pathway.abbr}${levelByNameMatch[2]}`,
      }
    }
  }

  return null
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (ch === "," && !inQuotes) {
      cells.push(current)
      current = ""
      continue
    }
    current += ch
  }
  cells.push(current)
  return cells
}

function normalizeMemberName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function normalizeCredentialTitle(credential: string): string {
  const normalized = credential.trim().toUpperCase()
  if (!normalized) return ""
  if (normalized === "DTM") return "DTM"

  const abbrLevelMatch = normalized.match(/^([A-Z]{2})([1-5])$/)
  if (abbrLevelMatch) {
    const pathway = ALL_PATHWAY_BADGES.find((item) => item.abbr === abbrLevelMatch[1])
    if (pathway) return `${pathway.abbr}${abbrLevelMatch[2]}`
  }

  return credential.trim()
}

export function parseMembershipCredentialCsv(csvText: string): MembershipCredentialEntry[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)

  if (lines.length < 2) return []
  const headers = parseCsvLine(lines[0])
  const nameIndex = headers.findIndex((header) => header.trim().toLowerCase() === "name")
  const credentialIndex = headers.findIndex((header) => header.trim().toLowerCase() === "credentials")
  if (nameIndex === -1 || credentialIndex === -1) return []

  const entries: MembershipCredentialEntry[] = []

  for (const line of lines.slice(1)) {
    const row = parseCsvLine(line)
    const name = row[nameIndex]?.trim() ?? ""
    const credential = row[credentialIndex]?.trim() ?? ""
    const normalizedName = normalizeMemberName(name)
    if (!name || !credential || !normalizedName) continue

    entries.push({
      name,
      normalizedName,
      tokens: normalizedName.split(" ").filter(Boolean),
      credential,
    })
  }

  return entries
}

export function findCredentialForMemberName(name: string, entries: MembershipCredentialEntry[]): string | null {
  const normalizedQuery = normalizeMemberName(name)
  if (!normalizedQuery) return null

  const exact = entries.find((entry) => entry.normalizedName === normalizedQuery)
  if (exact) return exact.credential

  const queryTokens = normalizedQuery.split(" ").filter(Boolean)
  if (queryTokens.length === 0) return null

  const fallback = entries.find((entry) =>
    queryTokens.every((token) => entry.tokens.includes(token)),
  )
  return fallback?.credential ?? null
}

export function applyAgendaTemplateImport(settings: AgendaSettings, text: string): {
  settings: AgendaSettings
  matchedFields: string[]
  previewItems: AgendaImportPreviewItem[]
} {
  const parsed = parseAgendaTemplate(text)
  const next: AgendaSettings = normalizeSettings(settings)
  const matchedFields: string[] = []
  const previewItems: AgendaImportPreviewItem[] = []

  function addPreview(label: string, value: string) {
    previewItems.push({ label, value })
  }

  if (parsed.meetingTitle) {
    next.meetingTitle = parsed.meetingTitle
    matchedFields.push("meeting title")
    addPreview("Meeting title", parsed.meetingTitle)
  }

  if (parsed.meetingNumber) {
    next.meetingNumber = parsed.meetingNumber
    matchedFields.push("meeting number")
    addPreview("Meeting number", parsed.meetingNumber)
  }

  if (parsed.isJointMeeting) {
    next.isJointMeeting = true
    matchedFields.push("joint meeting")
    addPreview("Meeting format", "Joint meeting")
  }

  if (parsed.meetingDate) {
    next.meetingDate = parsed.meetingDate
    matchedFields.push("meeting date")
    addPreview("Meeting date", parsed.meetingDate)
  }

  if (parsed.startTime) {
    next.startTime = parsed.startTime
    matchedFields.push("start time")
    addPreview("Start time", parsed.startTime)
  }

  if (parsed.tableTopicsTheme) {
    next.sessions = next.sessions.map((session) =>
      session.activity === "Table Topics" || session.activity === BOOK_CLUB_TABLE_TOPICS_ACTIVITY
        ? { ...session, tableTopicsTheme: parsed.tableTopicsTheme }
        : session,
    )
    matchedFields.push("table topics theme")
    addPreview("Table Topics theme", parsed.tableTopicsTheme)
  }

  if (parsed.wordOfTheDay) {
    next.wordOfTheDay = parsed.wordOfTheDay
    matchedFields.push("word of the day")
    addPreview("Word of the Day", parsed.wordOfTheDay)
  }

  if (parsed.wordPartOfSpeech) {
    next.wordPartOfSpeech = parsed.wordPartOfSpeech
    matchedFields.push("part of speech")
    addPreview("Part of speech", parsed.wordPartOfSpeech)
  }

  if (parsed.sergeantAtArms) {
    const withMeetingSaa = setMeetingSaa(next, parsed.sergeantAtArms)
    next.meetingSaa = withMeetingSaa.meetingSaa
    next.sessions = withMeetingSaa.sessions
    matchedFields.push("meeting SAA")
    addPreview("Meeting SAA", parsed.sergeantAtArms)
  }

  if (parsed.toastmaster) {
    next.sessions = applyValuesToActivity(next.sessions, "Introduction of the Meeting", [parsed.toastmaster])
    matchedFields.push("toastmaster")
    addPreview("Toastmaster of the Meeting (ToM)", parsed.toastmaster)
  }

  if (parsed.tableTopicsMaster) {
    next.sessions = applyValuesToActivity(next.sessions, "Table Topics", [parsed.tableTopicsMaster])
    next.sessions = applyValuesToActivity(next.sessions, BOOK_CLUB_DISCUSSION_ACTIVITY, [parsed.tableTopicsMaster])
    next.sessions = applyValuesToActivity(next.sessions, BOOK_CLUB_TABLE_TOPICS_ACTIVITY, [parsed.tableTopicsMaster])
    matchedFields.push("table topics master")
    addPreview("Table Topics Master", parsed.tableTopicsMaster)
  }

  if (parsed.generalEvaluator) {
    next.sessions = applyValuesToActivity(next.sessions, "General Evaluation", [parsed.generalEvaluator])
    matchedFields.push("general evaluator")
    addPreview("General Evaluator", parsed.generalEvaluator)
  }

  if (parsed.grammarian) {
    next.sessions = applyValuesToActivity(next.sessions, "Introduction of the Grammarian", [parsed.grammarian])
    next.sessions = applyValuesToActivity(next.sessions, "Grammarian's Report", [parsed.grammarian])
    matchedFields.push("grammarian")
    addPreview("Grammarian", parsed.grammarian)
  }

  if (parsed.timer) {
    next.sessions = applyValuesToActivity(next.sessions, "Introduction of the Timer", [parsed.timer])
    next.sessions = applyValuesToActivity(next.sessions, "Timer's Report", [parsed.timer])
    matchedFields.push("timer")
    addPreview("Timer", parsed.timer)
  }

  if (parsed.harkmaster) {
    next.sessions = applyValuesToActivity(next.sessions, INTRODUCTION_OF_HARKMASTER_ACTIVITY, [parsed.harkmaster])
    next.sessions = applyValuesToActivity(next.sessions, HARKMASTER_QUIZ_ACTIVITY, [parsed.harkmaster])
    matchedFields.push("harkmaster")
    addPreview("Harkmaster", parsed.harkmaster)
  }

  if (parsed.speakerNames.some(Boolean)) {
    next.sessions = applyValuesToActivity(next.sessions, "Prepared Speech", parsed.speakerNames.filter(Boolean))
    matchedFields.push("prepared speakers")
    addPreview("Prepared speakers", parsed.speakerNames.filter(Boolean).join(", "))
  }

  if (parsed.evaluatorNames.some(Boolean)) {
    next.sessions = applyValuesToActivity(next.sessions, "Individual Evaluation", parsed.evaluatorNames.filter(Boolean))
    matchedFields.push("speech evaluators")
    addPreview("Speech evaluators", parsed.evaluatorNames.filter(Boolean).join(", "))
  }

  return { settings: next, matchedFields, previewItems }
}
