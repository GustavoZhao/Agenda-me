import { describe, expect, it } from "vitest"

import { canEditByRole, canManageByRole, canManageMembersByRole } from "./permissions"

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
})
