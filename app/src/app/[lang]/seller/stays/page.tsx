import type { Metadata } from "next"
import LocalizedLink from "@/components/LocalizedLink"
import { MessageCircle, Phone } from "lucide-react"

import { sellerSetStayStatus } from "./actions"
import { BookingStatus } from "@/generated/prisma/enums"
import type { Prisma } from "@/generated/prisma/client"

import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import Badge from "@/components/agent-dashboard/Badge"
import { fmtDate } from "@/components/agent-dashboard/format"
import { telHref, waHref } from "@/lib/inquiries/phone"
import { BlockedDatesManager } from "@/components/seller-dashboard/BlockedDatesManager"
import { sellerNav } from "@/components/seller-dashboard/nav"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"
import { panelTitle } from "@/lib/workspace"
import { readPersona } from "@/lib/workspace-cookie"
import { isValidLang, panelLang } from "@/lib/i18n/core"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "ღამეული დაჯავშნები — გამყიდველის პანელი",
  robots: { index: false },
}

const stayListingInclude = {
  listing: { select: { id: true, title: true, city: true, district: true } },
} as const

type StayBooking = Prisma.DailyRentalBookingGetPayload<{ include: typeof stayListingInclude }>

const L = {
  ka: {
    subtitle: "ღამეული",
    heading: "ღამეული დაჯავშნები",
    requests: "მოთხოვნები",
    requestsEmpty: "მოთხოვნები არ არის",
    requestsEmptyBody:
      "როცა სტუმარი შენს განცხადებაზე ღამეულს დაჯავშნის, მოთხოვნა აქ გამოჩნდება.",
    confirmed: "დადასტურებული",
    confirmedEmpty: "დადასტურებული ჯავშნები არ არის",
    confirmedEmptyBody: "დაადასტურე მოთხოვნა და გამოჩნდება აქ.",
    history: "ისტორია",
    calendar: "კალენდარი",
    calendarNote: "შეეხე თარიღს დასაბლოკად/გასახსნელად — დაბლოკილ ღამებზე ჯავშანი არ ჯავშნის.",
    nights: "ღამე",
    guests: "სტუმარი",
    waBrand: "სივრცე",
    confirm: "დადასტურება",
    reject: "უარყოფა",
    cancel: "გაუქმება",
    status: {
      pending: "მოთხოვნა",
      confirmed: "დადასტურებული",
      cancelled_by_guest: "გაუქმდა სტუმრის მიერ",
      cancelled_by_host: "გაუქმდა შენს მიერ",
      no_show: "არ გამოჩენილა",
      completed: "დასრულდა",
    } as Record<string, string>,
  },
  en: {
    subtitle: "Stays",
    heading: "Overnight bookings",
    requests: "Requests",
    requestsEmpty: "No requests",
    requestsEmptyBody:
      "When a guest books your listing for a stay, the request will appear here.",
    confirmed: "Confirmed",
    confirmedEmpty: "No confirmed bookings",
    confirmedEmptyBody: "Confirm a request and it will appear here.",
    history: "History",
    calendar: "Calendar",
    calendarNote: "Tap a date to block/unblock it — blocked nights cannot be booked.",
    nights: "nights",
    guests: "guests",
    waBrand: "Sivrce",
    confirm: "Confirm",
    reject: "Reject",
    cancel: "Cancel",
    status: {
      pending: "Request",
      confirmed: "Confirmed",
      cancelled_by_guest: "Cancelled by guest",
      cancelled_by_host: "Cancelled by you",
      no_show: "No-show",
      completed: "Completed",
    } as Record<string, string>,
  },
  de: {
    subtitle: "Übernachtungen",
    heading: "Übernachtungsbuchungen",
    requests: "Anfragen",
    requestsEmpty: "Keine Anfragen",
    requestsEmptyBody:
      "Sobald ein Gast eine Übernachtung in Ihrem Inserat bucht, erscheint die Anfrage hier.",
    confirmed: "Bestätigt",
    confirmedEmpty: "Keine bestätigten Buchungen",
    confirmedEmptyBody: "Bestätigen Sie eine Anfrage, dann erscheint sie hier.",
    history: "Verlauf",
    calendar: "Kalender",
    calendarNote:
      "Tippen Sie auf ein Datum, um es zu sperren bzw. freizugeben — auf gesperrten Nächten ist keine Buchung möglich.",
    nights: "Nächte",
    guests: "Gäste",
    waBrand: "Sivrce",
    confirm: "Bestätigen",
    reject: "Ablehnen",
    cancel: "Stornieren",
    status: {
      pending: "Anfrage",
      confirmed: "Bestätigt",
      cancelled_by_guest: "Vom Gast storniert",
      cancelled_by_host: "Von Ihnen storniert",
      no_show: "Nicht erschienen",
      completed: "Abgeschlossen",
    } as Record<string, string>,
  },
} as const

