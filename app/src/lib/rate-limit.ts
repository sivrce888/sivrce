/**
 * The one fixed-window rate limiter + client-IP reader for every API route.
 * Keys share one map, so always namespace them (`"<route>:<ip|userId>"`).
 *
 * ponytail: per-instance memory only — resets on redeploy and does not
 * coordinate across serverless instances. Upgrade path: a shared store
 * (Upstash/Postgres) behind this same `rateLimit()` signature.
 */

const DEFAULT_WINDOW_MS = 10 * 60 * 1000
const DEFAULT_MAX = 10
/** Hard ceiling on tracked keys — bounds RAM under key-spraying abuse. */
const MAX_KEYS = 5000

export interface RateLimitOpts {
  windowMs?: number
  max?: number
}

export interface RateLimitResult {
  ok: boolean
  /** Seconds until the window resets (0 when ok) — send as `Retry-After`. */
  retryAfterSec: number
}

const buckets = new Map<string, { count: number; resetAt: number }>()

function makeRoom(now: number) {
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k)
  // Still full of live buckets: evict oldest-inserted (Map keeps insertion order).
  for (const k of buckets.keys()) {
    if (buckets.size < MAX_KEYS) break
    buckets.delete(k)
  }
}

export function rateLimit(key: string, opts: RateLimitOpts = {}, now = Date.now()): RateLimitResult {
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    if (!bucket && buckets.size >= MAX_KEYS) makeRoom(now)
    buckets.set(key, { count: 1, resetAt: now + (opts.windowMs ?? DEFAULT_WINDOW_MS) })
    return { ok: true, retryAfterSec: 0 }
  }
  if (bucket.count >= (opts.max ?? DEFAULT_MAX)) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) }
  }
  bucket.count += 1
  return { ok: true, retryAfterSec: 0 }
}

/** Boolean shorthand for routes that don't send `Retry-After`. */
export function rateLimitOk(key: string, opts?: RateLimitOpts, now?: number): boolean {
  return rateLimit(key, opts, now).ok
}

/**
 * Client IP from proxy headers (first XFF hop). Vercel overwrites
 * `x-forwarded-for` at the edge, so it can't be spoofed in production.
 */
export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  )
}

/** Test hook: bucket count, to prove the RAM ceiling holds. */
export function trackedKeys(): number {
  return buckets.size
}
