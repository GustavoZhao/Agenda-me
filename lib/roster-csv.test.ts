import { describe, expect, it } from "vitest"

import { parseToastmastersRoster } from "./roster-csv"

describe("parseToastmastersRoster", () => {
  it("extracts selected fields from the official tab-delimited export", () => {
    const input = [
      "Customer ID\tName\tCredentials\tCompany / In Care Of\tEmail\tStatus (*)\tCurrent Position\tPathways Enrolled",
      "12345\tJane Doe\tDTM\tExample Inc.\tjane@example.com\tPaidMember\tPresident\tPresentation Mastery",
    ].join("\n")

    expect(parseToastmastersRoster(input)).toEqual([
      {
        memberNumber: "12345",
        name: "Jane Doe",
        credential: "DTM",
        email: "jane@example.com",
        status: "PaidMember",
        currentPosition: "President",
        pathwaysEnrolled: "Presentation Mastery",
      },
    ])
  })

  it("supports quoted CSV values and skips rows missing required fields", () => {
    const input = [
      "Customer ID,Name,Credentials,Email,Status (*),Current Position,Pathways Enrolled",
      '67890,"Doe, John",CC,john@example.com,UnpaidMember,,"Dynamic Leadership, Presentation Mastery"',
      "99999,Missing Credentials,,,,,",
    ].join("\n")

    expect(parseToastmastersRoster(input)).toHaveLength(1)
    expect(parseToastmastersRoster(input)[0]).toMatchObject({
      name: "Doe, John",
      status: "UnpaidMember",
      pathwaysEnrolled: "Dynamic Leadership, Presentation Mastery",
    })
  })
})
