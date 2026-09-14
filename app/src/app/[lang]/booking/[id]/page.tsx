/**
 * Guest booking record — /{lang}/booking/{id}?t={cancelToken}.
 *
 * The anonymous guest's only durable view of a stay: the confirmation mail
 * links here, and the same HMAC that authorises cancelling is what authorises
 * reading. No token (or a bad one) renders nothing but a 404 — a booking id is
 * guessable enough that it must never be the sole key to someone's phone
 * number. Signed-in guests are let in by session instead.
 *
 * ponytail: no new state — reuses the cancel token that already existed.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import Navbar from "@/components/sections/Navbar"
import Footer from "@/components/sections/Footer"
import { PageHero } from "@/components/PageHero"
import { CancelStayButton } from "@/components/listing/CancelStayButton"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { isValidLang } from "@/lib/i18n/core"
import { stayBookingRef, verifyStayCancelToken } from "@/lib/stay-token"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "ჯავშანი — sivrce",
  robots: { index: false, follow: false },
}

type Copy = {
  kicker: string
  title: string
  subtitle: string
  dates: string
  nights: string
  guests: string
  total: string
  ref: string
  checkIn: string
  checkOut: string
  listing: string
  status: Record<string, string>
  pendingNote: string
  confirmedNote: string
  cancelledNote: string
}

const COPY: Record<"ka" | "en" | "ru", Copy> = {
  ka: {
    kicker: "ჯავშანი",
    title: "შენი ჯავშანი",
    subtitle: "შეინახე ეს ბმული — ჯავშანთან წვდომის ერთადერთი გზაა.",
    dates: "თარიღები",
    nights: "ღამე",
    guests: "სტუმრები",
    total: "ჯამი",
    ref: "ჯავშნის კოდი",
    checkIn: "შესვლა",
    checkOut: "გასვლა",
    listing: "განცხადება",
    status: {
      pending: "მოთხოვნა — ელოდება მასპინძელს",
      confirmed: "დადასტურებული",
      cancelled_by_guest: "გაუქმდა შენ მიერ",
      cancelled_by_host: "გაუქმდა მასპინძლის მიერ",
      no_show: "არ გამოცხადდა",
      completed: "დასრულდა",
    },
    pendingNote: "თანხა არ ჩამოიჭრება — მასპინძელი განიხილავს მოთხოვნას.",
    confirmedNote: "მასპინძელმა დაადასტურა. ანგარიშსწორება ადგილზე.",
    cancelledNote: "ეს ჯავშანი გაუქმებულია.",
  },
  en: {
    kicker: "Booking",
    title: "Your booking",
    subtitle: "Keep this link — it is the only way back to this booking.",
    dates: "Dates",
    nights: "nights",
    guests: "Guests",
    total: "Total",
    ref: "Booking code",
    checkIn: "Check-in",
    checkOut: "Check-out",
    listing: "Listing",
    status: {
      pending: "Requested — waiting on the host",
      confirmed: "Confirmed",
      cancelled_by_guest: "Cancelled by you",
      cancelled_by_host: "Cancelled by the host",
      no_show: "No-show",
      completed: "Completed",
    },
    pendingNote: "No charge — the host is reviewing your request.",
    confirmedNote: "The host confirmed. Payment is settled on arrival.",
    cancelledNote: "This booking is cancelled.",
  },
  ru: {
    kicker: "Бронь",
    title: "Твоя бронь",
    subtitle: "Сохрани эту ссылку — другого доступа к брони нет.",
    dates: "Даты",
    nights: "ночей",
    guests: "Гости",
    total: "Итого",
    ref: "Код брони",
    checkIn: "Заезд",
    checkOut: "Выезд",
    listing: "Объявление",
    status: {
      pending: "Запрос — ждём хозяина",
      confirmed: "Подтверждена",
      cancelled_by_guest: "Отменена тобой",
      cancelled_by_host: "Отменена хозяином",
      no_show: "Не заселился",
      completed: "Завершена",
    },
    pendingNote: "Списания нет — хозяин рассматривает запрос.",
    confirmedNote: "Хозяин подтвердил. Оплата на месте.",
    cancelledNote: "Эта бронь отменена.",
  },
}

const iso = (d: Date) => d.toISOString().slice(0, 10)
const hour = (h: number) => `${String(h).padStart(2, "0")}:00`

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [{ lang: rawLang, id }, sp] = await Promise.all([params, searchParams])
  const lang = isValidLang(rawLang) ? rawLang : "ka"
  const t = COPY[lang === "en" || lang === "ru" ? lang : "ka"]

  if (!/^[0-9a-f-]{10,64}$/i.test(id)) notFound()
  const token = typeof sp.t === "string" ? sp.t : ""

  const booking = await db.dailyRentalBooking.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      checkIn: true,
      checkOut: true,
      nights: true,
      guestCount: true,
      totalTetri: true,
      guestName: true,
      paidAt: true,
      paymentOrderId: true,
      listing: { select: { id: true, title: true, city: true, dailyRentalSettings: true } },
    },
  })
  if (!booking) notFound()

  // Same proof the cancel endpoint accepts, checked before a single detail is
  // rendered — an unauthenticated reader must not learn the booking exists.
  const session = await auth().catch(() => null)
  const owns =
    verifyStayCancelToken(id, token) ||
    Boolean(session?.user?.id && session.user.id === (await guestIdOf(id)))
  if (!owns) notFound()

  const s = booking.listing.dailyRentalSettings
  const cancelled =
    booking.status === "cancelled_by_guest" || booking.status === "cancelled_by_host"
  // Paid stays are refused by transitionStayBooking (no refund flow exists),
  // so don't offer a button that can only fail.
  const cancellable =
    !cancelled &&
    (booking.status === "pending" || booking.status === "confirmed") &&
    !booking.paidAt &&
    !booking.paymentOrderId

  const rows: [string, string][] = [
    [t.listing, booking.listing.title],
    [t.dates, `${iso(booking.checkIn)} → ${iso(booking.checkOut)} · ${booking.nights} ${t.nights}`],
    [t.checkIn, hour(s?.checkInHour ?? 15)],
    [t.checkOut, hour(s?.checkOutHour ?? 11)],
    [t.guests, String(booking.guestCount)],
    [t.total, `₾${(booking.totalTetri / 100).toFixed(2)}`],
    [t.ref, stayBookingRef(booking.id)],
  ]

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <PageHero tone="light" kicker={t.kicker} title={t.title} subtitle={t.subtitle} />
        <section className="mx-auto max-w-2xl px-6 pb-20">
          <div className="rounded-card bg-sv-surface p-6 shadow-card ring-1 ring-sv-ink/5">
            <p
              className={[
                "inline-flex rounded-full px-3 py-1 text-[12px] font-black uppercase tracking-wide",
                booking.status === "confirmed"
                  ? "bg-sv-success/15 text-sv-success"
                  : cancelled
                    ? "bg-sv-ink/10 text-sv-ink/55"
                    : "bg-sv-orange/15 text-sv-orange-deep",
              ].join(" ")}
            >
              {t.status[booking.status] ?? booking.status}
            </p>

            <dl className="mt-5 divide-y divide-sv-ink/5">
              {rows.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-3">
                  <dt className="text-[13px] font-bold text-sv-ink/50">{label}</dt>
                  <dd className="text-right text-[14px] font-extrabold text-sv-ink">{value}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-4 text-[13px] font-semibold text-sv-ink/55">
              {cancelled ? t.cancelledNote : booking.status === "confirmed" ? t.confirmedNote : t.pendingNote}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={`/${lang}/listing/${booking.listing.id}`}
                className="rounded-control bg-sv-blue px-5 py-2.5 text-[14px] font-bold text-white hover:bg-sv-blue-deep"
              >
                {t.listing}
              </Link>
              {cancellable && <CancelStayButton bookingId={booking.id} token={token} lang={lang} />}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

/** Second read, only on the session path — keeps guestId out of the token path. */
async function guestIdOf(id: string): Promise<string | null> {
  const row = await db.dailyRentalBooking.findUnique({ where: { id }, select: { guestId: true } })
  return row?.guestId ?? null
}
