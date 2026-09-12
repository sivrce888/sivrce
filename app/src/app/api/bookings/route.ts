/**
 * Stay booking requests — public POST.
 * Guest picks dates → pending request (host confirms in /admin/rentals, then
 * payment attaches via paymentOrderId). Same armor as tours: same-origin,
 * per-IP rate limit, inline validation, tx advisory lock + overlap re-check.
 *
 * ponytail: GEL-priced daily listings only — the booking row snapshots tetri
 * and server-side FX doesn't exist yet. Non-GEL gets an honest 409, not a
 * guessed rate. Upgrade: cached daily FX snapshot table, then lift the gate.
 */

import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/inquiries/rate-limit"
import { isSameOrigin } from "@/lib/security/origin"
import {
  ACTIVE_BOOKING_STATUSES,
  expandBookingNights,
  tbilisiTodayUtc,
} from "@/lib/bookings"
import { createStayBooking } from "@/lib/stay-create"
import { createStayCancelToken, stayBookingRef } from "@/lib/stay-token"

const DAY_MS = 86_400_000
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const AVAILABILITY_WINDOW_DAYS = 120

/**
 * Availability feed for the stay calendar: occupied ISO nights + the resolved
 * settings bundle. Defaults here MUST mirror the POST ones — the widget quotes
 * from this payload, the booking row snapshots server-side, and a divergence
 * would show a different total than the one booked.
 */
