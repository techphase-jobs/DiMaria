/**
 * Simple in-process rate limiter using a sliding window.
 * For production at scale, replace with Upstash Redis.
 */

interface RateRecord {
  count: number
  resetAt: number
}

const store = new Map<string, RateRecord>()

interface RateLimitOptions {
  /** max requests per window */
  limit: number
  /** window duration in seconds */
  windowSec: number
}

export function rateLimit(key: string, opts: RateLimitOptions): boolean {
  const now = Date.now()
  const record = store.get(key)

  if (!record || now > record.resetAt) {
    store.set(key, { count: 1, resetAt: now + opts.windowSec * 1000 })
    return true
  }

  if (record.count >= opts.limit) return false

  record.count++
  return true
}

/** Extract caller IP from Next.js request headers */
export function getIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}
