/**
 * Core stay-booking create — every semantic rule, inside one transaction.
 * The route keeps transport armor (origin, rate limit, field formats,
 * currency gate); this module owns what the booking row is trusted with:
 * stay length, guest count, and serialized availability (advisory lock →
 * overlap re-check → blocked-date check → snapshot quote → create).
 * ponytail: blocked-date check lives inside the lock, not before it — a host
 * blocking a date mid-request can no longer slip past a pre-checked read.
 */

import { BookingStatus } from "@/generated/prisma/enums"
import { ACTIVE_BOOKING_STATUSES, hasBookingOverlap, quoteStay, stayBookingLockKey } from "./bookings"

/**
 * Legal transitions — shared by admin, seller and guest actions; terminal
 * states are final. Guests may cancel a confirmed stay only while unpaid
 * (enforced in transitionStayBooking — a paid cancellation is a refund flow,
 * which does not exist yet).
 */
export const STAY_TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  [BookingStatus.pending]: [
    BookingStatus.confirmed,
    BookingStatus.cancelled_by_guest,
    BookingStatus.cancelled_by_host,
  ],
  [BookingStatus.confirmed]: [BookingStatus.cancelled_by_guest, BookingStatus.cancelled_by_host],
  [BookingStatus.cancelled_by_guest]: [],
  [BookingStatus.cancelled_by_host]: [],
  [BookingStatus.no_show]: [],
  [BookingStatus.completed]: [],
}

/**
 * Guarded status transition, in a transaction, under the same per-listing
 * advisory lock as creates — two hosts confirming overlapping pendings at
 * once is exactly the double-booking this serializes away. Throws on illegal
 * moves; callers map to user-facing errors.
 */
