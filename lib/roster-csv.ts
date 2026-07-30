export type ImportedRosterMember = {
  memberNumber: string
  name: string
  credential: string
  email: string
  status: string
  currentPosition: string
  pathwaysEnrolled: string
}

function parseCsvLine(line: string): string[] {
  const values: string[] = []
  let value = ""
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (character === "," && !quoted) {
      values.push(value.trim())
      value = ""
    } else {
      value += character
    }
  }

  values.push(value.trim())
  return values
}

function normalizeHeader(value: string) {
  return value.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/\s+/g, " ")
}

export function parseToastmastersRoster(input: string): ImportedRosterMember[] {
  const lines = input.split(/\r?\n/).filter((line) => line.trim())
  if (!lines.length) return []

  const delimiter = lines[0].includes("\t") ? "\t" : ","
  const parseLine = delimiter === "\t"
    ? (line: string) => line.split("\t").map((value) => value.trim())
    : parseCsvLine

  const headers = parseLine(lines[0]).map(normalizeHeader)
  const column = (name: string) => headers.indexOf(name.toLowerCase())
  const indexes = {
    memberNumber: column("Customer ID"),
    name: column("Name"),
    credential: column("Credentials"),
    email: column("Email"),
    status: column("Status (*)"),
    currentPosition: column("Current Position"),
    pathwaysEnrolled: column("Pathways Enrolled"),
  }

  if (indexes.memberNumber < 0 || indexes.name < 0 || indexes.credential < 0) {
    throw new Error("The file must include Customer ID, Name, and Credentials columns.")
  }

  return lines
    .slice(1)
    .map((line) => {
      const values = parseLine(line)
      const read = (index: number) => index >= 0 ? values[index]?.trim() ?? "" : ""
      return {
        memberNumber: read(indexes.memberNumber),
        name: read(indexes.name),
        credential: read(indexes.credential),
        email: read(indexes.email),
        status: read(indexes.status),
        currentPosition: read(indexes.currentPosition),
        pathwaysEnrolled: read(indexes.pathwaysEnrolled),
      }
    })
    .filter((member) => member.memberNumber && member.name && member.credential)
}
