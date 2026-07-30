import { describe, expect, it } from "vitest"

import { canEditByRole, canManageByRole } from "./permissions"

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
})
