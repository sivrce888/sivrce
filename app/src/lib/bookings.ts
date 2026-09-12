/**
 * SIVRCE — daily-rental booking invariants (no React, edge/server-safe).
 * Half-open windows [checkIn, checkOut): checkout day is free for the next
 * guest — identical semantics to the search availability filter.
 */

import { BookingStatus } from "@/generated/prisma/enums"
import { advisoryLockKey, type TourSlotLock } from "./tour-slots"

/** Booking states that block the calendar (mirrors search-filters.ts). */
export const ACTIVE_BOOKING_STATUSES: readonly BookingStatus[] = [
  BookingStatus.pending,
  BookingStatus.confirmed,
]

/** Pure half-open interval overlap — the entire rule in one testable line. */
export function rangesOverlap(aFrom: Date, aTo: Date, bFrom: Date, bTo: Date): boolean {
  return aFrom < bTo && bFrom < aTo
}

interface BookingDb {
  dailyRentalBooking: {
    findFirst(args: unknown): Promise<{ id: string } | null>
  }
}

/**
 * True when another active booking for this listing overlaps
 * [checkIn, checkOut). excludeId = the booking being confirmed (a pending row
 * must not collide with itself). Hits daily_rental_booking_listing_dates_idx.
 */
export async function hasBookingOverlap(
  db: BookingDb,
  input: { listingId: string; checkIn: Date; checkOut: Date; excludeId?: string },
): Promise<boolean> {
  const hit = await db.dailyRentalBooking.findFirst({
    where: {
      listingId: input.listingId,
      status: { in: [...ACTIVE_BOOKING_STATUSES] },
      checkIn: { lt: input.checkOut },
      checkOut: { gt: input.checkIn },
      ...(input.excludeId ? { id: { not: input.excludeId } } : {}),
    },
    select: { id: true },
  })
  return hit !== null
}

/**
 * One lock per listing (not per date): overlapping-but-different windows must
 * still serialize, otherwise two concurrent creates both pass the re-check.
 * Booking creates are rare per listing — contention is negligible.
 */
export function stayBookingLockKey(listingId: string): TourSlotLock {
  return advisoryLockKey('stay-booking/v1', listingId)
}

/** UTC-midnight timestamp of "today" on the Tbilisi (UTC+4) clock. */
export function tbilisiTodayUtc(): number {
  const shifted = new Date(Date.now() + 4 * 3600_000)
  return Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate())
}

const DAY_MS = 86_400_000

/** ISO nights (YYYY-MM-DD) occupied by one booking: [checkIn, checkOut). */
export function expandBookingNights(checkInIso: string, checkOutIso: string): string[] {
  const out: string[] = []
  for (let t = Date.parse(`${checkInIso}T00:00:00Z`); t < Date.parse(`${checkOutIso}T00:00:00Z`); t += DAY_MS) {
    out.push(new Date(t).toISOString().slice(0, 10))
  }
  return out
}

export interface StayQuote {
  nights: number
  subtotalTetri: number
  discountTetri: number
  totalTetri: number
}

/**
 * Airbnb-rule quote: longest-stay discount wins (monthly ≥28 over weekly ≥7,
 * never stacked). Pure — the API snapshots the result onto the booking row.
 */
export function quoteStay(input: {
  nights: number
  nightlyTetri: number
  cleaningFeeTetri: number
  securityDepositTetri: number
  weeklyDiscountPct: number
  monthlyDiscountPct: number
}): StayQuote {
  const subtotal = input.nights * input.nightlyTetri
  const pct = input.nights >= 28 ? input.monthlyDiscountPct : input.nights >= 7 ? input.weeklyDiscountPct : 0
  const discount = Math.floor((subtotal * Math.min(Math.max(pct, 0), 100)) / 100)
  return {
    nights: input.nights,
    subtotalTetri: subtotal,
    discountTetri: discount,
    totalTetri: subtotal - discount + input.cleaningFeeTetri + input.securityDepositTetri,
  }
}
