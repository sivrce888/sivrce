/**
 * Runnable check for stay-booking notifications.
 * Run: npx tsx src/lib/stay-email.check.ts
 *
 * Composition is pure, so this asserts the bodies without sending anything —
 * the whole point of splitting build* from send*. What matters most: the guest
 * mail must carry the cancel link, because it is the only durable copy of the
 * token (the widget's copy dies with the tab).
 */
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

import { BookingStatus } from "@/generated/prisma/enums"
import {
  buildStayCreatedEmails,
  buildStayStatusEmail,
  stayBookingUrl,
  type StayMailBooking,
  type StayMailListing,
} from "./stay-email"

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg)
}

const listing: StayMailListing = {
  id: "batumi-1",
  title: "Sea view on the new boulevard",
  checkInHour: 15,
  checkOutHour: 11,
}

const base: StayMailBooking = {
  id: "11111111-2222-3333-4444-555555555555",
  ref: "11111111",
  cancelToken: "tok_abc123",
  status: BookingStatus.pending,
  checkIn: new Date("2026-10-01T00:00:00Z"),
  checkOut: new Date("2026-10-04T00:00:00Z"),
  nights: 3,
  guestCount: 2,
  totalTetri: 157_746,
  guestName: "Nino",
  guestPhone: "+995555000111",
  guestEmail: "guest@example.com",
  guestNotes: null,
}

// --- URL carries both the id and the proof ---------------------------------
const url = stayBookingUrl(base.id, base.cancelToken, "en")
assert(url.includes(`/en/booking/${base.id}`), "booking url is lang-scoped and id-addressed")
assert(url.includes("t=tok_abc123"), "booking url carries the cancel token")

// --- Created: two mails, guest + host --------------------------------------
const created = buildStayCreatedEmails({ booking: base, listing, hostEmail: "host@example.com" })
assert(created.length === 2, `pending booking mails guest + host, got ${created.length}`)
const [guestMail, hostMail] = created
assert(guestMail.to === "guest@example.com" && hostMail.to === "host@example.com", "recipients")
assert(guestMail.html.includes(url.replace("/en/", "/ka/")), "guest mail carries the cancel link")
assert(guestMail.subject.includes(base.ref), "guest subject carries the booking ref")
assert(guestMail.html.includes("₾1577.46"), "guest mail shows the exact total booked")
assert(guestMail.html.includes("2026-10-01") && guestMail.html.includes("2026-10-04"), "guest mail shows dates")
assert(hostMail.html.includes("+995555000111"), "host mail carries the guest phone to act on")
assert(hostMail.html.includes("/seller/stays"), "host mail links to where confirming happens")

// A guest with no address still notifies the host — the booking is real.
const noEmail = buildStayCreatedEmails({
  booking: { ...base, guestEmail: null },
  listing,
  hostEmail: "host@example.com",
})
assert(noEmail.length === 1 && noEmail[0].to === "host@example.com", "no guest address → host mail only")
// An ownerless listing must not crash the send path.
assert(buildStayCreatedEmails({ booking: base, listing, hostEmail: null }).length === 1, "no host → guest only")

// Instant bookings are already confirmed — never promise a review that won't come.
const instant = buildStayCreatedEmails({
  booking: { ...base, status: BookingStatus.confirmed },
  listing,
  hostEmail: "host@example.com",
})
assert(instant[0].subject.includes("დადასტურდა"), "instant booking mail says confirmed")
assert(!instant[0].html.includes("დადასტურებამდე თანხა"), "instant mail drops the pending-charge line")

// --- Status changes --------------------------------------------------------
const confirmMail = buildStayStatusEmail({ booking: base, listing, status: BookingStatus.confirmed })
assert(confirmMail?.subject.includes("დადასტურდა"), "confirm mails the guest")
const hostCancel = buildStayStatusEmail({
  booking: base,
  listing,
  status: BookingStatus.cancelled_by_host,
  reason: "maintenance",
})
assert(hostCancel?.html.includes("maintenance"), "cancel mail carries the host's reason")
assert(
  buildStayStatusEmail({ booking: base, listing, status: BookingStatus.completed }) === null,
  "completed is bookkeeping, not guest news",
)
assert(
  buildStayStatusEmail({ booking: { ...base, guestEmail: null }, listing, status: BookingStatus.confirmed }) === null,
  "no address → no mail",
)

// --- HTML escaping at the one place guest input reaches a body -------------
const nasty = buildStayCreatedEmails({
  booking: { ...base, guestName: '<script>alert("x")</script>', guestNotes: "a & b" },
  listing,
  hostEmail: "host@example.com",
})
assert(!nasty[0].html.includes("<script>"), "guest name is escaped, never injected")
assert(nasty[1].html.includes("a &amp; b"), "notes are escaped")

// --- Wiring: every status transition must notify ---------------------------
const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const route = readFileSync(join(root, "app/api/bookings/route.ts"), "utf8")
assert(route.includes("sendStayBookingCreated"), "create route must notify")
assert(!/await\s+sendStayBookingCreated/.test(route), "notification must not be awaited — mail can't fail a booking")
for (const file of ["app/[lang]/seller/stays/actions.ts", "app/[lang]/admin/rentals/actions.ts"]) {
  const src = readFileSync(join(root, file), "utf8")
  assert(src.includes("notifyStayStatusChanged"), `${file} must notify the guest on a status change`)
}
// The guest page is the link target — a mail pointing nowhere is worse than none.
const page = readFileSync(join(root, "app/[lang]/booking/[id]/page.tsx"), "utf8")
assert(page.includes("verifyStayCancelToken"), "booking page must verify the token before rendering details")
assert(page.includes("notFound()"), "an unproven reader gets a 404, never the guest's details")

console.log("stay-email: ok — urls, guest+host bodies, status mails, escaping, wiring")
