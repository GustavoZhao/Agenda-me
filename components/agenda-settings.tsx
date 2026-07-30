"use client"

import type React from "react"
import { useEffect, useState } from "react"
import {
  ACTIVITY_OPTIONS,
  BOOK_CLUB_ACTIVITY,
  BOOK_CLUB_CLOSING_REFLECTION_ACTIVITY,
  BOOK_CLUB_DISCUSSION_ACTIVITY,
  BOOK_CLUB_GRAMMARIAN_REPORT_ACTIVITY,
  BOOK_CLUB_MINI_FEEDBACK_ACTIVITY,
  BOOK_CLUB_TABLE_TOPICS_ACTIVITY,
  type AgendaSettings,
  type AgendaTemplateId,
  type ClubInfo,
  findCredentialForMemberName,
  createAgendaTemplateSessions,
  groupSessionsForDisplay,
  MEMBERSHIP_CSV_PATH,
  type MembershipCredentialEntry,
  normalizeCredentialTitle,
  OFFICER_FIELDS,
  patchSession,
  type Session,
  makeSession,
  TABLE_TOPICS_EVALUATION_ACTIVITY,
  TITLE_OTHER_OPTION,
  TITLE_PRESET_OPTIONS,
  parseMembershipCredentialCsv,
  sortSessions,
  setMeetingSaa,
} from "@/lib/agenda"
import { Button } from "@/components/ui/button"
import { SmartImport } from "@/components/smart-import"
import { ArrowDownWideNarrow, ChevronRight, Copy, GripVertical, Plus, Trash2 } from "lucide-react"
import { TIME_ZONE_OPTIONS } from "@/lib/time-zones"

type Props = {
  settings: AgendaSettings
  onChange: (next: AgendaSettings) => void
  showClubInfo?: boolean
}

const CUSTOM_VALUE = "__custom__"
const OTHER_PLATFORM_VALUE = "__other_platform__"
const ONLINE_PLATFORMS = ["Zoom", "Teams", "Tencent Meeting"] as const

