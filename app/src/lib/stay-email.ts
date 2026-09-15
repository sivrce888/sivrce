/**
 * Stay-booking notifications — the guest's only durable record of a request.
 *
 * Without these a booking dead-ends: the ref and cancel token live in React
 * state, so closing the tab loses both and the guest can never cancel. Every
 * send therefore carries the /booking/{id}?t={token} deep link.
 *
 * Same fire-and-forget contract as sendInquiryNotification — callers must NOT
 * await, a mail outage must never fail a booking that already committed.
 * ponytail: plain HTML strings like the rest of email.ts, no template engine.
 */

import { BookingStatus } from "@/generated/prisma/enums"
import { db } from "@/lib/db"
import { sendEmail } from "@/lib/email"
import { createStayCancelToken, stayBookingRef } from "@/lib/stay-token"

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sivrce.ge"

export interface StayMailBooking {
  id: string
  ref: string
  cancelToken: string
  status: BookingStatus
  checkIn: Date
  checkOut: Date
  nights: number
  guestCount: number
  totalTetri: number
  guestName: string
  guestPhone: string
  guestEmail?: string | null
  guestNotes?: string | null
}

export interface StayMailListing {
  id: string
  title: string
  checkInHour: number
  checkOutHour: number
}

/** Guest-facing URL that proves ownership — the cancel link in every mail. */
export function stayBookingUrl(bookingId: string, cancelToken: string, lang = "ka"): string {
  return `${SITE}/${lang}/booking/${bookingId}?t=${encodeURIComponent(cancelToken)}`
}

const iso = (d: Date) => d.toISOString().slice(0, 10)
const gel = (tetri: number) => `₾${(tetri / 100).toFixed(2)}`
const hour = (h: number) => `${String(h).padStart(2, "0")}:00`

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** Shared stay facts block — identical numbers in the guest and host mails. */
function detailRows(b: StayMailBooking, l: StayMailListing): string {
  return `
    <p><strong>განცხადება:</strong> ${escapeHtml(l.title)}</p>
    <p><strong>თარიღები:</strong> ${iso(b.checkIn)} → ${iso(b.checkOut)} (${b.nights} ღამე)</p>
    <p><strong>შესვლა/გასვლა:</strong> ${hour(l.checkInHour)} / ${hour(l.checkOutHour)}</p>
    <p><strong>სტუმრები:</strong> ${b.guestCount}</p>
    <p><strong>ჯამი:</strong> ${gel(b.totalTetri)}</p>
    <p><strong>ჯავშნის კოდი:</strong> ${escapeHtml(b.ref)}</p>
  `
}

/**
 * Fire-and-forget: confirm the request to the guest and alert the host.
 * `instant` bookings are already confirmed, so the guest copy says so rather
 * than promising a host review that will never come.
 */
export function sendStayBookingCreated(params: {
  booking: StayMailBooking
  listing: StayMailListing
  hostEmail: string | null
  lang?: string
}): void {
  for (const mail of buildStayCreatedEmails(params)) void sendEmail(mail)
}

export interface StayMail {
  to: string
  subject: string
  html: string
}

/**
 * Pure: the messages a new booking produces (guest copy when we have an
 * address, host copy when the listing has an owner). Separated from the send
 * so stay-email.check.ts can assert the ref, totals and cancel link are
 * actually in the body — without putting mail on the wire.
 */
export function buildStayCreatedEmails(params: {
  booking: StayMailBooking
  listing: StayMailListing
  hostEmail: string | null
  lang?: string
}): StayMail[] {
  const { booking: b, listing: l, hostEmail } = params
  const url = stayBookingUrl(b.id, b.cancelToken, params.lang ?? "ka")
  const confirmed = b.status === BookingStatus.confirmed
  const out: StayMail[] = []

  if (b.guestEmail) {
    out.push({
      to: b.guestEmail,
      subject: confirmed
        ? `ჯავშანი დადასტურდა — ${b.ref}`
        : `ჯავშნის მოთხოვნა მიღებულია — ${b.ref}`,
      html: `
        <h2>${confirmed ? "ჯავშანი დადასტურდა" : "მოთხოვნა გაიგზავნა"}</h2>
        <p>გამარჯობა ${escapeHtml(b.guestName)},</p>
        <p>${
          confirmed
            ? "შენი ჯავშანი დადასტურებულია."
            : "მოთხოვნა მასპინძელს გადაეგზავნა — დადასტურებამდე თანხა არ ჩამოიჭრება."
        }</p>
        ${detailRows(b, l)}
        <p>
          <a href="${escapeHtml(url)}" style="color:#1a56db;font-weight:600">
            ჯავშნის ნახვა და გაუქმება &rarr;
          </a>
        </p>
        <hr />
        <p style="color:#888;font-size:12px">
          შეინახე ეს წერილი — ბმული შენი ჯავშნის ერთადერთი წვდომაა.
        </p>
      `,
    })
  }

  if (hostEmail) {
    out.push({
      to: hostEmail,
      subject: confirmed
        ? `ახალი ჯავშანი — ${b.ref}`
        : `ახალი ჯავშნის მოთხოვნა — ${b.ref}`,
      html: `
        <h2>${confirmed ? "ახალი ჯავშანი" : "ახალი მოთხოვნა"}</h2>
        ${detailRows(b, l)}
        <p><strong>სტუმარი:</strong> ${escapeHtml(b.guestName)}</p>
        <p><strong>ტელეფონი:</strong> ${escapeHtml(b.guestPhone)}</p>
        ${b.guestEmail ? `<p><strong>ელფოსტა:</strong> ${escapeHtml(b.guestEmail)}</p>` : ""}
        ${b.guestNotes ? `<p><strong>შენიშვნა:</strong> ${escapeHtml(b.guestNotes)}</p>` : ""}
        <p>
          <a href="${SITE}/ka/seller/stays" style="color:#1a56db;font-weight:600">
            ${confirmed ? "ჯავშნების ნახვა" : "დადასტურება ან უარყოფა"} &rarr;
          </a>
        </p>
      `,
    })
  }

  return out
}

