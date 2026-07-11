import type { ClubRole } from "@prisma/client"

const EDIT_ROLES: ClubRole[] = ["owner", "admin", "editor"]
const MANAGE_ROLES: ClubRole[] = ["owner", "admin"]

export function canEditByRole(role: ClubRole) {
  return EDIT_ROLES.includes(role)
}

export function canManageByRole(role: ClubRole) {
  return MANAGE_ROLES.includes(role)
}
