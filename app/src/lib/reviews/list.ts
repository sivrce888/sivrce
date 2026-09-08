import { db } from "@/lib/db"
import { unstable_cache } from "next/cache"
import type { Review } from "@/generated/prisma/client"

/**
 * CONTRACT — implemented by the Reviews_Backend worker; shared by the
 * /api/reviews GET route and the SSR pages (server-baked page 1).
 * Do NOT change the exported shapes — internals only.
 */
export interface ReviewDto {
  id: string
  targetType: string
  targetId: string
  authorName: string
  rating: number
  title?: string
  body: string
  verified: boolean
  helpfulCount: number
  ownerReply?: string
  createdAt: string
}

export interface ReviewList {
  average: number | null
  count: number
  distribution: Record<string, number>
  reviews: ReviewDto[]
  page: number
  pages: number
}

const SORTS = new Set(["newest", "highest", "lowest", "helpful"])
export const PAGE_SIZE = 10

/** Exactly what toDto reads — a full Review or the REVIEW_SELECT projection both fit. */
export type ReviewLike = Pick<
  Review,
  | "id"
  | "targetType"
  | "targetId"
  | "authorName"
  | "rating"
  | "title"
  | "body"
  | "verified"
  | "helpfulCount"
  | "ownerReply"
  | "createdAt"
>

/** Public wire shape per the fixed API contract. */
export function toDto(r: ReviewLike): ReviewDto {
  return {
    id: r.id,
    targetType: r.targetType,
    targetId: r.targetId,
    authorName: r.authorName,
    rating: r.rating,
    ...(r.title != null ? { title: r.title } : {}),
    body: r.body,
    verified: r.verified,
    helpfulCount: r.helpfulCount,
    ...(r.ownerReply != null ? { ownerReply: r.ownerReply } : {}),
    createdAt: r.createdAt.toISOString(),
  }
}

/** Returns null for an unknown sort key — callers fall back to newest. */
export function parseSort(sort: string | null): string {
  return sort && SORTS.has(sort) ? sort : "newest"
}

/**
 * One page of published reviews + aggregate + rating distribution.
 * Returns null only when the DB is unreachable.
 */
export async function listReviews(
  targetType: string,
  targetId: string,
  page: number,
  sort: string,
): Promise<ReviewList | null> {
  try {
    const where = { targetType, targetId, status: "published", deletedAt: null }
    const orderBy =
      sort === "highest"
        ? [{ rating: "desc" as const }, { createdAt: "desc" as const }]
        : sort === "lowest"
          ? [{ rating: "asc" as const }, { createdAt: "desc" as const }]
          : sort === "helpful"
            ? [{ helpfulCount: "desc" as const }, { createdAt: "desc" as const }]
            : [{ createdAt: "desc" as const }]
    const [agg, dist, rows] = await Promise.all([
      db.review.aggregate({ where, _avg: { rating: true }, _count: { _all: true } }),
      db.review.groupBy({ by: ["rating"], where, _count: { _all: true } }),
      db.review.findMany({
        where,
        orderBy,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
    ])
    const count = agg._count?._all ?? 0
    const distribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 }
    for (const row of dist) distribution[String(row.rating)] = row._count?._all ?? 0
    return {
      average: agg._avg?.rating == null ? null : Math.round(agg._avg.rating * 10) / 10,
      count,
      distribution,
      reviews: rows.map(toDto),
      page,
      pages: Math.ceil(count / PAGE_SIZE),
    }
  } catch {
    return null
  }
}

/** Cache tag purged by review mutation routes so server-baked pages stay fresh. */
export const REVIEW_LIST_TAG = "review-list"

/** Cached read for server-rendered pages; the API stays uncached for freshness. */
export const listReviewsCached = unstable_cache(
  listReviews,
  [REVIEW_LIST_TAG],
  { tags: [REVIEW_LIST_TAG], revalidate: 300 },
)