export async function transitionStayBooking(
  tx: {
    $executeRaw(sql: TemplateStringsArray, ...vals: number[]): Promise<unknown>
    dailyRentalBooking: {
      findFirst(args: unknown): Promise<{ id: string } | null>
      findUniqueOrThrow(args: unknown): Promise<{
        status: BookingStatus
        listingId: string
        checkIn: Date
        checkOut: Date
        paymentOrderId: string | null
        paidAt: Date | null
      }>
      update(args: unknown): Promise<unknown>
    }
  },
  id: string,
  target: BookingStatus,
  extra?: { cancelReason?: string },
): Promise<void> {
  const row = await tx.dailyRentalBooking.findUniqueOrThrow({
    where: { id },
    select: { listingId: true, checkIn: true, checkOut: true },
  })
  const lock = stayBookingLockKey(row.listingId)
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lock.key1}, ${lock.key2})`
  // Re-read under the lock: the pre-lock world may be stale (two hosts
  // double-clicking confirm is exactly this race).
  const current = await tx.dailyRentalBooking.findUniqueOrThrow({
    where: { id },
    select: { status: true, paymentOrderId: true, paidAt: true },
  })
  if (current.status === target) throw new Error("Booking is already in this status")
  if (!STAY_TRANSITIONS[current.status].includes(target)) {
    throw new Error(`A booking in status "${current.status}" cannot be moved to "${target}"`)
  }
  if (
    target === BookingStatus.cancelled_by_guest &&
    current.status === BookingStatus.confirmed &&
    (current.paymentOrderId || current.paidAt)
  ) {
    throw new Error("Paid bookings cannot be cancelled here — contact the host")
  }
  if (target === BookingStatus.confirmed) {
    if (
      await hasBookingOverlap(tx, {
        listingId: row.listingId,
        checkIn: row.checkIn,
        checkOut: row.checkOut,
        excludeId: id,
      })
    ) {
      throw new Error("Overlapping confirmed booking exists for these dates")
    }
  }
  await tx.dailyRentalBooking.update({
    where: { id },
    data: {
      status: target,
      ...(target === BookingStatus.cancelled_by_host || target === BookingStatus.cancelled_by_guest
        ? { cancelledAt: new Date(), cancelReason: extra?.cancelReason ?? null }
        : {}),
    },
  })
}

export interface StayPricing {
  nightlyTetri: number
  cleaningFeeTetri: number
  securityDepositTetri: number
  weeklyDiscountPct: number
  monthlyDiscountPct: number
}

export interface StayCreateInput {
  listingId: string
  checkIn: Date
  checkOut: Date
  nights: number
  guests: number
  guestId: string
  guestName: string
  guestPhone: string
  guestEmail?: string | null
  guestNotes?: string | null
  minNights: number
  maxNights: number
  guestCapacity: number
  /** instantBook listing: skip the host-confirmation round-trip. */
  instant?: boolean
  pricing: StayPricing
}

export type StayCreateResult =
  | { ok: true; booking: { id: string; totalTetri: number; status: BookingStatus } }
  | { ok: false; code: "stay_length" | "guest_count" | "date_unavailable" }

/** Structural tx shape — any Prisma transaction client satisfies this. */
interface StayTx {
  $executeRaw(sql: TemplateStringsArray, ...vals: number[]): Promise<unknown>
  dailyRentalBooking: {
    findFirst(args: unknown): Promise<{ id: string; totalTetri?: number; status?: BookingStatus } | null>
    create(args: unknown): Promise<{ id: string; totalTetri: number; status: BookingStatus }>
  }
  dailyRentalBlockedDate: {
    findFirst(args: unknown): Promise<{ id: string } | null>
  }
}

export async function createStayBooking(tx: StayTx, input: StayCreateInput): Promise<StayCreateResult> {
  if (input.nights < input.minNights || input.nights > input.maxNights) {
    return { ok: false, code: "stay_length" }
  }
  if (!Number.isInteger(input.guests) || input.guests < 1 || input.guests > input.guestCapacity) {
    return { ok: false, code: "guest_count" }
  }
  const lock = stayBookingLockKey(input.listingId)
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lock.key1}, ${lock.key2})`
  // Idempotency: a retried POST (double-click, flaky network) must return the
  // same active booking, not a duplicate row or a date_unavailable from
  // colliding with itself. Same listing + phone + exact dates = same intent.
  // ponytail: phone-scoped dedupe; a real idempotency-key table if guests ever
  // book two identical stays for different people from one phone.
  const dup = await tx.dailyRentalBooking.findFirst({
    where: {
      listingId: input.listingId,
      guestPhone: input.guestPhone,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      status: { in: [...ACTIVE_BOOKING_STATUSES] },
    },
    select: { id: true, totalTetri: true, status: true },
  })
  if (dup) {
    return { ok: true, booking: { id: dup.id, totalTetri: dup.totalTetri ?? 0, status: dup.status ?? BookingStatus.pending } }
  }
  if (await hasBookingOverlap(tx, { listingId: input.listingId, checkIn: input.checkIn, checkOut: input.checkOut })) {
    return { ok: false, code: "date_unavailable" }
  }
  const blocked = await tx.dailyRentalBlockedDate.findFirst({
    where: { listingId: input.listingId, date: { gte: input.checkIn, lt: input.checkOut } },
    select: { id: true },
  })
  if (blocked) {
    return { ok: false, code: "date_unavailable" }
  }
  const quote = quoteStay({ nights: input.nights, ...input.pricing })
  const booking = await tx.dailyRentalBooking.create({
    data: {
      listingId: input.listingId,
      guestId: input.guestId,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      nights: input.nights,
      guestCount: input.guests,
      nightlyPriceTetri: input.pricing.nightlyTetri,
      cleaningFeeTetri: input.pricing.cleaningFeeTetri,
      securityDepositTetri: input.pricing.securityDepositTetri,
      discountTetri: quote.discountTetri,
      totalTetri: quote.totalTetri,
      currency: "GEL",
      // Instant-book creates directly as confirmed — the overlap re-check above
      // ran under the same advisory lock a confirm would take, so this is the
      // identical guarantee without the host round-trip.
      status: input.instant ? BookingStatus.confirmed : BookingStatus.pending,
      guestName: input.guestName,
      guestPhone: input.guestPhone,
      guestEmail: input.guestEmail ?? null,
      guestNotes: input.guestNotes ?? null,
    },
  })
  return { ok: true, booking }
}
