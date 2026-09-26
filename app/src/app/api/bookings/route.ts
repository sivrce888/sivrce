/**
 * Stay booking requests — public POST.
 * Guest picks dates → pending request (host confirms in /admin/rentals, then
 * payment attaches via paymentOrderId). Same armor as tours: same-origin,
 * per-IP rate limit, inline validation, tx advisory lock + overlap re-check.
 * GET serves two reads: ?mine=1 returns the signed-in guest's own bookings
 * (account hub), ?listingId returns the public availability feed.
 *
 * Booking rows settle in GEL tetri, so a USD/EUR-priced listing is converted
 * with the shared server FX rate (getFx — same feed and fallbacks as the
 * client currency context). GET returns the rate it used so the widget can
 * show the guest the conversion; POST re-fetches and re-snapshots server-side.
 * A currency with no rate is still an honest 409, never a guessed price.
 */

import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { getFx } from "@/lib/fx-server"
import { clientIp, rateLimit } from "@/lib/rate-limit"
import { isSameOrigin } from "@/lib/security/origin"
import {
  ACTIVE_BOOKING_STATUSES,
  expandBookingNights,
  gelPerUnit,
  nightlyTetriOf,
  tbilisiTodayUtc,
} from "@/lib/bookings"
import { createStayBooking } from "@/lib/stay-create"
import { sendStayBookingCreated } from "@/lib/stay-email"
import { createStayCancelToken, stayBookingRef } from "@/lib/stay-token"

const DAY_MS = 86_400_000
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const AVAILABILITY_WINDOW_DAYS = 120

const isoDay = (d: Date) => d.toISOString().slice(0, 10)

/**
 * The signed-in guest's own stay bookings — the account-hub "My stays" card.
 * Cancellability is decided server-side so the UI never re-derives the rule
 * (paid bookings need the refund flow that does not exist yet).
 */
async function getMyStays(userId: string) {
  const rows = await db.dailyRentalBooking.findMany({
    where: { guestId: userId },
    orderBy: { checkIn: "desc" },
    take: 50,
    select: {
      id: true,
      status: true,
      checkIn: true,
      checkOut: true,
      nights: true,
      guestCount: true,
      totalTetri: true,
      paidAt: true,
      paymentOrderId: true,
      listing: { select: { title: true } },
    },
  })
  return {
    stays: rows.map((r) => ({
      id: r.id,
      status: r.status,
      checkIn: isoDay(r.checkIn),
      checkOut: isoDay(r.checkOut),
      nights: r.nights,
      guestCount: r.guestCount,
      totalTetri: r.totalTetri,
      cancellable:
        !r.paidAt && !r.paymentOrderId && (r.status === "pending" || r.status === "confirmed"),
      listing: { title: r.listing.title },
    })),
  }
}

/**
 * Availability feed for the stay calendar: occupied ISO nights + the resolved
 * settings bundle. Defaults here MUST mirror the POST ones — the widget quotes
 * from this payload, the booking row snapshots server-side, and a divergence
 * would show a different total than the one booked.
 */
export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("mine")) {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    try {
      return NextResponse.json(await getMyStays(session.user.id))
    } catch (err) {
      console.error("My stays error:", (err as Error).message)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  }
  const listingId = req.nextUrl.searchParams.get("listingId")
  if (!listingId) {
    return NextResponse.json({ error: "Missing listingId" }, { status: 400 })
  }
  // Public, unauthenticated, two queries — the same armor POST gets, just
  // sized for calendar loads (widget refetches on every open).
  if (!rateLimit(`bookings-cal:${clientIp(req.headers)}`, { max: 60 }).ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 })
  }
  try {
    const listing = await db.listing.findFirst({
      where: { id: listingId, deletedAt: null },
      select: { id: true, price: true, currency: true, dealType: true, dailyRentalSettings: true },
    })
    if (!listing || listing.dealType !== "daily") {
      return NextResponse.json({ error: "listing_not_bookable" }, { status: 404 })
    }
    const fx = await getFx()
    const gelRate = gelPerUnit(listing.currency, fx)
    if (gelRate === null) {
      return NextResponse.json({ bookable: false, reason: "currency_unsupported" })
    }
    const settings = listing.dailyRentalSettings
    if (settings && !settings.enabled) {
      return NextResponse.json({ bookable: false, reason: "booking_disabled" })
    }

    const from = new Date(tbilisiTodayUtc())
    const to = new Date(from.getTime() + AVAILABILITY_WINDOW_DAYS * DAY_MS)
    const fromIso = isoDay(from)
    const toIso = isoDay(to)
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
      for (const n of expandBookingNights(isoDay(b.checkIn), isoDay(b.checkOut))) {
        if (n >= fromIso && n <= toIso) nights.add(n)
      }
    }
    for (const d of blocked) nights.add(isoDay(d.date))

    return NextResponse.json({
      bookable: true,
      nightlyTetri: nightlyTetriOf(listing.price, gelRate),
      // Conversion disclosure: the widget shows "$120 → ₾312" when these say
      // the listing is not priced in GEL. No silent re-pricing.
      priceCurrency: listing.currency,
      priceNative: listing.price,
      fxRate: gelRate,
      fxSource: fx.source,
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
  const ip = clientIp(req.headers)
  if (!rateLimit(`bookings:${ip}`).ok) {
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
        title: true,
        ownerId: true,
        price: true,
        currency: true,
        dealType: true,
        dailyRentalSettings: true,
      },
    })
    if (!listing || listing.dealType !== "daily") {
      return NextResponse.json({ error: "listing_not_bookable" }, { status: 404 })
    }
    const gelRate = gelPerUnit(listing.currency, await getFx())
    if (gelRate === null) {
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
        guestEmail: guestEmail || null,
        guestNotes: guestNotes ?? null,
        minNights: settings?.minNights ?? 1,
        maxNights: settings?.maxNights ?? 30,
        guestCapacity: settings?.guestCapacity ?? 2,
        instant: settings?.instantBook ?? false,
        pricing: {
          nightlyTetri: nightlyTetriOf(listing.price, gelRate),
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
    const ref = stayBookingRef(result.booking.id)
    // Ownership proof for the anonymous guest-cancel endpoint.
    const cancelToken = createStayCancelToken(result.booking.id)

    // Fire-and-forget, after commit: the mail carries the only durable copy of
    // the ref + cancel link, and it is the host's only signal a request landed.
    // Never awaited — a mail outage must not fail a booking that already exists.
    const hostEmail = listing.ownerId
      ? (await db.user.findUnique({ where: { id: listing.ownerId }, select: { email: true } }).catch(() => null))
          ?.email ?? null
      : null
    sendStayBookingCreated({
      booking: {
        id: result.booking.id,
        ref,
        cancelToken,
        status: result.booking.status,
        checkIn,
        checkOut,
        nights,
        guestCount: guests,
        totalTetri: result.booking.totalTetri,
        guestName,
        guestPhone,
        guestEmail: guestEmail || null,
        guestNotes: guestNotes || null,
      },
      listing: {
        id: listing.id,
        title: listing.title,
        checkInHour: settings?.checkInHour ?? 15,
        checkOutHour: settings?.checkOutHour ?? 11,
      },
      hostEmail,
    })

    return NextResponse.json(
      {
        booking: {
          id: result.booking.id,
          status: result.booking.status,
          totalTetri: result.booking.totalTetri,
          ref,
          cancelToken,
        },
      },
      { status: 201 },
    )
  } catch (err) {
    console.error("Booking request error:", (err as Error).message)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
