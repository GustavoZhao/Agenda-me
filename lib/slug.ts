const SLUG_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"

export function makeReadableSlug(length = 10): string {
  let slug = ""
  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * SLUG_ALPHABET.length)
    slug += SLUG_ALPHABET[index]
  }
  return slug
}
