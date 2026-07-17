import { db } from "@/lib/db"

/**
 * CONTRACT — implemented by the Reviews_Backend worker; consumed by pages
 * that need a server-side aggregate (e.g. JSON-LD aggregateRating).
 * Do NOT change the exported signature — internals only.
 */
export interface ReviewAggregate {
  average: number
  count: number
}

/** Returns null when the aggregate is unavailable (DB down, zero reviews). */
export async function getReviewAggregate(
  targetType: string,
  targetId: string,
): Promise<ReviewAggregate | null> {
  try {
    const result = await db.review.aggregate({
      where: { targetType, targetId, status: "published", deletedAt: null },
      _avg: { rating: true },
      _count: { _all: true },
    })
    const count = result._count?._all ?? 0
    const average = result._avg?.rating
    if (count === 0 || average == null) return null
    return { average: Math.round(average * 10) / 10, count }
  } catch {
    return null
  }
}
