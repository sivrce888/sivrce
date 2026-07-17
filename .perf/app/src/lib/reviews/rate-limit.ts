/**
 * In-memory fixed-window rate limiter for review write endpoints.
 * ponytail: per-instance memory only — resets on redeploy and does not
 * coordinate across serverless instances; upgrade to a shared store
 * (Redis/Neon table) when write volume justifies it.
 */

const WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const MAX_WRITES = 10

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

/** Returns true while the key is under the write budget for the window. */
export function rateLimitOk(key: string, now = Date.now()): boolean {
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    // Bound memory: sweep expired buckets once the map grows large.
    if (buckets.size > 5000) {
      for (const [k, b] of buckets) {
        if (b.resetAt <= now) buckets.delete(k)
      }
    }
    return true
  }
  if (bucket.count >= MAX_WRITES) return false
  bucket.count += 1
  return true
}

/** Best-effort client IP from proxy headers (first XFF hop wins). */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return forwarded || headers.get("x-real-ip") || "unknown"
}
