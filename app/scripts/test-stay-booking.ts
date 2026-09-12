/**
 * Runtime suite for the stay-booking core (lib/stay-create.ts) against a LOCAL
 * throwaway Postgres. Not part of prebuild — prebuild has no DB.
 * Run: DATABASE_URL="postgresql://mac@localhost:5432/sivrce_stay_test" \
 *        npx tsx scripts/test-stay-booking.ts
 * Local schema: sed -E '/Unsupported\("(geometry|vector|geography)/d'
 * prisma/schema.prisma > /tmp/schema-local.prisma && prisma db push --schema
 * /tmp/schema-local.prisma --url $DATABASE_URL --accept-data-loss
 */

import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"

import { createStayBooking, transitionStayBooking } from "../src/lib/stay-create"
import { quoteStay } from "../src/lib/bookings"
import { BookingStatus } from "../src/generated/prisma/enums"

const url = process.env.DATABASE_URL ?? ""
if (!/localhost|127\.0\.0\.1|\[::1\]/.test(url)) {
  console.error("refusing to run: DATABASE_URL is not localhost")
  process.exit(1)
}

const LISTING_ID = "stay-test-listing"
const DAY = 86_400_000
const D = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY)

let passed = 0
function ok(cond: unknown, msg: string) {
  if (!cond) {
    console.error(`FAIL: ${msg}`)
    process.exitCode = 1
  } else {
    passed++
  }
}

const pricing = {
  nightlyTetri: 12000, // ₾120
  cleaningFeeTetri: 5000,
  securityDepositTetri: 10000,
  weeklyDiscountPct: 10,
  monthlyDiscountPct: 20,
}
const base = {
  listingId: LISTING_ID,
  guestId: "guest-1",
  guestName: "Test Guest",
  guestPhone: "+995555000111",
  minNights: 2,
  maxNights: 10,
  guestCapacity: 3,
  pricing,
}

