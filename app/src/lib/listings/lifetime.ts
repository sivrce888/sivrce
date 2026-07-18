/** Listing lifetime — 30 days from createdAt (matches public offerValidUntil). */

export const LISTING_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000

export function listingExpiresAt(createdAt: Date | string): Date {
  const t = typeof createdAt === "string" ? Date.parse(createdAt) : createdAt.getTime()
  return new Date(t + LISTING_LIFETIME_MS)
}

/** 0–1 remaining fraction; 0 when expired. */
export function listingLifeRemaining(
  createdAt: Date | string,
  now: number = Date.now(),
): number {
  const end = listingExpiresAt(createdAt).getTime()
  const start = end - LISTING_LIFETIME_MS
  if (now >= end) return 0
  if (now <= start) return 1
  return (end - now) / LISTING_LIFETIME_MS
}

/**
 * Filter tab status. Active past lifetime → expired (UI only until cron marks it).
 * ponytail: no draft/blocked columns in DB — map pending→draft, withdrawn→disabled.
 */
export function listingFilterStatus(
  status: string,
  createdAt: Date | string,
  now: number = Date.now(),
): string {
  if (status === "active" && listingLifeRemaining(createdAt, now) <= 0) return "expired"
  return status
}