/**
 * Load the booking and mail the guest the host's decision. Call AFTER the
 * transaction commits, without awaiting — the status change is already durable
 * and a mail failure must not roll it back or surface to the actor.
 * Shared by the seller and admin actions so neither can forget to notify.
 */
export function notifyStayStatusChanged(bookingId: string, reason?: string | null): void {
  void (async () => {
    try {
      const row = await db.dailyRentalBooking.findUnique({
        where: { id: bookingId },
        select: {
          id: true,
          status: true,
          checkIn: true,
          checkOut: true,
          nights: true,
          guestCount: true,
          totalTetri: true,
          guestName: true,
          guestPhone: true,
          guestEmail: true,
          listing: { select: { id: true, title: true, dailyRentalSettings: true } },
        },
      })
      if (!row?.guestEmail) return
      sendStayStatusChanged({
        booking: {
          id: row.id,
          ref: stayBookingRef(row.id),
          cancelToken: createStayCancelToken(row.id),
          status: row.status,
          checkIn: row.checkIn,
          checkOut: row.checkOut,
          nights: row.nights,
          guestCount: row.guestCount,
          totalTetri: row.totalTetri,
          guestName: row.guestName,
          guestPhone: row.guestPhone,
          guestEmail: row.guestEmail,
        },
        listing: {
          id: row.listing.id,
          title: row.listing.title,
          checkInHour: row.listing.dailyRentalSettings?.checkInHour ?? 15,
          checkOutHour: row.listing.dailyRentalSettings?.checkOutHour ?? 11,
        },
        status: row.status,
        reason,
      })
    } catch (err) {
      console.error("[stay-email] status notify failed:", (err as Error).message)
    }
  })()
}

/**
 * Fire-and-forget: tell the guest what the host decided. Without this the
 * request model is one-way — the guest waits on a confirmation they never see.
 */
export function sendStayStatusChanged(params: {
  booking: StayMailBooking
  listing: StayMailListing
  status: BookingStatus
  reason?: string | null
  lang?: string
}): void {
  const mail = buildStayStatusEmail(params)
  if (mail) void sendEmail(mail)
}

/**
 * Pure: the guest's status mail, or null when there is nothing to say —
 * no address on file, or a status the guest does not need a mail about
 * (no_show/completed are host bookkeeping, not news).
 */
export function buildStayStatusEmail(params: {
  booking: StayMailBooking
  listing: StayMailListing
  status: BookingStatus
  reason?: string | null
  lang?: string
}): StayMail | null {
  const { booking: b, listing: l, status } = params
  if (!b.guestEmail) return null
  const url = stayBookingUrl(b.id, b.cancelToken, params.lang ?? "ka")
  const cancelled =
    status === BookingStatus.cancelled_by_host || status === BookingStatus.cancelled_by_guest
  if (!cancelled && status !== BookingStatus.confirmed) return null

  return {
    to: b.guestEmail,
    subject: cancelled ? `ჯავშანი გაუქმდა — ${b.ref}` : `ჯავშანი დადასტურდა — ${b.ref}`,
    html: `
      <h2>${cancelled ? "ჯავშანი გაუქმდა" : "ჯავშანი დადასტურდა"}</h2>
      <p>გამარჯობა ${escapeHtml(b.guestName)},</p>
      <p>${
        cancelled
          ? status === BookingStatus.cancelled_by_host
            ? "სამწუხაროდ მასპინძელმა ჯავშანი გააუქმა."
            : "შენი ჯავშანი გაუქმებულია."
          : "მასპინძელმა შენი მოთხოვნა დაადასტურა."
      }</p>
      ${params.reason ? `<p><strong>მიზეზი:</strong> ${escapeHtml(params.reason)}</p>` : ""}
      ${detailRows(b, l)}
      <p>
        <a href="${escapeHtml(url)}" style="color:#1a56db;font-weight:600">
          ჯავშნის ნახვა &rarr;
        </a>
      </p>
    `,
  }
}