async function main() {
  const pool = new Pool({ connectionString: url, max: 2 })
  const db = new PrismaClient({ adapter: new PrismaPg(pool) })

  // Seed
  await db.listing.create({
    data: {
      id: LISTING_ID,
      slug: "stay-test",
      title: "stay test",
      description: "throwaway",
      dealType: "daily",
      propertyType: "apartment",
      price: 120,
      currency: "GEL",
      area: 50,
      city: "Tbilisi",
      district: "Vake",
      address: "test",
      lat: 41.7,
      lng: 44.7,
      agent: { name: "tester" },
      fillPercentage: 100,
      dailyRentalSettings: {
        create: {
          minNights: 2,
          maxNights: 10,
          guestCapacity: 3,
          cleaningFeeTetri: 5000,
          securityDepositTetri: 10000,
          weeklyDiscountPct: 10,
          monthlyDiscountPct: 20,
        },
      },
    },
  })
  await db.dailyRentalBlockedDate.create({
    data: { listingId: LISTING_ID, date: D(30), reason: "host" },
  })

  // 1. Happy path — totals must equal quoteStay exactly.
  const r1 = await db.$transaction((tx) =>
    createStayBooking(tx, { ...base, checkIn: D(10), checkOut: D(13), nights: 3, guests: 2 }),
  )
  ok(r1.ok, "happy path creates")
  if (r1.ok) {
    const expect = quoteStay({ nights: 3, ...pricing })
    ok(r1.booking.totalTetri === expect.totalTetri, `total snapshot ${r1.booking.totalTetri} === ${expect.totalTetri}`)
    const row = await db.dailyRentalBooking.findUnique({ where: { id: r1.booking.id } })
    ok(row?.nights === 3 && row?.guestCount === 2 && row?.currency === "GEL", "row fields persisted")
    ok(row?.discountTetri === 0 && row?.cleaningFeeTetri === 5000 && row?.securityDepositTetri === 10000, "fees persisted")
  }

  // 2. Sequential overlap rejected.
  const r2 = await db.$transaction((tx) =>
    createStayBooking(tx, { ...base, checkIn: D(11), checkOut: D(14), nights: 3, guests: 1 }),
  )
  ok(!r2.ok && r2.code === "date_unavailable", "overlap rejected")

  // 3. Concurrent race — exactly one winner.
  const racers = await Promise.all(
    [0, 1].map((i) =>
      db.$transaction((tx) =>
        createStayBooking(tx, {
          ...base,
          guestId: `racer-${i}`,
          checkIn: D(20),
          checkOut: D(24),
          nights: 4,
          guests: 2,
        }),
      ),
    ),
  )
  ok(racers.filter((r) => r.ok).length === 1, `race: exactly 1 winner (got ${racers.filter((r) => r.ok).length})`)
  ok(racers.filter((r) => !r.ok).every((r) => !r.ok && r.code === "date_unavailable"), "race loser gets date_unavailable")

  // 4. Touching checkout is free — new stay may start on the old checkout day.
  const r4 = await db.$transaction((tx) =>
    createStayBooking(tx, { ...base, guestId: "guest-4", checkIn: D(13), checkOut: D(15), nights: 2, guests: 1 }),
  )
  ok(r4.ok, "checkout day shared with previous stay is bookable")

  // 5. Blocked date inside range rejected.
  const r5 = await db.$transaction((tx) =>
    createStayBooking(tx, { ...base, guestId: "guest-5", checkIn: D(29), checkOut: D(31), nights: 2, guests: 1 }),
  )
  ok(!r5.ok && r5.code === "date_unavailable", "blocked date rejected")

  // 6. Stay length bounds.
  const r6a = await db.$transaction((tx) =>
    createStayBooking(tx, { ...base, guestId: "g6a", checkIn: D(40), checkOut: D(41), nights: 1, guests: 1 }),
  )
  ok(!r6a.ok && r6a.code === "stay_length", "below minNights rejected")
  const r6b = await db.$transaction((tx) =>
    createStayBooking(tx, { ...base, guestId: "g6b", checkIn: D(40), checkOut: D(51), nights: 11, guests: 1 }),
  )
  ok(!r6b.ok && r6b.code === "stay_length", "above maxNights rejected")

  // 7. Guest capacity bound.
  const r7 = await db.$transaction((tx) =>
    createStayBooking(tx, { ...base, guestId: "g7", checkIn: D(40), checkOut: D(43), nights: 3, guests: 5 }),
  )
  ok(!r7.ok && r7.code === "guest_count", "over capacity rejected")

  // 8. Transition machine — legal moves, illegal moves, and the confirm race.
  const t1 = await db.$transaction((tx) =>
    createStayBooking(tx, { ...base, guestId: "t1", checkIn: D(60), checkOut: D(63), nights: 3, guests: 1 }),
  )
  ok(t1.ok, "transition fixture created")
  if (t1.ok) {
    await db.$transaction((tx) => transitionStayBooking(tx, t1.booking.id, BookingStatus.confirmed))
    const row = await db.dailyRentalBooking.findUnique({ where: { id: t1.booking.id } })
    ok(row?.status === "confirmed", "pending → confirmed")
    await db.$transaction((tx) =>
      transitionStayBooking(tx, t1.booking.id, BookingStatus.cancelled_by_host, { cancelReason: "test" }),
    )
    const cancelled = await db.dailyRentalBooking.findUnique({ where: { id: t1.booking.id } })
    ok(cancelled?.status === "cancelled_by_host" && cancelled?.cancelledAt !== null, "confirmed → cancelled_by_host with timestamp")
    let threw = false
    try {
      await db.$transaction((tx) => transitionStayBooking(tx, t1.booking.id, BookingStatus.confirmed))
    } catch {
      threw = true
    }
    ok(threw, "terminal state rejects further transitions")
  }

  // 9. Overlapping pendings (legacy rows only — the API can't create them):
  // confirm is refused while a competing pending exists (pending blocks the
  // calendar everywhere: search, create, and confirm all agree), decline
  // clears the way, and a concurrent double-confirm of the same booking
  // lets exactly one through.
  const legacyA = await db.dailyRentalBooking.create({
    data: { listingId: LISTING_ID, guestId: "la", checkIn: D(80), checkOut: D(83), nights: 3, guestCount: 1, nightlyPriceTetri: 12000, cleaningFeeTetri: 0, securityDepositTetri: 0, totalTetri: 36000, currency: "GEL", guestName: "LA", guestPhone: "+995555000112" },
  })
  const legacyB = await db.dailyRentalBooking.create({
    data: { listingId: LISTING_ID, guestId: "lb", checkIn: D(81), checkOut: D(84), nights: 3, guestCount: 1, nightlyPriceTetri: 12000, cleaningFeeTetri: 0, securityDepositTetri: 0, totalTetri: 36000, currency: "GEL", guestName: "LB", guestPhone: "+995555000113" },
  })
  let refused = false
  try {
    await db.$transaction((tx) => transitionStayBooking(tx, legacyA.id, BookingStatus.confirmed))
  } catch {
    refused = true
  }
  ok(refused, "confirm refused while overlapping pending exists")
  await db.$transaction((tx) =>
    transitionStayBooking(tx, legacyB.id, BookingStatus.cancelled_by_host, { cancelReason: "test" }),
  )
  await db.$transaction((tx) => transitionStayBooking(tx, legacyA.id, BookingStatus.confirmed))
  ok(
    (await db.dailyRentalBooking.findUnique({ where: { id: legacyA.id } }))?.status === "confirmed",
    "confirm succeeds after the competing pending is declined",
  )
  const legacyC = await db.dailyRentalBooking.create({
    data: { listingId: LISTING_ID, guestId: "lc", checkIn: D(90), checkOut: D(92), nights: 2, guestCount: 1, nightlyPriceTetri: 12000, cleaningFeeTetri: 0, securityDepositTetri: 0, totalTetri: 24000, currency: "GEL", guestName: "LC", guestPhone: "+995555000114" },
  })
  const doubleConfirm = await Promise.allSettled([
    db.$transaction((tx) => transitionStayBooking(tx, legacyC.id, BookingStatus.confirmed)),
    db.$transaction((tx) => transitionStayBooking(tx, legacyC.id, BookingStatus.confirmed)),
  ])
  ok(
    doubleConfirm.filter((r) => r.status === "fulfilled").length === 1,
    `double-confirm race: exactly 1 winner (got ${doubleConfirm.filter((r) => r.status === "fulfilled").length})`,
  )

  // Cleanup — cascade removes the rest.
  await db.listing.delete({ where: { id: LISTING_ID } })
  const leftovers = await db.dailyRentalBooking.count({ where: { listingId: LISTING_ID } })
  ok(leftovers === 0, "cascade cleanup left no bookings")

  console.log(process.exitCode ? "stay-booking suite: FAILED" : `stay-booking suite: ${passed} passed`)
  await db.$disconnect()
  await pool.end()
}

main().catch((e) => {
  console.error("suite crashed:", e)
  process.exit(1)
})
