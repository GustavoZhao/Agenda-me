import { describe, expect, it } from "vitest"

import {
  canCreateAgendaByRole,
  canDeleteAgendaByRole,
  canEditByRole,
  canManageByRole,
  canManageMembersByRole,
  canUpdateAgendaByRole,
} from "./permissions"

describe("agenda API role permissions", () => {
  it.each([
    ["owner", true, true],
    ["admin", true, true],
    ["editor", true, false],
    ["viewer", false, false],
  ] as const)("%s role: edit=%s manage=%s", (role, canEdit, canManage) => {
    expect(canEditByRole(role)).toBe(canEdit)
    expect(canManageByRole(role)).toBe(canManage)
  })

  it.each([
    ["owner", true],
    ["admin", false],
    ["editor", false],
    ["viewer", false],
  ] as const)("%s role: manage claimed members=%s", (role, canManageMembers) => {
    expect(canManageMembersByRole(role)).toBe(canManageMembers)
  })

  it.each(["owner", "admin", "editor", "viewer"] as const)(
    "%s can create an agenda for a joined club",
    (role) => {
      expect(canCreateAgendaByRole(role)).toBe(true)
    }
  )

  it("lets viewers update and delete agendas they created, without granting club edit access", () => {
    expect(canEditByRole("viewer")).toBe(false)
    expect(canUpdateAgendaByRole("viewer", true)).toBe(true)
    expect(canDeleteAgendaByRole("viewer", true)).toBe(true)
    expect(canUpdateAgendaByRole("viewer", false)).toBe(false)
    expect(canDeleteAgendaByRole("viewer", false)).toBe(false)
  })

  it("keeps club editors able to update club agendas and managers able to delete them", () => {
    expect(canUpdateAgendaByRole("editor", false)).toBe(true)
    expect(canDeleteAgendaByRole("editor", false)).toBe(false)
    expect(canDeleteAgendaByRole("admin", false)).toBe(true)
  })
})
