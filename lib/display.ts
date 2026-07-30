export function truncateLabel(value: string, maxLength = 6): string {
  const characters = Array.from(value.trim())
  if (characters.length <= maxLength) return characters.join("")
  return `${characters.slice(0, maxLength).join("")}…`
}
