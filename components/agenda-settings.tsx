"use client"

import type React from "react"
import { useRef, useState } from "react"
import {
  ACTIVITY_OPTIONS,
  type AgendaSettings,
  type ClubInfo,
  groupSessionsForDisplay,
  OFFICER_FIELDS,
  patchSession,
  type Session,
  makeSession,
  sortSessions,
} from "@/lib/agenda"
import { Button } from "@/components/ui/button"
import { ArrowDownWideNarrow, ChevronRight, Copy, GripVertical, Plus, Trash2, Upload, X } from "lucide-react"

type Props = {
  settings: AgendaSettings
  onChange: (next: AgendaSettings) => void
}

const CUSTOM_VALUE = "__custom__"

export function AgendaSettingsPanel({ settings, onChange }: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  function update(partial: Partial<AgendaSettings>) {
    onChange({ ...settings, ...partial })
  }

  function updateClubInfo(partial: Partial<ClubInfo>) {
    update({ clubInfo: { ...settings.clubInfo, ...partial } })
  }

  function autoSort() {
    update({ sessions: sortSessions(settings.sessions) })
  }

  function updateSession(id: string, partial: Partial<Session>) {
    update({
      sessions: settings.sessions.map((s) => (s.id === id ? patchSession(s, partial) : s)),
    })
  }

  function removeSession(id: string) {
    update({ sessions: settings.sessions.filter((s) => s.id !== id) })
  }

  // Insert a new blank session at the given position
  function insertSession(index: number) {
    const next = [...settings.sessions]
    next.splice(index, 0, makeSession({ activity: "", buffer: settings.defaultBuffer }))
    update({ sessions: next })
  }

  // Duplicate a session and insert the copy at the given position
  function copyInto(sourceIndex: number, targetIndex: number) {
    const source = settings.sessions[sourceIndex]
    if (!source) return
    const next = [...settings.sessions]
    next.splice(targetIndex, 0, makeSession({ ...source }))
    update({ sessions: next })
  }

  function reorder(from: number, to: number) {
    if (from === to) return
    const next = [...settings.sessions]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    update({ sessions: next })
  }

  function addSession() {
    update({
      sessions: [...settings.sessions, makeSession({ activity: "", buffer: settings.defaultBuffer })],
    })
  }

  function applyDefaultBuffer() {
    update({
      sessions: settings.sessions.map((s) => ({ ...s, buffer: settings.defaultBuffer })),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Club information (collapsible, collapsed by default) */}
      <ClubInfoBlock settings={settings} updateClubInfo={updateClubInfo} />

      {/* Meeting settings (collapsible, collapsed by default) */}
      <MeetingSettingsBlock settings={settings} update={update} onApplyBuffer={applyDefaultBuffer} />

      {/* Session list */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-card-foreground">Sessions</h2>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={autoSort}
              title="Sort sessions into the recommended running order"
            >
              <ArrowDownWideNarrow className="size-4" aria-hidden="true" />
              Auto-sort
            </Button>
            <Button type="button" size="sm" onClick={addSession}>
              <Plus className="size-4" aria-hidden="true" />
              Add Session
            </Button>
          </div>
        </div>

        <div className="flex flex-col">
          {groupSessionsForDisplay(settings.sessions).map((group) => (
            <div key={`${group.key}-${group.items[0]?.index ?? 0}`} className="mb-3 last:mb-0">
              {group.divider && <SectionDivider label={group.divider} />}
              <div
                className={
                  group.divider
                    ? "space-y-0 rounded-b-lg border border-t-0 border-primary/20 bg-muted/35 p-2"
                    : "space-y-0"
                }
              >
                {group.items.map(({ session, index }) => {
                  const sectionKey = group.key
                  const isCustom = !ACTIVITY_OPTIONS.includes(session.activity as (typeof ACTIVITY_OPTIONS)[number])
                  const isDragging = dragIndex === index
                  const isOver = overIndex === index && dragIndex !== null && dragIndex !== index
                  return (
                    <div key={session.id}>
                      <RowGap
                        onAdd={() => insertSession(index)}
                        onCopy={index > 0 ? () => copyInto(index - 1, index) : undefined}
                      />

                      <div
                        className={`group relative rounded-lg border p-3 transition-colors ${
                          group.divider
                            ? "border-border/60 bg-background/90"
                            : "border-border bg-background"
                        } ${isDragging ? "border-primary opacity-50" : ""} ${isOver ? "border-primary ring-2 ring-ring/30" : ""}`}
                        onDragOver={(e) => {
                          if (dragIndex === null) return
                          e.preventDefault()
                          setOverIndex(index)
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          if (dragIndex !== null) reorder(dragIndex, index)
                          setDragIndex(null)
                          setOverIndex(null)
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            draggable
                            onDragStart={() => setDragIndex(index)}
                            onDragEnd={() => {
                              setDragIndex(null)
                              setOverIndex(null)
                            }}
                            className="mt-1 shrink-0 cursor-grab touch-none rounded p-0.5 text-muted-foreground hover:bg-muted active:cursor-grabbing"
                            aria-label="Drag to reorder"
                            title="Drag to reorder"
                          >
                            <GripVertical className="size-4" />
                          </button>
                          <span className="mt-1 w-5 shrink-0 text-center text-sm font-medium text-muted-foreground">
                            {index + 1}
                          </span>
                          <div className="flex min-w-0 flex-1 flex-col gap-3">
                            <SessionFields
                              session={session}
                              sectionKey={sectionKey}
                              isCustom={isCustom}
                              onUpdate={(partial) => updateSession(session.id, partial)}
                            />
                          </div>
                          <div className="flex shrink-0 flex-col gap-1">
                            <button
                              type="button"
                              className="rounded p-1 text-destructive hover:bg-destructive/10"
                              onClick={() => removeSession(session.id)}
                              aria-label="Delete"
                              title="Delete"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {index === settings.sessions.length - 1 && (
                        <RowGap onAdd={() => insertSession(index + 1)} onCopy={() => copyInto(index, index + 1)} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          {settings.sessions.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No sessions yet. Click &quot;Add Session&quot; to start.</p>
          )}
        </div>
      </section>
    </div>
  )
}

// Insert zone between sessions: mostly invisible, reveals Add / Copy buttons on hover
function RowGap({ onAdd, onCopy }: { onAdd: () => void; onCopy?: () => void }) {
  return (
    <div className="group/gap relative flex h-4 items-center justify-center">
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-transparent transition-colors group-hover/gap:bg-border" />
      <div className="relative flex items-center gap-1 opacity-0 transition-opacity group-hover/gap:opacity-100">
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground shadow-sm hover:text-foreground"
          aria-label="Add a blank session here"
          title="Add a blank session here"
        >
          <Plus className="size-3" />
          Add
        </button>
        {onCopy && (
          <button
            type="button"
            onClick={onCopy}
            className="flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground shadow-sm hover:text-foreground"
            aria-label="Copy the previous session here"
            title="Copy the previous session here"
          >
            <Copy className="size-3" />
            Copy
          </button>
        )}
      </div>
    </div>
  )
}

// Collapsible Meeting Settings block — collapsed by default
function MeetingSettingsBlock({
  settings,
  update,
  onApplyBuffer,
}: {
  settings: AgendaSettings
  update: (partial: Partial<AgendaSettings>) => void
  onApplyBuffer: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <section className="rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <ChevronRight
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
          aria-hidden="true"
        />
        <span className="text-lg font-semibold text-card-foreground">Meeting Settings</span>
        <span className="ml-auto text-xs text-muted-foreground">Meeting title, date &amp; timing</span>
      </button>

      {open && (
        <div className="border-t border-border px-5 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Meeting Title">
              <input
                className={inputClass}
                value={settings.meetingTitle}
                onChange={(e) => update({ meetingTitle: e.target.value })}
              />
            </Field>
            <Field label="Meeting Date">
              <input
                type="date"
                className={inputClass}
                value={settings.meetingDate}
                onChange={(e) => update({ meetingDate: e.target.value })}
              />
            </Field>
            <Field label="Start Time (GMT+8, China)">
              <input
                type="time"
                className={inputClass}
                value={settings.startTime}
                onChange={(e) => update({ startTime: e.target.value })}
              />
            </Field>
            <Field label="Welcome Before Meeting (min)" hint="Welcome time before the meeting officially starts">
              <input
                type="number"
                min={0}
                className={inputClass}
                value={settings.preWelcome}
                onChange={(e) => update({ preWelcome: Math.max(0, Number(e.target.value) || 0) })}
              />
            </Field>
            <Field label="Word of the Day">
              <input
                className={inputClass}
                placeholder="Enter a keyword or phrase"
                value={settings.wordOfTheDay}
                onChange={(e) => update({ wordOfTheDay: e.target.value })}
              />
            </Field>
            <Field label="Default Buffer (min)" hint="Host transition time between sessions">
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  className={`${inputClass} min-w-0 flex-1`}
                  value={settings.defaultBuffer}
                  onChange={(e) => update({ defaultBuffer: Math.max(0, Number(e.target.value) || 0) })}
                />
                <Button type="button" variant="secondary" size="sm" className="shrink-0" onClick={onApplyBuffer}>
                  Apply
                </Button>
              </div>
            </Field>
          </div>
        </div>
      )}
    </section>
  )
}

// Section divider header — distinct color from session content below
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center rounded-t-lg border border-b-0 border-primary/25 bg-primary/15 px-4 py-2.5">
      <span className="text-sm font-bold uppercase tracking-wide text-primary">{label}</span>
    </div>
  )
}

// Session form fields — layout varies by section divider
function SessionFields({
  session,
  sectionKey,
  isCustom,
  onUpdate,
}: {
  session: Session
  sectionKey: string
  isCustom: boolean
  onUpdate: (partial: Partial<Session>) => void
}) {
  const inSection = sectionKey !== "general"

  function handleActivityChange(nextActivity: string) {
    const nextPresenter = (() => {
      if (nextActivity === "Introduction of the Grammarian") return session.presenter || "Grammarian"
      if (nextActivity === "Grammarian's Report") return session.presenter || "Grammarian"
      if (nextActivity === "Introduction of the Timer") return session.presenter || "Timer"
      if (nextActivity === "Timer's Report") return session.presenter || "Timer"
      return session.presenter
    })()

    onUpdate({ activity: nextActivity, presenter: nextPresenter })
  }

  return (
    <>
      <ActivitySelector session={session} isCustom={isCustom} onUpdate={onUpdate} compact={inSection} />

      {sectionKey === "prepared-speeches" && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            className={`${inputClass} min-w-0`}
            placeholder="Speech Title"
            value={session.speechTitle ?? ""}
            onChange={(e) => onUpdate({ speechTitle: e.target.value })}
          />
          <input
            className={`${inputClass} min-w-0`}
            placeholder="Speaker"
            value={session.presenter}
            onChange={(e) => onUpdate({ presenter: e.target.value })}
          />
        </div>
      )}

      {sectionKey === "table-topics" && (
        <>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              className={`${inputClass} min-w-0`}
              placeholder="Table Topics Theme"
              value={session.tableTopicsTheme ?? ""}
              onChange={(e) => onUpdate({ tableTopicsTheme: e.target.value })}
            />
            <input
              className={`${inputClass} min-w-0`}
              placeholder="Table Topics Master"
              value={session.presenter}
              onChange={(e) => onUpdate({ presenter: e.target.value })}
            />
          </div>
          <label className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>Time per participant</span>
            <input
              type="number"
              min={0}
              step={0.5}
              className={`${inputClass} w-20`}
              value={session.participantTimeLimit ?? 2}
              onChange={(e) => onUpdate({ participantTimeLimit: Math.max(0, Number(e.target.value) || 0) })}
            />
            <span>min</span>
          </label>
        </>
      )}

      {sectionKey === "general" && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <input
            className={`${inputClass} min-w-0`}
            placeholder="Presenter / Role"
            value={session.presenter}
            onChange={(e) => onUpdate({ presenter: e.target.value })}
          />
          <BufferField session={session} onUpdate={onUpdate} inline />
        </div>
      )}

      {(sectionKey === "break" || sectionKey === "evaluations" || sectionKey === "closing") && (
        <input
          className={`${inputClass} min-w-0`}
          placeholder="Presenter / Role"
          value={session.presenter}
          onChange={(e) => onUpdate({ presenter: e.target.value })}
        />
      )}

      <DurationRangeFields session={session} onUpdate={onUpdate} showBuffer={sectionKey !== "general"} />
    </>
  )
}

function ActivitySelector({
  session,
  isCustom,
  onUpdate,
  compact = false,
}: {
  session: Session
  isCustom: boolean
  onUpdate: (partial: Partial<Session>) => void
  compact?: boolean
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-2 ${compact ? "sm:flex-row sm:items-center" : "sm:flex-row"}`}>
      <select
        className={`${inputClass} w-full min-w-0 ${compact ? "sm:max-w-xs" : "sm:flex-1"}`}
        value={isCustom ? CUSTOM_VALUE : session.activity}
        onChange={(e) => {
          if (e.target.value === CUSTOM_VALUE) {
            onUpdate({ activity: "" })
          } else {
            handleActivityChange(e.target.value)
          }
        }}
      >
        {ACTIVITY_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
        <option value={CUSTOM_VALUE}>Custom…</option>
      </select>
      {isCustom && (
        <input
          className={`${inputClass} w-full min-w-0 ${compact ? "sm:flex-1" : "sm:flex-1"}`}
          placeholder="Enter custom session name"
          value={session.activity}
          onChange={(e) => onUpdate({ activity: e.target.value })}
        />
      )}
    </div>
  )
}

function DurationRangeFields({
  session,
  onUpdate,
  showBuffer = true,
  inline = false,
}: {
  session: Session
  onUpdate: (partial: Partial<Session>) => void
  showBuffer?: boolean
  inline?: boolean
}) {
  const durationFields = (
    <div className="flex flex-col gap-2">
      <label className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span className="shrink-0 font-medium text-foreground">Duration</span>
        <input
          type="number"
          min={0}
          step={0.5}
          className={`${inputClass} w-16`}
          value={session.durationMin}
          onChange={(e) => {
            const nextMin = Math.max(0, Number(e.target.value) || 0)
            onUpdate({ durationMin: nextMin, durationMax: Math.max(nextMin, session.durationMax) })
          }}
        />
        <span>–</span>
        <input
          type="number"
          min={0}
          step={0.5}
          className={`${inputClass} w-16`}
          value={session.durationMax}
          onChange={(e) => {
            const nextMax = Math.max(0, Number(e.target.value) || 0)
            onUpdate({ durationMax: Math.max(nextMax, session.durationMin) })
          }}
        />
        <span>min</span>
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <TimerThresholdInput
          color="green"
          label="Green"
          value={session.timerGreen}
          onChange={(timerGreen) => onUpdate({ timerGreen })}
        />
        <TimerThresholdInput
          color="yellow"
          label="Yellow"
          value={session.timerYellow}
          onChange={(timerYellow) => onUpdate({ timerYellow })}
        />
        <TimerThresholdInput
          color="red"
          label="Red"
          value={session.timerRed}
          onChange={(timerRed) => onUpdate({ timerRed })}
        />
      </div>
    </div>
  )

  if (!showBuffer) {
    return inline ? durationFields : <div>{durationFields}</div>
  }

  return (
    <div className={`flex flex-col gap-2 ${inline ? "" : "sm:flex-row sm:items-end sm:justify-between"}`}>
      <div className="min-w-0 flex-1">{durationFields}</div>
      <BufferField session={session} onUpdate={onUpdate} inline />
    </div>
  )
}

function TimerThresholdInput({
  color,
  label,
  value,
  onChange,
}: {
  color: "green" | "yellow" | "red"
  label: string
  value: number
  onChange: (value: number) => void
}) {
  const swatchClass =
    color === "green"
      ? "bg-emerald-500"
      : color === "yellow"
        ? "bg-amber-400"
        : "bg-red-500"

  return (
    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`size-3 shrink-0 rounded-sm ${swatchClass}`} aria-hidden="true" />
      <span className="sr-only">{label}</span>
      <input
        type="number"
        min={0}
        step={0.5}
        className={`${inputClass} w-14 px-2 py-1 text-xs`}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        title={`${label} at ${value} min`}
      />
      <span>′</span>
    </label>
  )
}

function BufferField({
  session,
  onUpdate,
  inline = false,
}: {
  session: Session
  onUpdate: (partial: Partial<Session>) => void
  inline?: boolean
}) {
  const field = (
    <label className="flex items-center gap-1 text-sm text-muted-foreground">
      <input
        type="number"
        min={0}
        className={`${inputClass} w-16`}
        value={session.buffer}
        onChange={(e) => onUpdate({ buffer: Math.max(0, Number(e.target.value) || 0) })}
      />
      buffer
    </label>
  )

  return inline ? field : <div className="flex justify-end">{field}</div>
}

// Collapsible Club Information block — collapsed by default
function ClubInfoBlock({
  settings,
  updateClubInfo,
}: {
  settings: AgendaSettings
  updateClubInfo: (partial: Partial<ClubInfo>) => void
}) {
  const [open, setOpen] = useState(false)
  const { clubInfo } = settings

  return (
    <section className="rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <ChevronRight
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
          aria-hidden="true"
        />
        <span className="text-lg font-semibold text-card-foreground">Club Information</span>
        <span className="ml-auto text-xs text-muted-foreground">Executive Committee &amp; QR codes</span>
      </button>

      {open && (
        <div className="border-t border-border px-5 py-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Executive Committee</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {OFFICER_FIELDS.map((f) => (
              <Field key={f.key} label={f.label}>
                <input
                  className={inputClass}
                  value={clubInfo[f.key]}
                  onChange={(e) => updateClubInfo({ [f.key]: e.target.value } as Partial<ClubInfo>)}
                />
              </Field>
            ))}
          </div>

          <h3 className="mb-3 mt-6 text-sm font-semibold text-foreground">Zoom Meeting</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Zoom Meeting ID">
              <input
                className={inputClass}
                value={clubInfo.zoomMeetingId}
                onChange={(e) => updateClubInfo({ zoomMeetingId: e.target.value })}
              />
            </Field>
            <Field label="Passcode">
              <input
                className={inputClass}
                value={clubInfo.zoomPasscode}
                onChange={(e) => updateClubInfo({ zoomPasscode: e.target.value })}
              />
            </Field>
          </div>

          <h3 className="mb-3 mt-6 text-sm font-semibold text-foreground">VPM Contact QR Codes</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <QrUpload
              label="WeChat QR"
              value={clubInfo.vpmWechatQr}
              onChange={(v) => updateClubInfo({ vpmWechatQr: v })}
            />
            <QrUpload
              label="WhatsApp QR"
              value={clubInfo.vpmWhatsappQr}
              onChange={(v) => updateClubInfo({ vpmWhatsappQr: v })}
            />
          </div>
        </div>
      )}
    </section>
  )
}

// QR image upload field — stores the image as a data URL for persistence
function QrUpload({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (dataUrl: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onChange(typeof reader.result === "string" ? reader.result : "")
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-dashed border-input bg-background">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value || "/placeholder.svg"} alt={`${label} preview`} className="size-full object-contain" />
          ) : (
            <span className="text-[10px] text-muted-foreground">No image</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
            <Upload className="size-4" aria-hidden="true" />
            Upload
          </Button>
          {value && (
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange("")}>
              <X className="size-4" aria-hidden="true" />
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

const inputClass =
  "rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/40"

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}