export function AgendaSettingsPanel({ settings, onChange, showClubInfo = true }: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overDropIndex, setOverDropIndex] = useState<number | null>(null)
  const [credentialEntries, setCredentialEntries] = useState<MembershipCredentialEntry[]>([])
  const [initialCredentialBackfillDone, setInitialCredentialBackfillDone] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadCredentials() {
      try {
        const response = await fetch(MEMBERSHIP_CSV_PATH)
        if (!response.ok) return
        const csv = await response.text()
        if (cancelled) return
        setCredentialEntries(parseMembershipCredentialCsv(csv))
      } catch {
        // keep manual entry if membership file is unavailable
      }
    }

    loadCredentials()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (credentialEntries.length === 0 || initialCredentialBackfillDone) return

    let changed = false
    const nextSessions = settings.sessions.map((session) => {
      if (session.title?.trim()) return session
      const credential = findCredentialForMemberName(session.presenter, credentialEntries)
      if (!credential) return session
      changed = true
      return { ...session, title: normalizeCredentialTitle(credential) }
    })

    if (changed) {
      onChange({ ...settings, sessions: nextSessions })
    }
    setInitialCredentialBackfillDone(true)
  }, [credentialEntries, initialCredentialBackfillDone, onChange, settings])

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
    const current = settings.sessions.find((session) => session.id === id)
    let nextPartial = partial

    const nextPresenter = partial.presenter?.trim()
    const titleAlreadyProvided = partial.title !== undefined
    const currentTitle = current?.title?.trim() ?? ""
    if (
      current &&
      nextPresenter &&
      !titleAlreadyProvided &&
      !currentTitle &&
      credentialEntries.length > 0
    ) {
      const credential = findCredentialForMemberName(nextPresenter, credentialEntries)
      if (credential) {
        nextPartial = { ...partial, title: normalizeCredentialTitle(credential) }
      }
    }

    const updatedSessions = settings.sessions.map((s) => (s.id === id ? patchSession(s, nextPartial) : s))
    const updatedSession = updatedSessions.find((session) => session.id === id)

    if (
      updatedSession &&
      partial.presenter !== undefined &&
      (updatedSession.activity === "Introduction of the Grammarian" ||
        updatedSession.activity === "Introduction of the Timer")
    ) {
      const reportActivity =
        updatedSession.activity === "Introduction of the Grammarian"
          ? "Grammarian's Report"
          : "Timer's Report"
      update({
        sessions: updatedSessions.map((session) =>
          session.activity === reportActivity
            ? { ...session, presenter: updatedSession.presenter, title: updatedSession.title }
            : session
        ),
      })
      return
    }

    update({ sessions: updatedSessions })
  }

  function getDefaultPresenter(activity: string, currentPresenter: string): string {
    if (activity === "Introduction of the Grammarian") return currentPresenter || "Grammarian"
    if (activity === "Grammarian's Report") return currentPresenter || "Grammarian"
    if (activity === "Introduction of the Timer") return currentPresenter || "Timer"
    if (activity === "Timer's Report") return currentPresenter || "Timer"
    if (activity === "Table Topics") return currentPresenter || "Table Topics Master"
    if (activity === BOOK_CLUB_DISCUSSION_ACTIVITY || activity === BOOK_CLUB_TABLE_TOPICS_ACTIVITY) {
      return currentPresenter || "Book Club Master"
    }
    if (activity === BOOK_CLUB_MINI_FEEDBACK_ACTIVITY) return currentPresenter || "Book Club Master"
    if (activity === BOOK_CLUB_CLOSING_REFLECTION_ACTIVITY) return currentPresenter || "Book Club Master"
    if (activity === BOOK_CLUB_GRAMMARIAN_REPORT_ACTIVITY) return currentPresenter || "Grammarian"
    if (activity === TABLE_TOPICS_EVALUATION_ACTIVITY) return currentPresenter || "Table Topics Evaluator"
    return currentPresenter
  }

  function changeSessionActivity(sessionId: string, index: number, nextActivity: string) {
    const current = settings.sessions[index]
    if (!current || current.id !== sessionId) return

    if (nextActivity === BOOK_CLUB_ACTIVITY) {
      const retained = settings.sessions.filter((session, i) => {
        if (i === index) return true
        return session.activity !== "Table Topics"
      })

      const replacementIndex = retained.findIndex((session) => session.id === sessionId)
      if (replacementIndex === -1) return

      const sharedPresenter = current.presenter || "Book Club Master"
      const discussion = patchSession(current, {
        activity: BOOK_CLUB_DISCUSSION_ACTIVITY,
        presenter: sharedPresenter,
        durationMin: 25,
        durationMax: 25,
        buffer: 0,
      })
      const tableTopics = makeSession({
        activity: BOOK_CLUB_TABLE_TOPICS_ACTIVITY,
        presenter: sharedPresenter,
        title: current.title,
        tableTopicsTheme: current.tableTopicsTheme,
        participantTimeLimit: current.participantTimeLimit ?? 2,
        durationMin: 25,
        durationMax: 25,
        buffer: 1,
      })
      const miniFeedback = makeSession({
        activity: BOOK_CLUB_MINI_FEEDBACK_ACTIVITY,
        presenter: sharedPresenter,
        durationMin: 3,
        durationMax: 4,
        buffer: 1,
      })
      const grammarianReport = makeSession({
        activity: BOOK_CLUB_GRAMMARIAN_REPORT_ACTIVITY,
        presenter: "Grammarian",
        durationMin: 2,
        durationMax: 2,
        buffer: 1,
      })
      const closingReflection = makeSession({
        activity: BOOK_CLUB_CLOSING_REFLECTION_ACTIVITY,
        presenter: sharedPresenter,
        durationMin: 5,
        durationMax: 5,
        buffer: current.buffer,
      })

      const nextSessions = [...retained]
      nextSessions.splice(
        replacementIndex,
        1,
        discussion,
        tableTopics,
        miniFeedback,
        grammarianReport,
        closingReflection,
      )
      update({ sessions: nextSessions })
      return
    }

    updateSession(sessionId, {
      activity: nextActivity,
      presenter: getDefaultPresenter(nextActivity, current.presenter),
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
    if (from === to || from + 1 === to) return
    const next = [...settings.sessions]
    const [moved] = next.splice(from, 1)
    const target = from < to ? to - 1 : to
    next.splice(target, 0, moved)
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
      {/* Smart import */}
      <SmartImport settings={settings} onChange={onChange} />

      {/* Club information is managed in the dedicated Club Settings page. */}
      {showClubInfo ? <ClubInfoBlock settings={settings} updateClubInfo={updateClubInfo} /> : null}

      {/* Meeting settings (collapsible, collapsed by default) */}
      <MeetingSettingsBlock settings={settings} update={update} onApplyBuffer={applyDefaultBuffer} />

      {/* Session list */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-card-foreground">Sessions</h2>
          <div className="flex flex-wrap items-center gap-2">
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
          {settings.sessions.length > 0 && (
            <RowGap
              onAdd={() => insertSession(0)}
              dropIndex={0}
              activeDragIndex={dragIndex}
              isDropTarget={overDropIndex === 0}
              onDragOverDrop={() => setOverDropIndex(0)}
              onDropAt={() => {
                if (dragIndex !== null) reorder(dragIndex, 0)
                setDragIndex(null)
                setOverDropIndex(null)
              }}
            />
          )}
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
                  return (
                    <div key={session.id}>
                      <div
                        className={`group relative rounded-lg border p-3 transition-colors ${
                          group.divider
                            ? "border-border/60 bg-background/90"
                            : "border-border bg-background"
                        } ${isDragging ? "border-primary opacity-50" : ""}`}
                      >
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            draggable
                            onDragStart={() => setDragIndex(index)}
                            onDragEnd={() => {
                              setDragIndex(null)
                              setOverDropIndex(null)
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
                              allSessions={settings.sessions}
                              sectionKey={sectionKey}
                              isCustom={isCustom}
                              onActivityChange={(nextActivity) => changeSessionActivity(session.id, index, nextActivity)}
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

                      <RowGap
                        onAdd={() => insertSession(index + 1)}
                        onCopy={() => copyInto(index, index + 1)}
                        dropIndex={index + 1}
                        activeDragIndex={dragIndex}
                        isDropTarget={overDropIndex === index + 1}
                        onDragOverDrop={() => setOverDropIndex(index + 1)}
                        onDropAt={() => {
                          if (dragIndex !== null) reorder(dragIndex, index + 1)
                          setDragIndex(null)
                          setOverDropIndex(null)
                        }}
                      />
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

// Insert zone between sessions: reveals Add / Copy and acts as drag insertion target
function RowGap({
  onAdd,
  onCopy,
  dropIndex,
  activeDragIndex,
  isDropTarget,
  onDragOverDrop,
  onDropAt,
}: {
  onAdd: () => void
  onCopy?: () => void
  dropIndex?: number
  activeDragIndex?: number | null
  isDropTarget?: boolean
  onDragOverDrop?: () => void
  onDropAt?: () => void
}) {
  const dragFrom = activeDragIndex ?? null
  const canDropHere =
    dragFrom !== null &&
    dropIndex !== undefined &&
    dragFrom !== dropIndex &&
    dragFrom + 1 !== dropIndex

  return (
    <div
      className="group/gap relative flex h-5 items-center justify-center"
      onDragOver={(e) => {
        if (!canDropHere) return
        e.preventDefault()
        onDragOverDrop?.()
      }}
      onDrop={(e) => {
        if (!canDropHere) return
        e.preventDefault()
        onDropAt?.()
      }}
    >
      <div
        className={`absolute inset-x-0 top-1/2 h-px -translate-y-1/2 transition-colors ${
          isDropTarget ? "bg-primary" : "bg-transparent group-hover/gap:bg-border"
        }`}
      />
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
  const [selectedTemplate, setSelectedTemplate] = useState<AgendaTemplateId | "">("")
  const initialPlatform = settings.clubInfo.onlinePlatform.trim()
  const [customPlatformSelected, setCustomPlatformSelected] = useState(
    Boolean(initialPlatform) && !ONLINE_PLATFORMS.includes(initialPlatform as (typeof ONLINE_PLATFORMS)[number]),
  )

  function updateMeetingInfo(partial: Partial<ClubInfo>) {
    update({ clubInfo: { ...settings.clubInfo, ...partial } })
  }

  function applyTemplate(template: AgendaTemplateId) {
    const confirmed = window.confirm(
      "Apply this template? It will replace all sessions currently in the agenda."
    )
    if (!confirmed) return
    setSelectedTemplate(template)
    update({ sessions: createAgendaTemplateSessions(template, settings.meetingSaa) })
  }

  const selectedMeetingType = settings.clubInfo.meetingType === "in_person" ? "in_person" : "online"
  const selectedPlatform = customPlatformSelected
    ? OTHER_PLATFORM_VALUE
    : ONLINE_PLATFORMS.includes(settings.clubInfo.onlinePlatform as (typeof ONLINE_PLATFORMS)[number])
      ? settings.clubInfo.onlinePlatform
      : "Zoom"

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
            <Field label="Template" hint="Selecting a template replaces the current session list.">
              <select
                className={inputClass}
                value={selectedTemplate}
                onChange={(event) => {
                  const value = event.target.value as AgendaTemplateId | ""
                  if (value) applyTemplate(value)
                }}
              >
                <option value="">Choose a meeting template…</option>
                <option value="standard">Standard 3-Speech Meeting</option>
                <option value="book-club">Book Club (BRICS+)</option>
                <option value="speechathon">Speechathon</option>
              </select>
            </Field>
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
            <Field label="Start Time">
              <input
                type="time"
                className={inputClass}
                value={settings.startTime}
                onChange={(e) => update({ startTime: e.target.value })}
              />
            </Field>
            <Field
              label="Meeting Timezone"
              hint="This timezone becomes the default in the agenda preview."
            >
              <select
                className={inputClass}
                value={settings.meetingTimeZone}
                onChange={(event) => update({ meetingTimeZone: event.target.value })}
              >
                {TIME_ZONE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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
            <Field label="Meeting SAA" hint="Meeting role only; this does not change the club officer record.">
              <input
                className={inputClass}
                value={settings.meetingSaa}
                onChange={(e) => update(setMeetingSaa(settings, e.target.value))}
                placeholder="Meeting SAA"
              />
            </Field>
            <Field label="Word of the Day">
              <input
                className={inputClass}
                placeholder="Word"
                value={settings.wordOfTheDay}
                onChange={(e) => update({ wordOfTheDay: e.target.value })}
              />
            </Field>
            <Field label="Part of Speech">
              <input
                className={inputClass}
                placeholder="e.g. noun, verb, adjective"
                value={settings.wordPartOfSpeech}
                onChange={(e) => update({ wordPartOfSpeech: e.target.value })}
              />
            </Field>
            <Field label="Word Meaning / Definition" hint="Optional explanation for the word">
              <textarea
                className={`${inputClass} min-h-28 resize-y overflow-y-auto`}
                placeholder="Enter a brief definition"
                value={settings.wordOfTheDayMeaning}
                onChange={(e) => update({ wordOfTheDayMeaning: e.target.value })}
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

          <div className="mt-6 border-t border-border pt-5">
            <h3 className="text-sm font-semibold text-foreground">Meeting Information</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Choose how attendees will join this meeting.
            </p>

            <div className="mt-3 inline-flex max-w-full rounded-lg border border-border bg-muted/50 p-1">
              {([
                { value: "online", label: "Online" },
                { value: "in_person", label: "In person" },
              ] as const).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selectedMeetingType === option.value}
                  onClick={() => updateMeetingInfo({ meetingType: option.value })}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    selectedMeetingType === option.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {selectedMeetingType === "in_person" ? (
              <div className="mt-4">
                <Field label="Meeting Address">
                  <input
                    className={inputClass}
                    value={settings.clubInfo.inPersonAddress}
                    onChange={(event) => updateMeetingInfo({ inPersonAddress: event.target.value })}
                    placeholder="Enter the venue name and full address"
                  />
                </Field>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Meeting Platform">
                  <select
                    className={inputClass}
                    value={selectedPlatform}
                    onChange={(event) => {
                      if (event.target.value === OTHER_PLATFORM_VALUE) {
                        setCustomPlatformSelected(true)
                        updateMeetingInfo({ onlinePlatform: "" })
                        return
                      }
                      setCustomPlatformSelected(false)
                      updateMeetingInfo({ onlinePlatform: event.target.value })
                    }}
                  >
                    {ONLINE_PLATFORMS.map((platform) => (
                      <option key={platform} value={platform}>{platform}</option>
                    ))}
                    <option value={OTHER_PLATFORM_VALUE}>Other</option>
                  </select>
                </Field>

                {customPlatformSelected ? (
                  <Field label="Other Platform">
                    <input
                      className={inputClass}
                      value={settings.clubInfo.onlinePlatform}
                      onChange={(event) => updateMeetingInfo({ onlinePlatform: event.target.value })}
                      placeholder="Enter the platform name"
                    />
                  </Field>
                ) : null}

                <Field label="Meeting ID">
                  <input
                    className={inputClass}
                    value={settings.clubInfo.onlineMeetingId}
                    onChange={(event) => updateMeetingInfo({ onlineMeetingId: event.target.value })}
                    placeholder="Enter the meeting ID"
                  />
                </Field>

                <Field label="Passcode">
                  <input
                    className={inputClass}
                    value={settings.clubInfo.onlinePasscode}
                    onChange={(event) => updateMeetingInfo({ onlinePasscode: event.target.value })}
                    placeholder="Enter the meeting passcode"
                  />
                </Field>
              </div>
            )}
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
  allSessions,
  sectionKey,
  isCustom,
  onActivityChange,
  onUpdate,
}: {
  session: Session
  allSessions: Session[]
  sectionKey: string
  isCustom: boolean
  onActivityChange: (nextActivity: string) => void
  onUpdate: (partial: Partial<Session>) => void
}) {
  const inSection = sectionKey !== "general"
  const preparedSpeechOptions = allSessions.filter((candidate) => candidate.activity === "Prepared Speech")
  const isLinkedReport = session.activity === "Grammarian's Report" || session.activity === "Timer's Report"

  return (
    <>
      <ActivitySelector
        session={session}
        isCustom={isCustom}
        onUpdate={onUpdate}
        compact={inSection}
        onActivityChange={onActivityChange}
      />

      {sectionKey === "prepared-speeches" && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
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
          <TitleField value={session.title ?? ""} onChange={(title) => onUpdate({ title })} />
        </div>
      )}

      {sectionKey === "book-club" && (
        <>
          {session.activity === BOOK_CLUB_TABLE_TOPICS_ACTIVITY ? (
            <>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <input
                  className={`${inputClass} min-w-0`}
                  placeholder="Table Topics Theme"
                  value={session.tableTopicsTheme ?? ""}
                  onChange={(e) => onUpdate({ tableTopicsTheme: e.target.value })}
                />
                <input
                  className={`${inputClass} min-w-0`}
                  placeholder="Book Club Master"
                  value={session.presenter}
                  onChange={(e) => onUpdate({ presenter: e.target.value })}
                />
                <TitleField value={session.title ?? ""} onChange={(title) => onUpdate({ title })} />
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
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                className={`${inputClass} min-w-0`}
                placeholder="Book Club Master"
                value={session.presenter}
                onChange={(e) => onUpdate({ presenter: e.target.value })}
              />
              <TitleField value={session.title ?? ""} onChange={(title) => onUpdate({ title })} />
            </div>
          )}
        </>
      )}

      {sectionKey === "table-topics" && (
        <>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
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
            <TitleField value={session.title ?? ""} onChange={(title) => onUpdate({ title })} />
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
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <input
            className={`${inputClass} min-w-0`}
            placeholder="Presenter / Role"
            value={session.presenter}
            onChange={(e) => onUpdate({ presenter: e.target.value })}
          />
          <TitleField value={session.title ?? ""} onChange={(title) => onUpdate({ title })} />
          <BufferField session={session} onUpdate={onUpdate} inline />
        </div>
      )}

      {sectionKey === "break" && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input
            className={`${inputClass} min-w-0`}
            placeholder="Break title"
            value={session.speechTitle ?? ""}
            onChange={(e) => onUpdate({ speechTitle: e.target.value })}
          />
          <input
            className={`${inputClass} min-w-0`}
            placeholder="Presenter / Role"
            value={session.presenter}
            onChange={(e) => onUpdate({ presenter: e.target.value })}
          />
          <TitleField value={session.title ?? ""} onChange={(title) => onUpdate({ title })} />
        </div>
      )}

      {(sectionKey === "evaluations" || sectionKey === "closing") && (
        <div className={`grid grid-cols-1 gap-2 ${session.activity === "Individual Evaluation" ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          <input
            className={`${inputClass} min-w-0`}
            placeholder="Presenter / Role"
            value={session.presenter}
            onChange={(e) => onUpdate({ presenter: e.target.value })}
            disabled={isLinkedReport}
            title={isLinkedReport ? "Automatically synchronized with the corresponding introduction role." : undefined}
          />
          {session.activity === "Individual Evaluation" ? (
            <select
              className={`${inputClass} min-w-0`}
              value={session.evaluatedSessionId ?? ""}
              onChange={(event) => onUpdate({ evaluatedSessionId: event.target.value })}
              aria-label="Speech being evaluated"
            >
              <option value="">Select speaker to evaluate…</option>
              {preparedSpeechOptions.map((speech, index) => (
                <option key={speech.id} value={speech.id}>
                  {speech.presenter?.trim() || `Speaker ${index + 1}`}
                  {speech.speechTitle?.trim() ? ` — ${speech.speechTitle.trim()}` : ""}
                </option>
              ))}
            </select>
          ) : null}
          <TitleField value={session.title ?? ""} onChange={(title) => onUpdate({ title })} />
        </div>
      )}

      <DurationRangeFields session={session} onUpdate={onUpdate} showBuffer={sectionKey !== "general"} />
    </>
  )
}

function TitleField({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const trimmed = value.trim()
  const matchedPreset = TITLE_PRESET_OPTIONS.find((option) => option.value.toLowerCase() === trimmed.toLowerCase()) ?? null
  const isCustomTitle = !!trimmed && !matchedPreset
  const [forceOtherMode, setForceOtherMode] = useState(isCustomTitle)

  useEffect(() => {
    setForceOtherMode(isCustomTitle)
  }, [isCustomTitle])

  const selectValue = forceOtherMode ? TITLE_OTHER_OPTION : !trimmed ? "" : matchedPreset?.value ?? TITLE_OTHER_OPTION
  const showCustomInput = forceOtherMode || isCustomTitle

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <select
        className={`${inputClass} min-w-0`}
        value={selectValue}
        onChange={(e) => {
          const next = e.target.value
          if (next === "") {
            setForceOtherMode(false)
            onChange("")
            return
          }
          if (next === TITLE_OTHER_OPTION) {
            setForceOtherMode(true)
            if (matchedPreset) onChange("")
            return
          }
          setForceOtherMode(false)
          onChange(next)
        }}
      >
        <option value="">No title</option>
        {TITLE_PRESET_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        <option value={TITLE_OTHER_OPTION}>Other</option>
      </select>
      {showCustomInput && (
        <input
          className={`${inputClass} min-w-0`}
          placeholder="Custom title"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}

function ActivitySelector({
  session,
  isCustom,
  onUpdate,
  compact = false,
  onActivityChange,
}: {
  session: Session
  isCustom: boolean
  onUpdate: (partial: Partial<Session>) => void
  compact?: boolean
  onActivityChange: (nextActivity: string) => void
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
            onActivityChange(e.target.value)
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
          value={session.durationMax}
          onChange={(e) => {
            const nextMax = Math.max(0, Number(e.target.value) || 0)
            onUpdate({ durationMax: nextMax })
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

          <h3 className="mb-3 mt-6 text-sm font-semibold text-foreground">VPM Contact Note</h3>
          <Field label="Contact note">
            <textarea
              className={`${inputClass} min-h-24 resize-y`}
              value={clubInfo.vpmContactNote}
              onChange={(e) => updateClubInfo({ vpmContactNote: e.target.value })}
              placeholder="Enter the note shown under the QR codes"
            />
          </Field>

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

// QR image display field — read-only display, no upload
function QrUpload({
  label,
  value,
}: {
  label: string
  value: string
  onChange?: (dataUrl: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-background">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value || "/placeholder.svg"} alt={`${label} preview`} className="size-full object-contain" />
          ) : (
            <span className="text-[10px] text-muted-foreground">No image</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">Static QR code</p>
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
