/**
 * Per-IP lead-form rate limiter: 10 submissions per 10 minutes.
 *
 * ponytail: in-memory, per-instance. Ceiling — on multi-instance deploys
 * (serverless fleet) limits are per instance; upgrade path is a shared store
 * (Upstash/Redis) behind this same checkRateLimit() signature.
 */

const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 10

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()
let lastSweep = 0

/** Lazily drop expired buckets so the map can't grow unbounded. */
function sweep(now: number) {
  if (now - lastSweep < WINDOW_MS) return
  lastSweep = now
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export function checkRateLimit(key: string): { ok: boolean; retryAfterSec: number } {
  const now = Date.now()
  sweep(now)

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { ok: true, retryAfterSec: 0 }
  }
  if (bucket.count >= MAX_PER_WINDOW) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) }
  }
  bucket.count += 1
  return { ok: true, retryAfterSec: 0 }
}