type StaysStrings = (typeof L)[keyof typeof L]
const STATUS_TONE: Record<string, "green" | "orange" | "red" | "neutral"> = {
  pending: "orange",
  confirmed: "green",
  no_show: "red",
  cancelled_by_guest: "neutral",
  cancelled_by_host: "neutral",
  completed: "neutral",
}

const gel = (tetri: number) => `₾${(tetri / 100).toLocaleString("ka-GE")}`

function StayCard({
  booking,
  actions,
  c,
  lang,
}: {
  booking: StayBooking
  actions: boolean
  c: StaysStrings
  lang: string
}) {
  return (
    <li className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <LocalizedLink
            href={`/listing/${booking.listing.id}`}
            className="block truncate text-[15px] font-extrabold text-sv-ink hover:text-sv-blue"
          >
            {booking.listing.title}
          </LocalizedLink>
          <p className="mt-0.5 text-[12.5px] font-medium text-sv-ink/60">
            {booking.listing.city} · {booking.listing.district}
          </p>
        </div>
        <Badge
          label={c.status[booking.status] ?? booking.status}
          tone={STATUS_TONE[booking.status] ?? "neutral"}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-sv-ink/6 pt-3 text-[12.5px] font-medium text-sv-ink/60">
        <span className="font-bold text-sv-ink/75">
          {fmtDate(booking.checkIn, lang)} → {fmtDate(booking.checkOut, lang)} · {booking.nights} {c.nights}
        </span>
        <span>
          {booking.guestCount} {c.guests} ·{" "}
          <span className="font-bold text-sv-ink/75">{gel(booking.totalTetri)}</span>
        </span>
        <span>{booking.guestName}</span>
        <a href={telHref(booking.guestPhone)} className="inline-flex items-center gap-1.5 hover:text-sv-blue">
          <Phone size={13} />
          {booking.guestPhone}
        </a>
        <a
          href={waHref(booking.guestPhone, `${c.waBrand} — ${booking.listing.title}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-bold text-sv-blue hover:underline"
        >
          <MessageCircle size={13} />
          WhatsApp
        </a>
      </div>
      {booking.guestNotes ? (
        <p className="mt-2 text-[12px] font-medium text-sv-ink/60">„{booking.guestNotes}“</p>
      ) : null}
      {actions ? (
        <div className="mt-3 flex gap-2">
          <form action={sellerSetStayStatus}>
            <input type="hidden" name="id" value={booking.id} />
            <input type="hidden" name="status" value="confirmed" />
            <button
              type="submit"
              className="rounded-control bg-sv-blue px-4 py-2 text-[13px] font-bold text-white transition hover:-translate-y-0.5 hover:shadow-glow-blue-sm"
            >
              {c.confirm}
            </button>
          </form>
          <form action={sellerSetStayStatus}>
            <input type="hidden" name="id" value={booking.id} />
            <input type="hidden" name="status" value="cancelled_by_host" />
            <input type="hidden" name="reason" value="host" />
            <button
              type="submit"
              className="rounded-control border border-sv-ink/10 px-4 py-2 text-[13px] font-bold text-sv-ink/60 transition hover:bg-sv-cloud"
            >
              {c.reject}
            </button>
          </form>
        </div>
      ) : null}
      {booking.status === BookingStatus.confirmed && !actions ? (
        <form action={sellerSetStayStatus} className="mt-3">
          <input type="hidden" name="id" value={booking.id} />
          <input type="hidden" name="status" value="cancelled_by_host" />
          <input type="hidden" name="reason" value="host" />
          <button
            type="submit"
            className="text-[12px] font-bold text-sv-ink/50 underline hover:text-sv-ink"
          >
            {c.cancel}
          </button>
        </form>
      ) : null}
    </li>
  )
}

export default async function SellerStaysPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : "ka"
  const c = L[panelLang(lang)]
  const user = await requireRole("seller", "/seller")
  const persona = await readPersona(user.role)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const mine = { listing: { ownerId: user.id, deletedAt: null, dealType: "daily" } } as const

  const [pending, upcoming, history, dailyListings] = await Promise.all([
    safeQuery(
      () =>
        db.dailyRentalBooking.findMany({
          where: { ...mine, status: "pending" },
          orderBy: { checkIn: "asc" },
          include: stayListingInclude,
        }),
      [],
    ),
    safeQuery(
      () =>
        db.dailyRentalBooking.findMany({
          where: { ...mine, status: "confirmed", checkOut: { gte: today } },
          orderBy: { checkIn: "asc" },
          include: stayListingInclude,
        }),
      [],
    ),
    safeQuery(
      () =>
        db.dailyRentalBooking.findMany({
          where: {
            ...mine,
            OR: [
              { status: { in: ["cancelled_by_guest", "cancelled_by_host", "no_show", "completed"] } },
              { checkOut: { lt: today } },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 15,
          include: stayListingInclude,
        }),
      [],
    ),
    safeQuery(
      () =>
        db.listing.findMany({
          where: { ownerId: user.id, deletedAt: null, dealType: "daily" },
          select: {
            id: true,
            title: true,
            dailyRentalBlockedDates: { where: { date: { gte: today } }, select: { date: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
      [],
    ),
  ])

  return (
    <DashboardShell
      nav={sellerNav(lang)}
      title={panelTitle(persona, lang)}
      subtitle={c.subtitle}
      userLabel={user.name ?? user.email}
    >
      <h1 className="mb-5 text-xl font-black tracking-tight text-sv-ink">{c.heading}</h1>

      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-[14px] font-extrabold uppercase tracking-wide text-sv-ink/60">
            {c.requests} ({pending.length})
          </h2>
          {pending.length === 0 ? (
            <EmptyState title={c.requestsEmpty} body={c.requestsEmptyBody} />
          ) : (
            <ul className="space-y-3">
              {pending.map((b) => (
                <StayCard key={b.id} booking={b} actions c={c} lang={lang} />
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-[14px] font-extrabold uppercase tracking-wide text-sv-ink/60">
            {c.confirmed} ({upcoming.length})
          </h2>
          {upcoming.length === 0 ? (
            <EmptyState title={c.confirmedEmpty} body={c.confirmedEmptyBody} />
          ) : (
            <ul className="space-y-3">
              {upcoming.map((b) => (
                <StayCard key={b.id} booking={b} actions={false} c={c} lang={lang} />
              ))}
            </ul>
          )}
        </section>

        {history.length > 0 ? (
          <section>
            <h2 className="mb-3 text-[14px] font-extrabold uppercase tracking-wide text-sv-ink/60">
              {c.history}
            </h2>
            <ul className="space-y-3">
              {history.map((b) => (
                <StayCard key={b.id} booking={b} actions={false} c={c} lang={lang} />
              ))}
            </ul>
          </section>
        ) : null}

        {dailyListings.length > 0 ? (
          <section>
            <h2 className="mb-3 text-[14px] font-extrabold uppercase tracking-wide text-sv-ink/60">
              {c.calendar}
            </h2>
            <p className="mb-3 text-[12.5px] font-medium text-sv-ink/50">{c.calendarNote}</p>
            <div className="space-y-4">
              {dailyListings.map((l) => (
                <BlockedDatesManager
                  key={l.id}
                  listingId={l.id}
                  listingTitle={l.title}
                  initialBlocked={l.dailyRentalBlockedDates.map((d) => d.date.toISOString().slice(0, 10))}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </DashboardShell>
  )
}
