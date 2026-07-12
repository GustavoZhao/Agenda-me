"use client"

import { Fragment, type ReactNode, useState } from "react"

import {
  type AgendaSettings,
  buildPreviewBlocks,
  BREAK_ACTIVITY,
  CLUB_LOGO_SRC,
  CLUB_MISSION,
  type ComputedRow,
  formatDuration,
  formatDurationRange,
  getPresetTitleBadge,
  getSectionRoleLabel,
  getSectionRowLabel,
  OFFICER_FIELDS,
  computeSchedule,
} from "@/lib/agenda"

type Props = {
  settings: AgendaSettings
  fullWidth?: boolean
}

const BASE_TIME_ZONE = "Asia/Shanghai"

const TIME_ZONE_OPTIONS = [
  { value: "Asia/Shanghai", label: "China (UTC+8)" },
  { value: "America/Sao_Paulo", label: "Brazil (Sao Paulo)" },
  { value: "Africa/Johannesburg", label: "South Africa (Johannesburg)" },
  { value: "Europe/Moscow", label: "Russia (Moscow)" },
  { value: "Asia/Kolkata", label: "India (Kolkata)" },
  { value: "America/New_York", label: "US Eastern (New York)" },
  { value: "America/Los_Angeles", label: "US Pacific (Los Angeles)" },
  { value: "Europe/London", label: "UK (London)" },
  { value: "Europe/Paris", label: "Central Europe (Paris)" },
  { value: "Asia/Tokyo", label: "Japan (Tokyo)" },
  { value: "Australia/Sydney", label: "Australia (Sydney)" },
] as const

function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(":").map((part) => Number.parseInt(part, 10))
  return {
    hour: Number.isNaN(h) ? 0 : h,
    minute: Number.isNaN(m) ? 0 : m,
  }
}

function toDateParts(dateValue: string): { year: number; month: number; day: number } {
  const parsed = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (parsed) {
    return {
      year: Number.parseInt(parsed[1], 10),
      month: Number.parseInt(parsed[2], 10),
      day: Number.parseInt(parsed[3], 10),
    }
  }

  const now = new Date()
  return {
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1,
    day: now.getUTCDate(),
  }
}

function getOffsetMinutes(timeZone: string, date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date)

  const offset = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT+0"
  const match = offset.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/)
  if (!match) return 0

  const sign = match[1] === "-" ? -1 : 1
  const hours = Number.parseInt(match[2], 10)
  const minutes = Number.parseInt(match[3] ?? "0", 10)
  return sign * (hours * 60 + minutes)
}

function convertTimeToZone(time: string, meetingDate: string, targetTimeZone: string): string {
  if (targetTimeZone === BASE_TIME_ZONE) return time

  const { hour, minute } = parseTime(time)
  const { year, month, day } = toDateParts(meetingDate)

  // Agenda input times are defined in China time (UTC+8).
  const utcMillis = Date.UTC(year, month - 1, day, hour, minute) - 8 * 60 * 60 * 1000
  const instant = new Date(utcMillis)
  const offsetMinutes = getOffsetMinutes(targetTimeZone, instant)
  const displayTime = new Date(utcMillis + offsetMinutes * 60 * 1000)

  const hh = `${displayTime.getUTCHours()}`.padStart(2, "0")
  const mm = `${displayTime.getUTCMinutes()}`.padStart(2, "0")
  return `${hh}:${mm}`
}

function renderInlineMarkdown(text: string): ReactNode {
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return tokens.map((token, index) => {
    if (token.startsWith("**") && token.endsWith("**") && token.length > 4) {
      return <strong key={`b-${index}`}>{token.slice(2, -2)}</strong>
    }
    if (token.startsWith("*") && token.endsWith("*") && token.length > 2) {
      return <em key={`i-${index}`}>{token.slice(1, -1)}</em>
    }
    return <Fragment key={`t-${index}`}>{token}</Fragment>
  })
}

