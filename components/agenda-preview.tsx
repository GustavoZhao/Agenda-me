"use client"

import { Fragment, type ReactNode, useEffect, useState } from "react"

import {
  type AgendaSettings,
  buildPreviewBlocks,
  BREAK_ACTIVITY,
  CLUB_LOGO_SRC,
  CLUB_MISSION,
  type ComputedRow,
  formatDuration,
  getIndividualEvaluationLabel,
  getPresetTitleBadge,
  getSectionRoleLabel,
  getSectionRowLabel,
  OFFICER_FIELDS,
  computeSchedule,
} from "@/lib/agenda"
import {
  convertAgendaTimeToZone,
  DEFAULT_MEETING_TIME_ZONE,
  formatTimeZoneOffset,
  isSupportedTimeZone,
  TIME_ZONE_OPTIONS,
} from "@/lib/time-zones"

type Props = {
  settings: AgendaSettings
  fullWidth?: boolean
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
  const meetingTimeZone = isSupportedTimeZone(settings.meetingTimeZone)
    ? settings.meetingTimeZone
    : DEFAULT_MEETING_TIME_ZONE
  const [selectedTimeZone, setSelectedTimeZone] = useState<string>(
    meetingTimeZone
  )

  useEffect(() => {
    setSelectedTimeZone(meetingTimeZone)
  }, [meetingTimeZone])

  const { rows, totalDuration, startTime, endTime } = computeSchedule(settings)
  const displayRows = rows.map((row) => ({
    ...row,
    start: convertAgendaTimeToZone(
      row.start,
      settings.meetingDate,
      meetingTimeZone,
      selectedTimeZone
    ),
    end: convertAgendaTimeToZone(
      row.end,
      settings.meetingDate,
      meetingTimeZone,
      selectedTimeZone
    ),
  }))

  const previewBlocks = buildPreviewBlocks(displayRows)
  const { clubInfo } = settings
  const clubName = clubInfo.clubName?.trim() || "Sample Toastmasters Club"
  const clubSlogan = clubInfo.slogan?.trim() || "Your club slogan goes here"
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
  const jointClubMeta = [
    settings.jointClubInfo.area?.trim() ? `Area ${settings.jointClubInfo.area.trim()}` : "",
    settings.jointClubInfo.division?.trim() ? `Division ${settings.jointClubInfo.division.trim()}` : "",
    settings.jointClubInfo.district?.trim() ? `District ${settings.jointClubInfo.district.trim()}` : "",
    settings.jointClubInfo.clubNumber?.trim() ? `Club No. ${settings.jointClubInfo.clubNumber.trim()}` : "",
  ].filter(Boolean).join(", ")
  const clubIdentities = [
    { name: clubName, slogan: clubSlogan, meta: clubMeta },
    ...(settings.isJointMeeting
      ? [{
          name: settings.jointClubInfo.clubName?.trim() || "Partner Toastmasters Club",
          slogan: settings.jointClubInfo.slogan?.trim() || "Partner club slogan goes here",
          meta: jointClubMeta,
        }]
      : []),
  ]
  const displayStartTime = convertAgendaTimeToZone(
    startTime,
    settings.meetingDate,
    meetingTimeZone,
    selectedTimeZone
  )
  const displayEndTime = convertAgendaTimeToZone(
    endTime,
    settings.meetingDate,
    meetingTimeZone,
    selectedTimeZone
  )
  const displayTimeZone = formatTimeZoneOffset(
    selectedTimeZone,
    settings.meetingDate,
    startTime,
    meetingTimeZone
  )

  const dateLabel = settings.meetingDate
    ? new Date(settings.meetingDate + "T00:00:00").toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      })
    : ""

  const displayFont = {
    fontFamily:
      "var(--font-montserrat), var(--font-alibaba-puhuiti), ui-sans-serif, system-ui, sans-serif",
  }

  return (
    <div className={`mx-auto w-full ${fullWidth ? "max-w-6xl" : "max-w-3xl"}`}>
      <article id="agenda-sheet" className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {/* Header */}
        <header className="border-b-4 border-[#F2DF74] bg-gradient-to-r from-[#3B0104] to-[#781327] px-6 py-6 text-white dark:from-[#004165] dark:to-[#006094]">
          {settings.isJointMeeting ? (
            <div className="agenda-joint-header flex min-w-0 items-center gap-5">
              <div className="agenda-club-logo flex size-[72px] min-h-[72px] min-w-[72px] shrink-0 items-center justify-center overflow-hidden p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={CLUB_LOGO_SRC || "/placeholder.svg"} alt="Toastmasters International logo" className="size-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="agenda-joint-label text-center text-xs font-light uppercase tracking-[0.2em] text-white/75"
                  style={displayFont}
                >
                  Joint Meeting
                </p>
                <h1
                  className="agenda-joint-club-names mt-1 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 text-center text-lg font-black leading-tight"
                  style={displayFont}
                >
                  <span className="min-w-0 text-balance">{clubIdentities[0].name}</span>
                  <span className="text-sm font-light text-white/70" aria-hidden="true">X</span>
                  <span className="min-w-0 text-balance">{clubIdentities[1].name}</span>
                </h1>
                <div className="agenda-joint-club-details mt-2 grid grid-cols-2 gap-5 text-center">
                  {clubIdentities.map((identity, index) => (
                    <div key={`${identity.name}-${index}`} className="min-w-0">
                      <p className="text-pretty text-sm italic leading-tight text-white/80">{identity.slogan}</p>
                      {identity.meta ? <p className="mt-1 text-xs font-medium leading-tight text-white/70">{identity.meta}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="agenda-club-identities grid grid-cols-1 gap-5">
              {clubIdentities.map((identity, index) => (
                <div key={`${identity.name}-${index}`} className="agenda-club-identity flex min-w-0 items-center gap-4">
                  <div className="agenda-club-logo flex size-[72px] min-h-[72px] min-w-[72px] shrink-0 items-center justify-center overflow-hidden p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={CLUB_LOGO_SRC || "/placeholder.svg"} alt={`${identity.name} logo`} className="size-full object-contain" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="agenda-club-name text-balance text-xl font-bold leading-tight" style={displayFont}>
                      {identity.name}
                    </h1>
                    <p className="mt-1 text-pretty text-sm italic text-white/80">{identity.slogan}</p>
                    {identity.meta ? <p className="mt-1 text-xs font-medium text-white/70">{identity.meta}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </header>

        <div className="agenda-information-panel border-b border-border bg-background/90 px-6 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Meeting Information</div>

              {(settings.meetingNumber?.trim() || (settings.isJointMeeting && settings.jointClubInfo.meetingNumber?.trim())) ? (
                <div className="space-y-1 text-sm text-foreground">
                  {settings.meetingNumber?.trim() ? (
                    <div>
                      <span className="font-medium text-muted-foreground">{settings.isJointMeeting ? `${clubName} Meeting No.:` : "Meeting No.:"}</span>{" "}
                      {settings.meetingNumber.trim()}
                    </div>
                  ) : null}
                  {settings.isJointMeeting && settings.jointClubInfo.meetingNumber?.trim() ? (
                    <div>
                      <span className="font-medium text-muted-foreground">{settings.jointClubInfo.clubName?.trim() || "Partner Club"} Meeting No.:</span>{" "}
                      {settings.jointClubInfo.meetingNumber.trim()}
                    </div>
                  ) : null}
                </div>
              ) : null}

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
            <div className="agenda-timezone-panel rounded-lg border border-border bg-secondary/50 px-3 py-2">
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

        <div className="agenda-export-info-block">
          {(settings.wordOfTheDay?.trim() ||
            settings.wordPartOfSpeech?.trim() ||
            settings.wordOfTheDayMeaning?.trim()) ? (
            <div className="agenda-export-word hidden">
              <WordOfTheDayPanel settings={settings} />
            </div>
          ) : null}

          {/* Meeting info bar */}
          <div className="agenda-theme-bar flex flex-wrap items-center justify-between gap-2 bg-[#004165] px-6 py-3 text-white dark:bg-gradient-to-r dark:from-[#3B0104] dark:to-[#781327]">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="font-semibold" style={displayFont}>
                {settings.meetingTitle || "Meeting Agenda"}
              </span>
              {dateLabel && <span className="text-white/80">{dateLabel}</span>}
            </div>
            <span className="agenda-meeting-time text-sm font-medium">
              {displayStartTime} – {displayEndTime}
              <span className="agenda-export-timezone hidden"> ({displayTimeZone})</span>
            </span>
          </div>
        </div>

        {/* Body: session table (main) + club sidebar */}
        <div className={`grid grid-cols-1 ${fullWidth ? "lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" : ""}`}>
          <div className={`min-w-0 ${fullWidth ? "lg:border-r lg:border-border" : ""}`}>
            <div className="overflow-x-auto">
              <table className="agenda-schedule w-full border-collapse text-sm">
                <thead className="agenda-schedule-header">
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
                          allRows={displayRows}
                        />
                      )
                    }
                    return (
                      <AgendaRow
                        key={block.row.id}
                        row={block.row}
                        sectionKey={null}
                        allRows={displayRows}
                      />
                    )
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
            <div className="agenda-summary flex items-center justify-between border-t border-border bg-secondary/50 px-4 py-3 text-xs text-muted-foreground">
              <span>{rows.length} sessions</span>
              <span>Total duration ≈ {formatDuration(totalDuration)}</span>
            </div>
          </div>

          <aside className={`min-w-0 border-t border-border p-5 ${fullWidth ? "lg:border-t-0" : ""}`}>
            {(settings.wordOfTheDay?.trim() || settings.wordPartOfSpeech?.trim() || settings.wordOfTheDayMeaning?.trim()) ? (
              <div className="agenda-sidebar-word mb-6">
                <WordOfTheDayPanel settings={settings} />
              </div>
            ) : null}

            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-primary" style={displayFont}>
              {settings.isJointMeeting ? "Executive Committees" : "Executive Committee"}
            </h2>
            <div className="agenda-committee-groups grid grid-cols-1 gap-5">
              <section className="min-w-0">
                {settings.isJointMeeting ? (
                  <h3 className="mb-2 text-xs font-semibold text-muted-foreground">{clubName}</h3>
                ) : null}
                <dl className="agenda-officer-list flex flex-col gap-1.5 text-sm">
                  {OFFICER_FIELDS.map((field) => {
                    const value = clubInfo[field.key]
                    if (!value) return null
                    return (
                      <div key={field.key} className="flex gap-2">
                        <dt className="shrink-0 font-medium text-muted-foreground">{field.label}:</dt>
                        <dd className="min-w-0 text-card-foreground">{value}</dd>
                      </div>
                    )
                  })}
                </dl>
              </section>

              {settings.isJointMeeting ? (
                <section className="min-w-0">
                  <h3 className="mb-2 text-xs font-semibold text-muted-foreground">
                    {settings.jointClubInfo.clubName?.trim() || "Partner Toastmasters Club"}
                  </h3>
                  <dl className="agenda-officer-list flex flex-col gap-1.5 text-sm">
                    {OFFICER_FIELDS.map((field) => {
                      const value = settings.jointClubInfo[field.key]
                      if (!value) return null
                      return (
                        <div key={field.key} className="flex gap-2">
                          <dt className="shrink-0 font-medium text-muted-foreground">{field.label}:</dt>
                          <dd className="min-w-0 text-card-foreground">{value}</dd>
                        </div>
                      )
                    })}
                  </dl>
                </section>
              ) : null}
            </div>

            <div className="mt-6 rounded-lg bg-secondary/60 p-4">
              {settings.isJointMeeting ? (
                <>
                  <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-primary" style={displayFont}>
                    Membership Information
                  </h2>
                  <div className="agenda-membership-groups grid grid-cols-1 gap-4">
                    <section className="min-w-0 rounded-md border border-border bg-background/60 p-3">
                      <h3 className="text-sm font-semibold text-foreground">{clubName}</h3>
                      <h4 className="mb-2 mt-1 text-xs font-semibold uppercase tracking-wide text-primary">
                        {participantNotesTitle}
                      </h4>
                      {participantNotesBody ? (
                        <NotesContent body={participantNotesBody} />
                      ) : (
                        <p className="text-sm text-muted-foreground">Membership information not provided.</p>
                      )}
                    </section>
                    <section className="min-w-0 rounded-md border border-border bg-background/60 p-3">
                      <h3 className="text-sm font-semibold text-foreground">
                        {settings.jointClubInfo.clubName?.trim() || "Partner Toastmasters Club"}
                      </h3>
                      <h4 className="mb-2 mt-1 text-xs font-semibold uppercase tracking-wide text-primary">
                        {settings.jointClubInfo.participantNotesTitle?.trim() || "How to Become a Member"}
                      </h4>
                      {settings.jointClubInfo.participantNotesBody?.trim() ? (
                        <NotesContent body={settings.jointClubInfo.participantNotesBody} />
                      ) : (
                        <p className="text-sm text-muted-foreground">Membership information not provided.</p>
                      )}
                    </section>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-primary" style={displayFont}>
                    {participantNotesTitle}
                  </h2>
                  <NotesContent body={participantNotesBody} />
                </>
              )}
            </div>

            {(clubInfo.vpmWechatQr || clubInfo.vpmWhatsappQr || clubInfo.vpmContactNote?.trim()) && (
              <div className="mt-6">
                {settings.isJointMeeting ? <p className="mb-2 text-center text-xs font-semibold text-muted-foreground">{clubName}</p> : null}
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
            {settings.isJointMeeting && (
              settings.jointClubInfo.vpmWechatQr ||
              settings.jointClubInfo.vpmWhatsappQr ||
              settings.jointClubInfo.vpmContactNote?.trim()
            ) ? (
              <div className="mt-6 border-t border-border pt-5">
                <p className="mb-2 text-center text-xs font-semibold text-muted-foreground">
                  {settings.jointClubInfo.clubName?.trim() || "Partner Toastmasters Club"}
                </p>
                <div className="flex flex-wrap justify-center gap-6">
                  {settings.jointClubInfo.vpmWechatQr ? <QrBadge src={settings.jointClubInfo.vpmWechatQr} label="WeChat" /> : null}
                  {settings.jointClubInfo.vpmWhatsappQr ? <QrBadge src={settings.jointClubInfo.vpmWhatsappQr} label="WhatsApp" /> : null}
                </div>
                {settings.jointClubInfo.vpmContactNote?.trim() ? (
                  <p className="mt-3 text-pretty text-center text-xs leading-relaxed text-muted-foreground">
                    {settings.jointClubInfo.vpmContactNote.trim()}
                  </p>
                ) : null}
              </div>
            ) : null}
            <ClubMission />
          </aside>
        </div>

        <footer
          id="agenda-footer"
          className="h-auto min-h-0 flex-none border-t border-border bg-background/70 px-6 py-2 text-center text-[11px] leading-4 text-muted-foreground"
        >
          <p>Designed with ♥ by BRICS+ Advanced Online Toastmasters.</p>
          <p className="agenda-platform-note mt-0.5 text-[10px] leading-3">
            Create your own Toastmasters meeting agenda at{" "}
            <a
              href="https://speechaholic.online"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-primary underline decoration-primary/40 underline-offset-2"
            >
              speechaholic.online
            </a>
          </p>
        </footer>
      </article>
    </div>
  )
}

function SectionRows({
  label,
  sectionKey,
  rows,
  allRows,
}: {
  label: string
  sectionKey: string
  rows: ComputedRow[]
  allRows: ComputedRow[]
}) {
  return (
    <>
      <tr className="agenda-section-row border-b border-border/60 bg-[#F2DF74]/20">
        <td colSpan={5} className="px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-foreground">
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span>{label}</span>
            {sectionKey === "evaluations" ? (
              <span className="font-medium normal-case tracking-normal text-muted-foreground">
                Hosted by the General Evaluator
              </span>
            ) : null}
          </span>
        </td>
      </tr>
      {rows.map((row) => (
        <AgendaRow key={row.id} row={row} sectionKey={sectionKey} allRows={allRows} />
      ))}
    </>
  )
}

function AgendaRow({
  row,
  sectionKey,
  allRows,
}: {
  row: ComputedRow
  sectionKey: string | null
  allRows: ComputedRow[]
}) {
  const sessionLabel =
    getIndividualEvaluationLabel(row, allRows) ?? getSectionRowLabel(row, sectionKey)
  const roleLabel = getSectionRoleLabel(row, sectionKey)
  const titleLabel = row.title?.trim() ?? ""
  const presetTitleBadge = getPresetTitleBadge(titleLabel)
  const exportTitleLabel = presetTitleBadge?.code ?? titleLabel
  const isBreak = row.activity === BREAK_ACTIVITY

  return (
    <tr className="agenda-session-row border-b border-border/60 last:border-b-0">
      <td className="agenda-time-cell whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
        <span className="agenda-time-value">{row.start} – {row.end}</span>
        <div className="agenda-export-session-stack hidden">
          <span className="agenda-export-session-time">{row.start} – {row.end}</span>
          <span className="agenda-export-session-title">{sessionLabel}</span>
          <span className="agenda-export-session-role">
            <span>{roleLabel}</span>
            {exportTitleLabel ? (
              <span className="agenda-export-title-label">{exportTitleLabel}</span>
            ) : null}
          </span>
        </div>
      </td>
      <td className="agenda-session-cell px-4 py-3 font-medium text-card-foreground">{sessionLabel}</td>
      <td className="agenda-role-cell px-4 py-3 text-muted-foreground">{roleLabel}</td>
      <td
        className="agenda-title-cell px-4 py-3 text-muted-foreground"
        data-empty-title={!presetTitleBadge && !titleLabel ? "true" : undefined}
      >
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
              <span
                className={
                  presetTitleBadge.kind === "code"
                    ? "agenda-dtm-badge inline-flex min-h-7 min-w-11 items-center justify-center rounded-md border border-[#F2DF74] bg-[#772432] px-2 text-xs font-bold tracking-wide text-white"
                    : "inline-flex min-h-7 min-w-11 items-center justify-center rounded-md border border-border/60 bg-secondary px-2 text-xs font-semibold text-foreground"
                }
              >
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
      <td className="agenda-duration-cell whitespace-nowrap px-4 py-3 text-right text-muted-foreground">
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

function WordOfTheDayPanel({ settings }: { settings: AgendaSettings }) {
  const displayFont = {
    fontFamily:
      "var(--font-montserrat), var(--font-alibaba-puhuiti), ui-sans-serif, system-ui, sans-serif",
  }

  return (
    <div className="rounded-lg border border-[#004165]/30 bg-[#004165] p-4 text-white dark:border-[#004165]/30 dark:bg-[#004165]">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-white" style={displayFont}>
        Word of the Day
      </h2>
      {(settings.wordOfTheDay?.trim() || settings.wordPartOfSpeech?.trim()) ? (
        <p className="text-sm text-white" style={displayFont}>
          {settings.wordOfTheDay?.trim() ? (
            <span className="font-medium not-italic">{settings.wordOfTheDay.trim()}</span>
          ) : null}
          {settings.wordPartOfSpeech?.trim() ? (
            <span className="ml-2 font-light italic text-white/90">
              {settings.wordPartOfSpeech.trim()}
            </span>
          ) : null}
        </p>
      ) : null}
      {settings.wordOfTheDayMeaning?.trim() ? (
        <p className="mt-1 text-sm font-light leading-relaxed text-white/90">
          {settings.wordOfTheDayMeaning.trim()}
        </p>
      ) : null}
    </div>
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

function ClubMission() {
  return (
    <section className="agenda-club-mission mt-6 border-t border-border pt-5">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-primary">Club Mission</h2>
      <p className="text-sm leading-relaxed text-card-foreground">{CLUB_MISSION}</p>
    </section>
  )
}
