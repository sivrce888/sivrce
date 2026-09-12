/**
 * Runnable check for the booking double-book guard.
 * Run: npx tsx src/lib/bookings.check.ts
 *
 * ponytail: the DB query itself isn't executed here (prebuild has no seed
 * bookings); the pure rule is tested directly and the wiring is asserted by
 * source scan — the same pattern as i18n.check.ts.
 */
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

import { rangesOverlap, ACTIVE_BOOKING_STATUSES, expandBookingNights, quoteStay, stayBookingLockKey } from "./bookings"
import { STAY_TRANSITIONS, createStayBooking, transitionStayBooking } from "./stay-create"
import { createStayCancelToken, verifyStayCancelToken, stayBookingRef } from "./stay-token"
import { BookingStatus } from "@/generated/prisma/enums"

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) {
    console.error(`bookings: ${msg}`)
    process.exit(1)
  }
}

const D = (s: string) => new Date(`${s}T00:00:00Z`)

// Half-open [checkIn, checkOut): checkout day is free for the next guest.
assert(rangesOverlap(D("2026-10-01"), D("2026-10-05"), D("2026-10-03"), D("2026-10-07")), "containment overlaps")
assert(rangesOverlap(D("2026-10-03"), D("2026-10-07"), D("2026-10-01"), D("2026-10-05")), "reverse overlaps")
assert(!rangesOverlap(D("2026-10-01"), D("2026-10-05"), D("2026-10-05"), D("2026-10-10")), "touching checkout is free")
assert(!rangesOverlap(D("2026-10-05"), D("2026-10-10"), D("2026-10-01"), D("2026-10-05")), "touching reverse is free")
assert(!rangesOverlap(D("2026-10-01"), D("2026-10-02"), D("2026-10-05"), D("2026-10-06")), "disjoint")
assert(rangesOverlap(D("2026-10-01"), D("2026-10-02"), D("2026-10-01"), D("2026-10-02")), "identical")

// Active set must equal the search availability filter's statuses.
assert(
  ACTIVE_BOOKING_STATUSES.length === 2 &&
    ACTIVE_BOOKING_STATUSES.includes(BookingStatus.pending) &&
    ACTIVE_BOOKING_STATUSES.includes(BookingStatus.confirmed),
  "active = pending + confirmed",
)
const filters = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "search-filters.ts"), "utf8")
assert(
  filters.includes('status: { in: ["pending", "confirmed"] }'),
  "search filter statuses diverged from ACTIVE_BOOKING_STATUSES",
)

// Wiring: the only status mutation point must run the shared transition
// (overlap re-check + advisory lock live in transitionStayBooking itself,
// asserted below) inside a transaction.
const actions = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../app/[lang]/admin/rentals/actions.ts"),
  "utf8",
)
assert(actions.includes("transitionStayBooking"), "rentals/actions.ts must call transitionStayBooking")
assert(actions.includes("db.$transaction"), "confirm must run in a transaction")

// Quote: longest-stay discount wins, never stacked.
const q1 = quoteStay({ nights: 3, nightlyTetri: 10000, cleaningFeeTetri: 2000, securityDepositTetri: 5000, weeklyDiscountPct: 10, monthlyDiscountPct: 20 })
assert(q1.subtotalTetri === 30000 && q1.discountTetri === 0 && q1.totalTetri === 37000, "short stay: no discount")
const q2 = quoteStay({ nights: 7, nightlyTetri: 10000, cleaningFeeTetri: 0, securityDepositTetri: 0, weeklyDiscountPct: 10, monthlyDiscountPct: 20 })
assert(q2.discountTetri === 7000 && q2.totalTetri === 63000, "weekly discount at 7 nights")
const q3 = quoteStay({ nights: 30, nightlyTetri: 10000, cleaningFeeTetri: 0, securityDepositTetri: 0, weeklyDiscountPct: 10, monthlyDiscountPct: 20 })
assert(q3.discountTetri === 60000 && q3.totalTetri === 240000, "monthly wins over weekly, not stacked")
const q4 = quoteStay({ nights: 2, nightlyTetri: 999, cleaningFeeTetri: 0, securityDepositTetri: 0, weeklyDiscountPct: 10, monthlyDiscountPct: 0 })
assert(q4.totalTetri === 1998, "no rounding leak on short stays")

// Advisory lock: deterministic per listing, distinct across listings.
const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const k1 = stayBookingLockKey("abc")
const k2 = stayBookingLockKey("abc")
assert(k1.key1 === k2.key1 && k1.key2 === k2.key2, "lock key deterministic")
assert(
  stayBookingLockKey("abc").key1 !== stayBookingLockKey("abd").key1 ||
    stayBookingLockKey("abc").key2 !== stayBookingLockKey("abd").key2,
  "lock key scopes to listing",
)

