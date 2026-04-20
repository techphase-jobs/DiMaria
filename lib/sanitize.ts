/** Strip dangerous characters from user-supplied strings */
export function sanitize(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value
    .trim()
    .replace(/<[^>]*>/g, '')        // strip HTML tags
    .replace(/[^\p{L}\p{N}\s.,'\-@+#():\/]/gu, '') // allow letters, nums, common punctuation
    .slice(0, 500)
}

export function sanitizePhone(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.replace(/[^\d+\s\-()]/g, '').slice(0, 20)
}

export function sanitizePrice(value: unknown): number | null {
  const n = parseFloat(String(value))
  if (isNaN(n) || n < 0 || n > 99999) return null
  return Math.round(n * 100) / 100
}

export function sanitizeInt(value: unknown, min = 0, max = 9999): number | null {
  const n = parseInt(String(value), 10)
  if (isNaN(n) || n < min || n > max) return null
  return n
}
