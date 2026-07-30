import type { ClubRole } from "@prisma/client"

const EDIT_ROLES: ClubRole[] = ["owner", "admin", "editor"]
const MANAGE_ROLES: ClubRole[] = ["owner", "admin"]
const AGENDA_CREATE_ROLES: ClubRole[] = ["owner", "admin", "editor", "viewer"]

export function canEditByRole(role: ClubRole) {
  return EDIT_ROLES.includes(role)
}

export function canManageByRole(role: ClubRole) {
  return MANAGE_ROLES.includes(role)
}

export function canManageMembersByRole(role: ClubRole) {
  return role === "owner"
}

export function canCreateAgendaByRole(role: ClubRole) {
  return AGENDA_CREATE_ROLES.includes(role)
}

export function canUpdateAgendaByRole(role: ClubRole | null, isAgendaOwner: boolean) {
  return isAgendaOwner || (role ? canEditByRole(role) : false)
}

export function canDeleteAgendaByRole(role: ClubRole | null, isAgendaOwner: boolean) {
  return isAgendaOwner || (role ? canManageByRole(role) : false)
}