// Wiring: transport armor lives in the route, semantic armor in the core.
const route = readFileSync(join(root, "app/api/bookings/route.ts"), "utf8")
for (const needle of ["isSameOrigin", "checkRateLimit", "createStayBooking"]) {
  assert(route.includes(needle), `api/bookings/route.ts missing ${needle}`)
}
const core = readFileSync(join(root, "lib/stay-create.ts"), "utf8")
for (const needle of [
  "stayBookingLockKey",
  "hasBookingOverlap",
  "dailyRentalBlockedDate",
  "pg_advisory_xact_lock",
  "minNights",
  "guestCapacity",
  "quoteStay",
]) {
  assert(core.includes(needle), `stay-create.ts missing ${needle}`)
}

// Host availability endpoint: owner-only writes, same armor set.
const avail = readFileSync(join(root, "app/api/listings/[id]/blocked-dates/route.ts"), "utf8")
for (const needle of [
  "canManageListing",
  "isSameOrigin",
  "checkRateLimit",
  "skipDuplicates",
  "MAX_BATCH",
]) {
  assert(avail.includes(needle), `blocked-dates/route.ts missing ${needle}`)
}
assert(!avail.includes("guestId"), "blocked dates must never leak guest data")

// expandBookingNights: half-open expansion feeding the calendar feed.
assert(
  JSON.stringify(expandBookingNights("2026-10-01", "2026-10-04")) ===
    JSON.stringify(["2026-10-01", "2026-10-02", "2026-10-03"]),
  "expands 3 nights, checkout day excluded",
)
assert(expandBookingNights("2026-10-01", "2026-10-01").length === 0, "zero-night window is empty")
assert(
  expandBookingNights("2026-10-30", "2026-11-02")[1] === "2026-10-31",
  "month boundary crosses correctly",
)

// Availability GET: same active-status set and window clamp as the calendar needs.
for (const needle of ["ACTIVE_BOOKING_STATUSES", "expandBookingNights", "windowEnd"]) {
  assert(route.includes(needle), `api/bookings GET missing ${needle}`)
}
// GET defaults must equal POST defaults — a divergence makes the shown total
// disagree with the booked total.
for (const def of [
  "settings?.minNights ?? 1",
  "settings?.maxNights ?? 30",
  "settings?.guestCapacity ?? 2",
]) {
  const hits = route.split(def).length - 1
  assert(hits === 2, `settings default "${def}" must appear exactly twice (GET + POST), found ${hits}`)
}

// The widget quotes through the same pure function the server snapshots.
const widget = readFileSync(join(root, "components/listing/StayBooker.tsx"), "utf8")
assert(widget.includes("quoteStay"), "StayBooker must quote via quoteStay (single pricing source)")
assert(widget.includes("/api/bookings"), "StayBooker must hit /api/bookings")
assert(widget.includes("aria-modal"), "StayBooker dialog must be modal")
assert(widget.includes("Escape"), "StayBooker must close on Escape")

// Wired into the detail rail for daily deals.
const detail = readFileSync(join(root, "components/listing/ListingDetailClient.tsx"), "utf8")
assert(
  detail.includes("StayBooker") && detail.includes("isDailyDeal"),
  "detail rail must render StayBooker for daily deals",
)

// 10-locale parity for the stay copy in the co-located listing dict:
// once per locale dict (en..uk) — no more (dupes), no fewer (missing).
const listingI18n = readFileSync(join(root, "components/listing/i18n.ts"), "utf8")
const stayKeys = [...new Set(listingI18n.match(/stay[A-Z]\w*/g) ?? [])]
for (const key of stayKeys) {
  const hits = listingI18n.split(`${key}:`).length - 1
  assert(hits === 10, `stay key ${key} must exist in all 10 locales, found ${hits}`)
}

// Guest cancellation: legal from pending and confirmed, terminal is final,
// and a PAID confirmed booking must never be guest-cancelled (refunds don't
// exist yet — refusing beats guessing).
assert(
  STAY_TRANSITIONS[BookingStatus.pending].includes(BookingStatus.cancelled_by_guest) &&
    STAY_TRANSITIONS[BookingStatus.confirmed].includes(BookingStatus.cancelled_by_guest),
  "guest may cancel pending and confirmed stays",
)
for (const terminal of [BookingStatus.cancelled_by_guest, BookingStatus.cancelled_by_host, BookingStatus.no_show, BookingStatus.completed]) {
  assert(STAY_TRANSITIONS[terminal].length === 0, `${terminal} is terminal`)
}

async function mustThrow(fn: () => Promise<unknown>, msg: string): Promise<string> {
  try {
    await fn()
    console.error(`bookings: expected throw: ${msg}`)
    process.exit(1)
  } catch (e) {
    return (e as Error).message
  }
}

