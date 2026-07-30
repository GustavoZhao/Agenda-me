export type ClubRole = "owner" | "admin" | "editor" | "viewer"

export type ClubSummary = {
  role: ClubRole
  club: {
    id: string
    name: string
  }
}

export type ClubDetail = {
  id: string
  name: string
  slogan: string | null
  meetingType: "in_person" | "online" | "hybrid"
  inPersonAddress: string | null
  onlinePlatform: string | null
  onlineMeetingId: string | null
  onlinePasscode: string | null
  president: string | null
  vpe: string | null
  vpm: string | null
  vppr: string | null
  secretary: string | null
  treasurer: string | null
  saa: string | null
  ipp: string | null
  mentors: string | null
  sponsors: string | null
  advisor: string | null
  participantNotesTitle: string | null
  participantNotesBody: string | null
  vpmContactNote: string | null
  clubNumber: string | null
  area: string | null
  division: string | null
  district: string | null
  timezone: string | null
  wechatQrUrl: string | null
  whatsappQrUrl: string | null
  memberships: Array<{
    id: string
    role: ClubRole
    user: {
      id: string
      name: string | null
      email: string | null
      image: string | null
    }
  }>
}
