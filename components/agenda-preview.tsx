"use client"

import {
  type AgendaSettings,
  buildPreviewBlocks,
  BREAK_ACTIVITY,
  CLUB_LOGO_SRC,
  CLUB_META,
  CLUB_MISSION,
  CLUB_NAME,
  type ComputedRow,
  formatDuration,
  formatDurationRange,
  getMeetingTimeConversions,
  getSectionRoleLabel,
  getSectionRowLabel,
  OFFICER_FIELDS,
  computeSchedule,
} from "@/lib/agenda"

type Props = {
  settings: AgendaSettings
  fullWidth?: boolean
}

const MEMBERSHIP_STEPS = [
  "Attend one full meeting",
  "Serve as a role taker at least once",
  "Join one of the officer teams (VPE / VPM / VPPR, etc.) and practice servant leadership skills",
  "Pass the Executive Committee's interview",
]

export function AgendaPreview({ settings, fullWidth = false }: Props) {
  const { rows, totalDuration, startTime, endTime } = computeSchedule(settings)
  const previewBlocks = buildPreviewBlocks(rows)
  const { clubInfo } = settings
  const convertedTimes = getMeetingTimeConversions(settings.startTime)

  const dateLabel = settings.meetingDate
    ? new Date(settings.meetingDate + "T00:00:00").toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      })
    : ""

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
              <h1 className="text-balance text-xl font-bold leading-tight">{CLUB_NAME}</h1>
              <p className="mt-1 text-pretty text-sm italic text-white/80">{CLUB_MISSION}</p>
              <p className="mt-1 text-xs font-medium text-white/70">{CLUB_META}</p>
            </div>
          </div>
        </header>

        <div className="border-b border-border bg-background/90 px-6 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Zoom Meeting</div>
              <div className="space-y-1 text-sm text-foreground">
                <div>
                  <span className="font-medium text-muted-foreground">Meeting ID:</span> {clubInfo.zoomMeetingId || "286 785 5900"}
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Passcode:</span> {clubInfo.zoomPasscode || "2025BRICS"}
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-secondary/50 px-3 py-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Local time conversions</div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-foreground">
                {convertedTimes.map((item) => (
                  <span key={item.label}>
                    <span className="font-medium text-muted-foreground">{item.label}:</span> {item.time}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Meeting info bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#004165] px-6 py-3 text-white">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="font-semibold">{settings.meetingTitle || "Meeting Agenda"}</span>
            {dateLabel && <span className="text-white/80">{dateLabel}</span>}
          </div>
          <span className="text-sm font-medium">
            {startTime} – {endTime}
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
                    <th className="px-4 py-2 text-right font-medium">
                      <div className="flex flex-col items-end gap-1">
                        <span>Duration</span>
                        <div className="flex flex-wrap items-center justify-end gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-1.5 py-0.5">
                            <span className="size-2.5 rounded-full bg-emerald-500 ring-1 ring-background" />Green
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-1.5 py-0.5">
                            <span className="size-2.5 rounded-full bg-amber-400 ring-1 ring-background" />Yellow
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-1.5 py-0.5">
                            <span className="size-2.5 rounded-full bg-red-500 ring-1 ring-background" />Red
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
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
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
            {settings.wordOfTheDay?.trim() ? (
              <div className="mb-6 rounded-lg border border-[#004165]/30 bg-[#004165] p-4 text-white dark:border-[#004165]/30 dark:bg-[#004165]">
                <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-white">Word of the Day</h2>
                <p className="text-sm font-medium text-white">{settings.wordOfTheDay.trim()}</p>
              </div>
            ) : null}

            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-primary">Executive Committee</h2>
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
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-primary">How to Become a Member</h2>
              <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm text-card-foreground">
                {MEMBERSHIP_STEPS.map((step) => (
                  <li key={step} className="text-pretty">
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {(clubInfo.vpmWechatQr || clubInfo.vpmWhatsappQr) && (
              <div className="mt-6">
                <div className="flex flex-wrap justify-center gap-6">
                  {clubInfo.vpmWechatQr && <QrBadge src={clubInfo.vpmWechatQr} label="WeChat" />}
                  {clubInfo.vpmWhatsappQr && <QrBadge src={clubInfo.vpmWhatsappQr} label="WhatsApp" />}
                </div>
                <p className="mt-3 text-pretty text-center text-xs text-muted-foreground">
                  Add our Vice President Membership (VPM), {clubInfo.vpm || "TBD"}, to learn more. Note: Please mention
                  {' "BRICS"'} in your friend request!
                </p>
              </div>
            )}
          </aside>
        </div>
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
        <td colSpan={4} className="px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-foreground">
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
  const isBreak = row.activity === BREAK_ACTIVITY

  return (
    <tr className="border-b border-border/60 last:border-b-0">
      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
        {row.start} – {row.end}
      </td>
      <td className="px-4 py-3 font-medium text-card-foreground">{sessionLabel}</td>
      <td className="px-4 py-3 text-muted-foreground">{roleLabel}</td>
      <td className="whitespace-nowrap px-4 py-3 text-right text-muted-foreground">
        <div className="flex flex-col items-end gap-1">
          <span>{formatDurationRange(row.durationMin, row.durationMax)}</span>
          {!isBreak && (
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
        </div>
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