function NotesContent({ body }: { body: string }) {
  const lines = body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    return null
  }

  const numbered = lines.every((line) => /^\d+\.\s+/.test(line))
  const bulleted = lines.every((line) => /^[-*]\s+/.test(line))

  if (numbered) {
    return (
      <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm text-card-foreground">
        {lines.map((line) => (
          <li key={line} className="text-pretty">
            {renderInlineMarkdown(line.replace(/^\d+\.\s+/, ""))}
          </li>
        ))}
      </ol>
    )
  }

  if (bulleted) {
    return (
      <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-card-foreground">
        {lines.map((line) => (
          <li key={line} className="text-pretty">
            {renderInlineMarkdown(line.replace(/^[-*]\s+/, ""))}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="flex flex-col gap-2 text-sm text-card-foreground">
      {lines.map((line) => (
        <p key={line} className="text-pretty">
          {renderInlineMarkdown(line)}
        </p>
      ))}
    </div>
  )
}

export function AgendaPreview({ settings, fullWidth = false }: Props) {
  const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const [selectedTimeZone, setSelectedTimeZone] = useState<string>(
    TIME_ZONE_OPTIONS.some((option) => option.value === browserTimeZone)
      ? browserTimeZone
      : BASE_TIME_ZONE
  )

  const { rows, totalDuration, startTime, endTime } = computeSchedule(settings)
  const displayRows = rows.map((row) => ({
    ...row,
    start: convertTimeToZone(row.start, settings.meetingDate, selectedTimeZone),
    end: convertTimeToZone(row.end, settings.meetingDate, selectedTimeZone),
  }))

  const previewBlocks = buildPreviewBlocks(displayRows)
  const { clubInfo } = settings
  const clubName = clubInfo.clubName?.trim() || "Toastmasters Club"
  const clubSlogan = clubInfo.slogan?.trim() || CLUB_MISSION
  const participantNotesTitle = clubInfo.participantNotesTitle?.trim() || "How to Become a Member"
  const participantNotesBody = clubInfo.participantNotesBody?.trim() || ""
  const meetingType = clubInfo.meetingType || "online"
  const clubMeta = [
    clubInfo.area?.trim() ? `Area ${clubInfo.area.trim()}` : "",
    clubInfo.division?.trim() ? `Division ${clubInfo.division.trim()}` : "",
    clubInfo.district?.trim() ? `District ${clubInfo.district.trim()}` : "",
    clubInfo.clubNumber?.trim() ? `Club No. ${clubInfo.clubNumber.trim()}` : "",
  ]
    .filter(Boolean)
    .join(", ")
  const displayStartTime = convertTimeToZone(startTime, settings.meetingDate, selectedTimeZone)
  const displayEndTime = convertTimeToZone(endTime, settings.meetingDate, selectedTimeZone)

  const dateLabel = settings.meetingDate
    ? new Date(settings.meetingDate + "T00:00:00").toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      })
    : ""

  const displayFont = {
    fontFamily: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
  }

  return (
    <div className={`mx-auto w-full ${fullWidth ? "max-w-6xl" : "max-w-3xl"}`}>
      <article id="agenda-sheet" className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {/* Header */}
        <header className="border-b-4 border-[#F2DF74] bg-gradient-to-r from-[#3B0104] to-[#781327] px-6 py-6 text-white dark:from-[#004165] dark:to-[#006094]">
          <div className="flex items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden p-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={CLUB_LOGO_SRC || "/placeholder.svg"} alt="Club logo" className="size-full object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="text-balance text-xl font-bold leading-tight" style={displayFont}>
                {clubName}
              </h1>
              <p className="mt-1 text-pretty text-sm italic text-white/80">{clubSlogan}</p>
              <p className="mt-1 text-xs font-medium text-white/70">{clubMeta}</p>
            </div>
          </div>
        </header>

        <div className="border-b border-border bg-background/90 px-6 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Meeting Information</div>

              {(meetingType === "in_person" || meetingType === "hybrid") && (
                <div className="space-y-1 text-sm text-foreground">
                  <div>
                    <span className="font-medium text-muted-foreground">In-person Address:</span>{" "}
                    {clubInfo.inPersonAddress?.trim() || "Not set"}
                  </div>
                </div>
              )}

              {(meetingType === "online" || meetingType === "hybrid") && (
                <div className="space-y-1 text-sm text-foreground">
                  <div>
                    <span className="font-medium text-muted-foreground">Platform:</span>{" "}
                    {clubInfo.onlinePlatform?.trim() || "Zoom"}
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Meeting ID:</span>{" "}
                    {clubInfo.onlineMeetingId?.trim() || "Not set"}
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Passcode:</span>{" "}
                    {clubInfo.onlinePasscode?.trim() || "Not set"}
                  </div>
                </div>
              )}
            </div>
            <div className="rounded-lg border border-border bg-secondary/50 px-3 py-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Display timezone</div>
              <div className="mt-2 flex items-center gap-2">
                <select
                  value={selectedTimeZone}
                  onChange={(event) => setSelectedTimeZone(event.target.value)}
                  className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
                  aria-label="Display timezone"
                >
                  {TIME_ZONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Meeting info bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#004165] px-6 py-3 text-white">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="font-semibold" style={displayFont}>
              {settings.meetingTitle || "Meeting Agenda"}
            </span>
            {dateLabel && <span className="text-white/80">{dateLabel}</span>}
          </div>
          <span className="text-sm font-medium">
            {displayStartTime} – {displayEndTime}
          </span>
        </div>

        {/* Body: session table (main) + club sidebar */}
        <div className={`grid grid-cols-1 ${fullWidth ? "lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" : ""}`}>
          <div className={`min-w-0 ${fullWidth ? "lg:border-r lg:border-border" : ""}`}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Time</th>
                    <th className="px-4 py-2 font-medium">Session</th>
                    <th className="px-4 py-2 font-medium">Role</th>
                    <th className="px-4 py-2 font-medium">Title</th>
                    <th className="px-4 py-2 text-right font-medium">
                      <div className="flex flex-col items-end gap-1">
                        <span>Duration</span>
                        <div className="flex flex-wrap items-center justify-end gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-1.5 py-0.5">
                            <span className="size-2.5 rounded-full bg-emerald-500 ring-1 ring-background" />G
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-1.5 py-0.5">
                            <span className="size-2.5 rounded-full bg-amber-400 ring-1 ring-background" />Y
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-1.5 py-0.5">
                            <span className="size-2.5 rounded-full bg-red-500 ring-1 ring-background" />R
                          </span>
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previewBlocks.map((block) => {
                    if (block.type === "section") {
                      return (
                        <SectionRows
                          key={`section-${block.key}-${block.rows[0]?.id}`}
                          label={block.label}
                          sectionKey={block.key}
                          rows={block.rows}
                        />
                      )
                    }
                    return <AgendaRow key={block.row.id} row={block.row} sectionKey={null} />
                  })}
                  {previewBlocks.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No sessions yet. Add them in the settings panel.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-border bg-secondary/50 px-4 py-3 text-xs text-muted-foreground">
              <span>{rows.length} sessions</span>
              <span>Total duration ≈ {formatDuration(totalDuration)}</span>
            </div>
          </div>

          <aside className={`min-w-0 border-t border-border p-5 ${fullWidth ? "lg:border-t-0" : ""}`}>
            {(settings.wordOfTheDay?.trim() || settings.wordOfTheDayMeaning?.trim()) ? (
              <div className="mb-6 rounded-lg border border-[#004165]/30 bg-[#004165] p-4 text-white dark:border-[#004165]/30 dark:bg-[#004165]">
                <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-white" style={displayFont}>
                  Word of the Day
                </h2>
                {settings.wordOfTheDay?.trim() ? (
                  <p className="text-sm font-semibold text-white" style={displayFont}>
                    {settings.wordOfTheDay.trim()}
                  </p>
                ) : null}
                {settings.wordOfTheDayMeaning?.trim() ? (
                  <p className="mt-1 text-sm font-light leading-relaxed text-white/90">
                    {settings.wordOfTheDayMeaning.trim()}
                  </p>
                ) : null}
              </div>
            ) : null}

            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-primary" style={displayFont}>
              Executive Committee
            </h2>
            <dl className="flex flex-col gap-1.5 text-sm">
              {OFFICER_FIELDS.map((f) => {
                const value = clubInfo[f.key]
                if (!value) return null
                return (
                  <div key={f.key} className="flex gap-2">
                    <dt className="shrink-0 font-medium text-muted-foreground">{f.label}:</dt>
                    <dd className="min-w-0 text-card-foreground">{value}</dd>
                  </div>
                )
              })}
            </dl>

            <div className="mt-6 rounded-lg bg-secondary/60 p-4">
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-primary" style={displayFont}>
                {participantNotesTitle}
              </h2>
              <NotesContent body={participantNotesBody} />
            </div>

            {(clubInfo.vpmWechatQr || clubInfo.vpmWhatsappQr || clubInfo.vpmContactNote?.trim()) && (
              <div className="mt-6">
                <div className="flex flex-wrap justify-center gap-6">
                  {clubInfo.vpmWechatQr && <QrBadge src={clubInfo.vpmWechatQr} label="WeChat" />}
                  {clubInfo.vpmWhatsappQr && <QrBadge src={clubInfo.vpmWhatsappQr} label="WhatsApp" />}
                </div>
                {clubInfo.vpmContactNote?.trim() ? (
                  <p className="mt-3 text-pretty text-center text-xs leading-relaxed text-muted-foreground">
                    {clubInfo.vpmContactNote.trim()}
                  </p>
                ) : null}
              </div>
            )}
          </aside>
        </div>

        <footer className="border-t border-border bg-background/70 px-6 py-2 text-center text-[11px] text-muted-foreground">
          Designed with ♥ by BRICS+ Advanced Online Toastmasters.
        </footer>
      </article>
    </div>
  )
}

function SectionRows({
  label,
  sectionKey,
  rows,
}: {
  label: string
  sectionKey: string
  rows: ComputedRow[]
}) {
  return (
    <>
      <tr className="border-b border-border/60 bg-[#F2DF74]/20">
        <td colSpan={5} className="px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-foreground">
          {label}
        </td>
      </tr>
      {rows.map((row) => (
        <AgendaRow key={row.id} row={row} sectionKey={sectionKey} />
      ))}
    </>
  )
}

function AgendaRow({ row, sectionKey }: { row: ComputedRow; sectionKey: string | null }) {
  const sessionLabel = getSectionRowLabel(row, sectionKey)
  const roleLabel = getSectionRoleLabel(row, sectionKey)
  const titleLabel = row.title?.trim() ?? ""
  const presetTitleBadge = getPresetTitleBadge(titleLabel)
  const isBreak = row.activity === BREAK_ACTIVITY

  return (
    <tr className="border-b border-border/60 last:border-b-0">
      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
        {row.start} – {row.end}
      </td>
      <td className="px-4 py-3 font-medium text-card-foreground">{sessionLabel}</td>
      <td className="px-4 py-3 text-muted-foreground">{roleLabel}</td>
      <td className="px-4 py-3 text-muted-foreground">
        {presetTitleBadge ? (
          <div className="flex items-center gap-2">
            {presetTitleBadge.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={presetTitleBadge.src}
                alt={presetTitleBadge.alt}
                className="size-8 shrink-0 rounded-md border border-border/50 bg-background p-0.5"
              />
            ) : null}
            {presetTitleBadge.code ? (
              <span className="inline-flex min-h-7 min-w-11 items-center justify-center rounded-md border border-border/60 bg-secondary px-2 text-xs font-semibold text-foreground">
                {presetTitleBadge.code}
              </span>
            ) : null}
          </div>
        ) : titleLabel ? (
          <span className="min-w-0 text-pretty">{titleLabel}</span>
        ) : (
          <span>—</span>
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right text-muted-foreground">
        {isBreak ? (
          <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-1.5 py-0.5">
              <span className="size-2.5 rounded-full bg-red-500 ring-1 ring-background" />{row.durationMax}′
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-1.5 py-0.5">
              <span className="size-2.5 rounded-full bg-emerald-500 ring-1 ring-background" />{row.timerGreen}′
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-1.5 py-0.5">
              <span className="size-2.5 rounded-full bg-amber-400 ring-1 ring-background" />{row.timerYellow}′
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-1.5 py-0.5">
              <span className="size-2.5 rounded-full bg-red-500 ring-1 ring-background" />{row.timerRed}′
            </span>
          </div>
        )}
      </td>
    </tr>
  )
}

function QrBadge({ src, label }: { src: string; label: string }) {
  return (
    <figure className="flex flex-col items-center gap-1.5">
      <div className="size-28 overflow-hidden rounded-md border border-border bg-background p-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src || "/placeholder.svg"} alt={`VPM ${label} QR code`} className="size-full object-contain" />
      </div>
      <figcaption className="text-xs font-medium text-muted-foreground">{label}</figcaption>
    </figure>
  )
}