export async function GET(req: NextRequest) {
  const listingId = req.nextUrl.searchParams.get("listingId")
  if (!listingId) {
    return NextResponse.json({ error: "Missing listingId" }, { status: 400 })
  }
  try {
    const listing = await db.listing.findFirst({
      where: { id: listingId, deletedAt: null },
      select: { id: true, price: true, currency: true, dealType: true, dailyRentalSettings: true },
    })
    if (!listing || listing.dealType !== "daily") {
      return NextResponse.json({ error: "listing_not_bookable" }, { status: 404 })
    }
    if (listing.currency !== "GEL") {
      return NextResponse.json({ bookable: false, reason: "currency_unsupported" })
    }
    const settings = listing.dailyRentalSettings
    if (settings && !settings.enabled) {
      return NextResponse.json({ bookable: false, reason: "booking_disabled" })
    }

    const from = new Date(tbilisiTodayUtc())
    const to = new Date(from.getTime() + AVAILABILITY_WINDOW_DAYS * DAY_MS)
    const fromIso = from.toISOString().slice(0, 10)
    const toIso = to.toISOString().slice(0, 10)
    const [bookings, blocked] = await Promise.all([
      db.dailyRentalBooking.findMany({
        where: {
          listingId,
          status: { in: [...ACTIVE_BOOKING_STATUSES] },
          checkIn: { lt: to },
          checkOut: { gt: from },
        },
        select: { checkIn: true, checkOut: true },
      }),
      db.dailyRentalBlockedDate.findMany({
        where: { listingId, date: { gte: from, lte: to } },
        select: { date: true },
      }),
    ])

    const nights = new Set<string>()
    for (const b of bookings) {
      for (const n of expandBookingNights(b.checkIn.toISOString().slice(0, 10), b.checkOut.toISOString().slice(0, 10))) {
        if (n >= fromIso && n <= toIso) nights.add(n)
      }
    }
    for (const d of blocked) nights.add(d.date.toISOString().slice(0, 10))

    return NextResponse.json({
      bookable: true,
      nightlyTetri: listing.price * 100,
      windowEnd: toIso,
      nights: [...nights].sort(),
      settings: {
        minNights: settings?.minNights ?? 1,
        maxNights: settings?.maxNights ?? 30,
        guestCapacity: settings?.guestCapacity ?? 2,
        cleaningFeeTetri: settings?.cleaningFeeTetri ?? 0,
        securityDepositTetri: settings?.securityDepositTetri ?? 0,
        weeklyDiscountPct: settings?.weeklyDiscountPct ?? 0,
        monthlyDiscountPct: settings?.monthlyDiscountPct ?? 0,
        checkInHour: settings?.checkInHour ?? 15,
        checkOutHour: settings?.checkOutHour ?? 11,
        instant: settings?.instantBook ?? false,
      },
    })
  } catch (err) {
    console.error("Booking availability error:", (err as Error).message)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (!checkRateLimit(`bookings:${ip}`).ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 })
  }

  try {
    const body = await req.json()
    const { listingId, checkIn: checkInRaw, checkOut: checkOutRaw } = body
    // String-only + length-capped at the trust boundary: non-strings become ""
    // (→ 400 below), oversized text is clipped before it reaches a row.
    const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "")
    const guestName = text(body.guestName, 120)
    const guestPhone = text(body.guestPhone, 20)
    const guestEmail = text(body.guestEmail, 200)
    const guestNotes = text(body.guestNotes, 500)
    const { guestCount } = body

    if (!listingId || !checkInRaw || !checkOutRaw || !guestName || !guestPhone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    if (!DATE_RE.test(checkInRaw) || !DATE_RE.test(checkOutRaw)) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 })
    }
    if (!/^\+?\d{7,15}$/.test(guestPhone)) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 })
    }
    if (guestEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }
    const checkIn = new Date(`${checkInRaw}T00:00:00Z`)
    const checkOut = new Date(`${checkOutRaw}T00:00:00Z`)
    if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 })
    }
    if (checkIn.getTime() < tbilisiTodayUtc()) {
      return NextResponse.json({ error: "date_in_past" }, { status: 400 })
    }
    const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / DAY_MS)
    if (nights < 1) {
      return NextResponse.json({ error: "checkout_before_checkin" }, { status: 400 })
    }

    const listing = await db.listing.findFirst({
      where: { id: listingId, deletedAt: null },
      select: {
        id: true,
        price: true,
        currency: true,
        dealType: true,
        dailyRentalSettings: true,
      },
    })
    if (!listing || listing.dealType !== "daily") {
      return NextResponse.json({ error: "listing_not_bookable" }, { status: 404 })
    }
    if (listing.currency !== "GEL") {
      return NextResponse.json({ error: "currency_unsupported" }, { status: 409 })
    }
    const settings = listing.dailyRentalSettings
    if (settings && !settings.enabled) {
      return NextResponse.json({ error: "booking_disabled" }, { status: 409 })
    }
    const guests = guestCount == null ? 1 : Number(guestCount)

    const session = await auth()
    const result = await db.$transaction((tx) =>
      createStayBooking(tx, {
        listingId,
        checkIn,
        checkOut,
        nights,
        guests,
        guestId: session?.user?.id ?? guestPhone,
        guestName,
        guestPhone,
        guestEmail: guestEmail ?? null,
        guestNotes: guestNotes ?? null,
        minNights: settings?.minNights ?? 1,
        maxNights: settings?.maxNights ?? 30,
        guestCapacity: settings?.guestCapacity ?? 2,
        instant: settings?.instantBook ?? false,
        pricing: {
          nightlyTetri: listing.price * 100,
          cleaningFeeTetri: settings?.cleaningFeeTetri ?? 0,
          securityDepositTetri: settings?.securityDepositTetri ?? 0,
          weeklyDiscountPct: settings?.weeklyDiscountPct ?? 0,
          monthlyDiscountPct: settings?.monthlyDiscountPct ?? 0,
        },
      }),
    )
    if (!result.ok) {
      return NextResponse.json({ error: result.code }, { status: result.code === "guest_count" ? 400 : 409 })
    }
    return NextResponse.json(
      {
        booking: {
          id: result.booking.id,
          status: result.booking.status,
          totalTetri: result.booking.totalTetri,
          ref: stayBookingRef(result.booking.id),
          // Ownership proof for the anonymous guest-cancel endpoint.
          cancelToken: createStayCancelToken(result.booking.id),
        },
      },
      { status: 201 },
    )
  } catch (err) {
    console.error("Booking request error:", (err as Error).message)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