// The async suite runs as one IIFE — the check files are transformed as CJS
// (no top-level await).
void (async () => {
// transitionStayBooking against a mock tx: unpaid guest cancel passes, paid
// one throws with the refund-flow refusal.
{
  const mkTx = (paid: boolean) => {
    const row = {
      listingId: "L1",
      checkIn: D("2026-10-01"),
      checkOut: D("2026-10-03"),
    }
    return {
      $executeRaw: async () => 0,
      dailyRentalBooking: {
        findUniqueOrThrow: async (args: unknown) => {
          const select = (args as { select: Record<string, true> }).select
          if (select.listingId) return row
          return {
            status: BookingStatus.confirmed,
            paymentOrderId: paid ? "ord_1" : null,
            paidAt: paid ? new Date() : null,
          }
        },
        findFirst: async () => null,
        update: async (args: unknown) => args,
      },
    }
  }
  await transitionStayBooking(mkTx(false) as never, "b1", BookingStatus.cancelled_by_guest)
  const msg = await mustThrow(
    () => transitionStayBooking(mkTx(true) as never, "b1", BookingStatus.cancelled_by_guest),
    "paid guest cancel must throw",
  )
  assert(msg.includes("Paid bookings"), `paid guard message, got: ${msg}`)
}

// createStayBooking against a mock tx:
// - idempotent retry returns the SAME active booking, create never runs
// - instant listings create directly as confirmed, requests as pending
{
  const mkTx = (dup: { id: string } | null, overlap = false, blocked = false) => {
    const created: Record<string, unknown>[] = []
    return {
      created,
      $executeRaw: async () => 0,
      dailyRentalBooking: {
        // First findFirst = dedupe probe (has guestPhone), second = overlap probe.
        findFirst: (async (args: unknown) => {
          const w = (args as { where: { guestPhone?: unknown; status?: unknown } }).where
          if (w.guestPhone) return dup
          return overlap ? { id: "other" } : null
        }) as unknown as () => Promise<{ id: string } | null>,
        create: async (args: unknown) => {
          created.push((args as { data: Record<string, unknown> }).data)
          return { id: "new-1", totalTetri: 100, status: BookingStatus.pending }
        },
      },
      dailyRentalBlockedDate: { findFirst: async () => (blocked ? { id: "x" } : null) },
    }
  }
  const base = {
    listingId: "L1",
    checkIn: D("2026-10-01"),
    checkOut: D("2026-10-04"),
    nights: 3,
    guests: 2,
    guestId: "u1",
    guestName: "G",
    guestPhone: "+995555000111",
    minNights: 1,
    maxNights: 30,
    guestCapacity: 4,
    pricing: {
      nightlyTetri: 10000,
      cleaningFeeTetri: 0,
      securityDepositTetri: 0,
      weeklyDiscountPct: 0,
      monthlyDiscountPct: 0,
    },
  }
  const dupTx = mkTx({ id: "dup-1" })
  const r1 = await createStayBooking(dupTx as never, base)
  assert(r1.ok && r1.booking.id === "dup-1", "retry returns the existing active booking")
  assert(dupTx.created.length === 0, "idempotent retry must not create a row")

  const fresh = mkTx(null)
  const r2 = await createStayBooking(fresh as never, base)
  assert(r2.ok && fresh.created.length === 1, "fresh create makes one row")
  assert(fresh.created[0]!.status === BookingStatus.pending, "request flow creates pending")

  const inst = mkTx(null)
  const r3 = await createStayBooking(inst as never, { ...base, instant: true })
  assert(r3.ok && inst.created[0]!.status === BookingStatus.confirmed, "instant flow creates confirmed")

  const r4 = await createStayBooking(mkTx(null, true) as never, base)
  assert(!r4.ok && (r4 as { code?: string }).code === "date_unavailable", "overlap rejected")
  const r5 = await createStayBooking(mkTx(null, false, true) as never, base)
  assert(!r5.ok && (r5 as { code?: string }).code === "date_unavailable", "blocked date rejected")
}

// Cancel token: round-trip, wrong booking id, tamper — timingSafeEqual path.
{
  const tok = createStayCancelToken("b1")
  assert(verifyStayCancelToken("b1", tok), "token verifies for its booking")
  assert(!verifyStayCancelToken("b2", tok), "token does not verify for another booking")
  assert(!verifyStayCancelToken("b1", tok.slice(0, -2) + "zz"), "tampered token rejected")
  assert(!verifyStayCancelToken("b1", "") && !verifyStayCancelToken("b1", undefined), "empty/absent token rejected")
  assert(stayBookingRef("a1b2c3d4-e5f6-7890-abcd-ef0123456789") === "A1B2C3D4", "ref is 8 stable chars")
}

// Guest cancel route: same armor set as every other booking write.
const cancelRoute = readFileSync(
  join(root, "app/api/bookings/[id]/cancel/route.ts"),
  "utf8",
)
for (const needle of [
  "isSameOrigin",
  "checkRateLimit",
  "transitionStayBooking",
  "verifyStayCancelToken",
  "cancelled_by_guest",
  "session.user.id === booking.guestId",
]) {
  assert(cancelRoute.includes(needle), `cancel route missing ${needle}`)
}
// Create route hands back the ownership proof + human ref; GET exposes instant.
assert(route.includes("createStayCancelToken") && route.includes("stayBookingRef"), "POST returns cancelToken + ref")
assert(route.includes("instantBook"), "route must pass settings.instantBook through")
assert(widget.includes("stayCancelCta") && widget.includes("stayInstantCta"), "widget must expose instant + cancel copy")

console.log("bookings: ok")
})().catch((e) => {
  console.error("bookings:", (e as Error).message)
  process.exit(1)
})
