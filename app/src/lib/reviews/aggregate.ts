import { Prisma } from "@/generated/prisma/client"
import { db, dbAvailable } from "@/lib/db"
import { unstable_cache } from "next/cache"

import { getTargetOwnerId } from "./owner"

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
  if (!(await dbAvailable())) return null
  return readAggregate(targetType, targetId)
}

const readAggregate = unstable_cache(
  async (targetType: string, targetId: string): Promise<ReviewAggregate | null> => {
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
  },
  ["review-aggregate"],
  { revalidate: 300 },
)

/** Profile tables carrying a denormalized rating; targetId is the profile slug. */
const PROFILE_HAS_COUNT: Record<string, boolean | undefined> = {
  agent: true,
  agency: true,
  developer: false,
}

/** Update payload for a profile rating row; null when the target isn't rated. */
export function profileRatingUpdate(
  targetType: string,
  count: number,
  average: number | null,
): { rating: number; reviewsCount?: number } | null {
  const withCount = PROFILE_HAS_COUNT[targetType]
  if (withCount === undefined) return null
  return {
    rating: average == null ? 0 : Math.round(average * 10) / 10,
    ...(withCount ? { reviewsCount: count } : {}),
  }
}

/**
 * Recomputes the denormalized AgentProfile/AgencyProfile/DeveloperProfile
 * rating from published reviews. Called inside review write transactions so
 * dashboards and directory cards never drift from the live aggregate.
 */
export async function syncProfileRating(
  targetType: string,
  targetId: string,
  tx: Prisma.TransactionClient | typeof db = db,
): Promise<void> {
  if (PROFILE_HAS_COUNT[targetType] === undefined) return
  try {
    const agg = await tx.review.aggregate({
      where: { targetType, targetId, status: "published", deletedAt: null },
      _avg: { rating: true },
      _count: { _all: true },
    })
    const data = profileRatingUpdate(targetType, agg._count?._all ?? 0, agg._avg?.rating)
    if (!data) return
    if (targetType === "agent") {
      await tx.agentProfile.updateMany({ where: { slug: targetId }, data })
    } else if (targetType === "agency") {
      await tx.agencyProfile.updateMany({ where: { slug: targetId }, data })
    } else {
      await tx.developerProfile.updateMany({ where: { slug: targetId }, data })
    }
  } catch {
    // Display surfaces read the live aggregate; a missed sync self-heals on
    // the next review write for the same target.
  }
}

// ─── Review trust: self-review block + verified-visit stamp ─────────────────

/**
 * Server-side trust stamp for a new review. `self` = the author owns the
 * target (fake review). `verified` = the author finished a real stay or
 * viewing on the target listing, or on any listing its owner runs: booking
 * completed / confirmed-and-checked-out, tour completed / confirmed-and-past.
 * Clients can't set it; it is never trusted from input.
 * ponytail: inquiries don't verify — a message isn't an experience. Add
 * "agent replied + deal won" once the CRM stage is reliable.
 */
export async function reviewTrust(
  authorId: string,
  targetType: string,
  targetId: string,
  now: Date = new Date(),
): Promise<{ self: boolean; verified: boolean }> {
  const ownerId = await getTargetOwnerId(targetType, targetId)
  if (!ownerId) return { self: false, verified: false }
  if (ownerId === authorId) return { self: true, verified: false }
  // A stay with a service provider's other listings says nothing about the service.
  if (targetType === "service") return { self: false, verified: false }
  const listing: Prisma.ListingWhereInput = targetType === "listing" ? { id: targetId } : { ownerId }
  const [stay, tour] = await Promise.all([
    db.dailyRentalBooking.findFirst({
      where: {
        guestId: authorId,
        listing,
        OR: [{ status: "completed" }, { status: "confirmed", checkOut: { lte: now } }],
      },
      select: { id: true },
    }),
    db.propertyTour.findFirst({
      where: {
        userId: authorId,
        listing,
        OR: [{ status: "completed" }, { status: "confirmed", tourDate: { lte: now } }],
      },
      select: { id: true },
    }),
  ])
  return { self: false, verified: Boolean(stay || tour) }
}
