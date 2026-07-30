export const DEFAULT_MEETING_TIME_ZONE = "Asia/Shanghai"

export const TIME_ZONE_OPTIONS = [
  { value: "Pacific/Honolulu", label: "US (Hawaii)" },
  { value: "America/Los_Angeles", label: "US (Los Angeles)" },
  { value: "America/Denver", label: "US (Denver)" },
  { value: "America/Chicago", label: "US (Chicago)" },
  { value: "America/New_York", label: "US (New York)" },
  { value: "America/Sao_Paulo", label: "Brazil (São Paulo)" },
  { value: "Europe/London", label: "UK (London)" },
  { value: "Europe/Paris", label: "Central Europe (Paris)" },
  { value: "Africa/Johannesburg", label: "South Africa (Johannesburg)" },
  { value: "Europe/Moscow", label: "Russia (Moscow)" },
  { value: "Asia/Dubai", label: "UAE (Dubai)" },
  { value: "Asia/Kolkata", label: "India (Kolkata)" },
  { value: "Asia/Bangkok", label: "Thailand (Bangkok)" },
  { value: "Asia/Jakarta", label: "Indonesia (Jakarta)" },
  { value: "Asia/Makassar", label: "Indonesia (Makassar / Bali)" },
  { value: "Asia/Kuala_Lumpur", label: "Malaysia (Kuala Lumpur)" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Asia/Shanghai", label: "China (Beijing)" },
  { value: "Asia/Tokyo", label: "Japan (Tokyo)" },
  { value: "Asia/Seoul", label: "South Korea (Seoul)" },
  { value: "Australia/Perth", label: "Australia (Perth)" },
  { value: "Australia/Sydney", label: "Australia (Sydney)" },
  { value: "Pacific/Auckland", label: "New Zealand (Auckland)" },
] as const

export function isSupportedTimeZone(value: string | undefined): value is string {
  return !!value && TIME_ZONE_OPTIONS.some((option) => option.value === value)
}

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

export function getTimeZoneOffsetMinutes(timeZone: string, date: Date): number {
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

function agendaTimeToInstant(
  time: string,
  meetingDate: string,
  sourceTimeZone: string
): Date {
  const { hour, minute } = parseTime(time)
  const { year, month, day } = toDateParts(meetingDate)
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute)
  let utcMillis = localAsUtc

  // Two passes resolve DST-sensitive offsets for the source zone.
  for (let pass = 0; pass < 2; pass += 1) {
    const offsetMinutes = getTimeZoneOffsetMinutes(sourceTimeZone, new Date(utcMillis))
    utcMillis = localAsUtc - offsetMinutes * 60 * 1000
  }

  return new Date(utcMillis)
}

export function convertAgendaTimeToZone(
  time: string,
  meetingDate: string,
  sourceTimeZone: string,
  targetTimeZone: string
): string {
  if (targetTimeZone === sourceTimeZone) return time

  const instant = agendaTimeToInstant(time, meetingDate, sourceTimeZone)
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: targetTimeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant)
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00"
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00"
  return `${hour}:${minute}`
}

export function formatTimeZoneOffset(
  timeZone: string,
  meetingDate: string,
  referenceTime: string,
  sourceTimeZone: string
): string {
  const instant = agendaTimeToInstant(referenceTime, meetingDate, sourceTimeZone)
  const offsetMinutes = getTimeZoneOffsetMinutes(timeZone, instant)
  const sign = offsetMinutes >= 0 ? "+" : "−"
  const absoluteMinutes = Math.abs(offsetMinutes)
  const hours = Math.floor(absoluteMinutes / 60)
  const minutes = absoluteMinutes % 60
  return `UTC${sign}${hours}${minutes ? `:${`${minutes}`.padStart(2, "0")}` : ""}`
}
