import { describe, expect, it } from "vitest"

import { truncateLabel } from "./display"

describe("truncateLabel", () => {
  it("keeps short club names unchanged", () => {
    expect(truncateLabel("BRICS")).toBe("BRICS")
  })

  it("shows six characters followed by an ellipsis", () => {
    expect(truncateLabel("Toastmasters")).toBe("Toastm…")
  })

  it("counts Unicode characters instead of UTF-16 code units", () => {
    expect(truncateLabel("国际演讲会俱乐部")).toBe("国际演讲会俱…")
  })
})
