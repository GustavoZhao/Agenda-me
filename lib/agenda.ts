export type TimerThresholds = {
  green: number // minute mark when timer shows green
  yellow: number // minute mark when timer shows yellow
  red: number // minute mark when timer shows red (time's up)
}

export type Session = {
  id: string
  activity: string
  presenter: string
  durationMin: number // minimum allowed duration (minutes)
  durationMax: number // maximum allowed duration (minutes); used for schedule end time
  buffer: number // transition buffer after this session (minutes)
  timerGreen: number
  timerYellow: number
  timerRed: number
  speechTitle?: string // Prepared Speech: talk title
  tableTopicsTheme?: string // Table Topics: session theme
  participantTimeLimit?: number // Table Topics: minutes allowed per participant
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
  break: "Break and Networking",
  evaluations: "Evaluations",
  closing: "Closing",
}

const LEGACY_BREAK_NAME = "Tea Break and Networking"
export const BREAK_ACTIVITY = "Break and Networking"

export function getSessionSection(activity: string): string | null {
  if (activity === "Prepared Speech") return "prepared-speeches"
  if (activity === "Table Topics") return "table-topics"
  if (activity === BREAK_ACTIVITY || activity === LEGACY_BREAK_NAME) return "break"
  if (
    activity === "Individual Evaluation" ||
    activity === "General Evaluation" ||
    activity === "Grammarian's Report" ||
    activity === "Timer's Report"
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

export type AgendaSettings = {
  meetingTitle: string
  meetingDate: string
  startTime: string // "HH:MM"
  preWelcome: number // Welcome duration before the meeting officially starts (minutes)
  defaultBuffer: number
  wordOfTheDay: string
  wordOfTheDayMeaning: string
  sessions: Session[]
  clubInfo: ClubInfo
}

// Fixed club identity — this template is used by a single club.
export const CLUB_NAME = "BRICS+ Online Advanced Toastmasters Club"
export const CLUB_MISSION = "Building relations, inspiring communication and sharing growth"
export const CLUB_LOGO_SRC = "/toastmasters-logo.svg"
export const CLUB_META = "Area K4, Division K, District 85, Club No. 28678559"

// The Executive Committee roster fields, in display order, with their labels
export const OFFICER_FIELDS: { key: keyof ClubInfo; label: string }[] = [
  { key: "president", label: "President" },
  { key: "vpe", label: "VPE" },
  { key: "vpm", label: "VPM" },
  { key: "vppr", label: "VPPR" },
  { key: "secretary", label: "Secretary" },
  { key: "treasurer", label: "Treasurer" },
  { key: "saa", label: "SAA (Zoom Master)" },
  { key: "ipp", label: "IPP" },
  { key: "mentors", label: "Club Mentors" },
  { key: "sponsors", label: "Club Sponsors" },
  { key: "advisor", label: "Club Advisor" },
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
  president: "Gisele Alvarenga",
  vpe: "Gustavo Zhao",
  vpm: "Francis Liu",
  vppr: "Christina Qiu",
  secretary: "Rajesh Dayalan",
  treasurer: "Panpan Jiang",
  saa: "Bryant Santana",
  ipp: "Akeel Alleyne",
  mentors: "Randal Eastman, Fursey Gotuaco",
  sponsors: "Avril Zhang, Mia Cao",
  advisor: "Ben Dai",
  vpmWechatQr: "",
  vpmWhatsappQr: "",
  vpmContactNote: 'Add our Vice President Membership (VPM), Francis Liu, to learn more. Note: Please mention "BRICS" in your friend request!',
  zoomMeetingId: "286 785 5900",
  zoomPasscode: "2025BRICS",
}

// Preset activities in the dropdown menu
export const ACTIVITY_OPTIONS = [
  "Warm-up",
  "Opening Remarks",
  "Introduction of the Meeting",
  "Introduction of the Grammarian",
  "Introduction of the Timer",
  "Table Topics",
  "Prepared Speech",
  BREAK_ACTIVITY,
  "Individual Evaluation",
  "General Evaluation",
  "Grammarian's Report",
  "Timer's Report",
  "Closing and Awards",
] as const

// Preferred running order used by the "Auto-sort" button
export const CANONICAL_ORDER = [
  "Opening Remarks",
  "Introduction of the Meeting",
  "Introduction of the Grammarian",
  "Introduction of the Timer",
  "Prepared Speech",
  BREAK_ACTIVITY,
  "Table Topics",
  "Individual Evaluation",
  "Grammarian's Report",
  "Timer's Report",
  "General Evaluation",
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
    durationMin,
    durationMax,
    buffer: partial.buffer ?? 1,
    timerGreen: partial.timerGreen ?? timers.green,
    timerYellow: partial.timerYellow ?? timers.yellow,
    timerRed: partial.timerRed ?? timers.red,
    speechTitle: partial.speechTitle ?? "",
    tableTopicsTheme: partial.tableTopicsTheme ?? "",
    participantTimeLimit: partial.participantTimeLimit ?? 2,
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

export const DEFAULT_SETTINGS: AgendaSettings = {
  meetingTitle: "Regular Meeting",
  meetingDate: "",
  startTime: "19:00",
  preWelcome: 5,
  defaultBuffer: 1,
  wordOfTheDay: "",
  wordOfTheDayMeaning: "",
  sessions: [
    makeSession({ activity: "Warm-up", presenter: "", durationMin: 5, durationMax: 5 }),
    makeSession({ activity: "Opening Remarks", presenter: "President", durationMin: 3, durationMax: 3 }),
    makeSession({ activity: "Introduction of the Meeting", presenter: "Toastmaster", durationMin: 5, durationMax: 5 }),
    makeSession({ activity: "Introduction of the Grammarian", presenter: "Grammarian", durationMin: 3, durationMax: 3 }),
    makeSession({
      activity: "Table Topics",
      presenter: "Table Topics Master",
      tableTopicsTheme: "",
      participantTimeLimit: 2,
      durationMin: 15,
      durationMax: 20,
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
    makeSession({ activity: BREAK_ACTIVITY, presenter: "All", durationMin: 10, durationMax: 10, buffer: 2 }),
    makeSession({ activity: "Individual Evaluation", presenter: "Evaluator 1", durationMin: 3, durationMax: 3 }),
    makeSession({ activity: "Individual Evaluation", presenter: "Evaluator 2", durationMin: 3, durationMax: 3 }),
    makeSession({ activity: "Individual Evaluation", presenter: "Evaluator 3", durationMin: 3, durationMax: 3 }),
    makeSession({ activity: "General Evaluation", presenter: "General Evaluator", durationMin: 5, durationMax: 7 }),
    makeSession({ activity: "Grammarian's Report", presenter: "Grammarian", durationMin: 3, durationMax: 3 }),
    makeSession({ activity: "Timer's Report", presenter: "Timer", durationMin: 3, durationMax: 3 }),
    makeSession({
      activity: "Closing and Awards",
      presenter: "President",
      durationMin: 5,
      durationMax: 5,
      buffer: 0,
    }),
  ],
  clubInfo: DEFAULT_CLUB_INFO,
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
  if (sectionKey === "table-topics") {
    return row.tableTopicsTheme?.trim() || "(Untitled Theme)"
  }
  if (sectionKey === "break") {
    return row.presenter?.trim() || "—"
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
  if (sectionKey === "table-topics") {
    const parts = [row.presenter?.trim(), row.participantTimeLimit ? `${row.participantTimeLimit}′ each` : ""]
    return parts.filter(Boolean).join(" · ") || "—"
  }
  if (sectionKey === "break") {
    return "—"
  }
  if (sectionKey === "closing") {
    return row.presenter?.trim() || "—"
  }
  if (sectionKey === "evaluations") {
    return row.presenter?.trim() || "—"
  }
  return row.presenter?.trim() || "—"
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
      presenter: "Club members",
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

export function normalizeSettings(raw: Partial<AgendaSettings>): AgendaSettings {
  const sessions = (raw.sessions ?? DEFAULT_SETTINGS.sessions).map((rawSession) => {
    const s = rawSession as LegacyStoredSession
    const legacyDuration = s.duration
    const durationMax = s.durationMax ?? legacyDuration ?? 5
    const durationMin = s.durationMin ?? legacyDuration ?? durationMax
    const timers = computeDefaultTimerThresholds(durationMax)

    return {
      id: s.id ?? makeId(),
      activity: s.activity === LEGACY_BREAK_NAME ? BREAK_ACTIVITY : (s.activity ?? ""),
      presenter: s.presenter ?? "",
      durationMin,
      durationMax,
      buffer: s.buffer ?? 1,
      timerGreen: s.timerGreen ?? timers.green,
      timerYellow: s.timerYellow ?? timers.yellow,
      timerRed: s.timerRed ?? timers.red,
      speechTitle: s.speechTitle ?? "",
      tableTopicsTheme: s.tableTopicsTheme ?? "",
      participantTimeLimit: s.participantTimeLimit ?? 2,
    }
  })

  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    sessions,
    clubInfo: { ...DEFAULT_CLUB_INFO, ...(raw.clubInfo ?? {}) },
  }
}
