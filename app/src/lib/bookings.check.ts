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

// Wiring: the only status mutation point must call the guard in a transaction.
const actions = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../app/[lang]/admin/rentals/actions.ts"),
  "utf8",
)
assert(actions.includes("hasBookingOverlap"), "rentals/actions.ts must call hasBookingOverlap")
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

// Wiring: the guest endpoint must carry the full armor set.
const route = readFileSync(join(root, "app/api/bookings/route.ts"), "utf8")
for (const needle of [
  "isSameOrigin",
  "checkRateLimit",
  "stayBookingLockKey",
  "hasBookingOverlap",
  "dailyRentalBlockedDate",
  "pg_advisory_xact_lock",
  "minNights",
  "guestCapacity",
]) {
  assert(route.includes(needle), `api/bookings/route.ts missing ${needle}`)
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

console.log("bookings: ok")
