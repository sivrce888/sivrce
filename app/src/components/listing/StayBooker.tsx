"use client"

import { useMemo, useState } from "react"
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/context"
import { quoteStay } from "@/lib/bookings"
import { lt } from "./i18n"

/**
 * Stay booking widget for daily-rental listings. Availability + settings come
 * from GET /api/bookings (server-truth); the breakdown reuses quoteStay so the
 * shown total and the booked total are the same arithmetic. POST /api/bookings
 * re-validates and re-quotes server-side — this UI is never trusted.
 */

interface StaySettings {
  minNights: number
  maxNights: number
  guestCapacity: number
  cleaningFeeTetri: number
  securityDepositTetri: number
  weeklyDiscountPct: number
  monthlyDiscountPct: number
  checkInHour: number
  checkOutHour: number
}

interface Avail {
  bookable: boolean
  reason?: string
  nightlyTetri: number
  windowEnd: string
  nights: string[]
  settings: StaySettings
}

const DAY = 86_400_000
const parseIso = (s: string) => Date.parse(`${s}T00:00:00Z`)
const nightsBetween = (a: string, b: string) => Math.round((parseIso(b) - parseIso(a)) / DAY)

function addDays(s: string, n: number): string {
  return new Date(parseIso(s) + n * DAY).toISOString().slice(0, 10)
}

function localTodayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** Every night in [from, to) must be free for the range to hold. */
function rangeFree(from: string, to: string, occupied: Set<string>): boolean {
  for (let d = from; d < to; d = addDays(d, 1)) if (occupied.has(d)) return false
  return true
}

const MONDAY_FIRST = ["2026-06-01", "2026-06-02", "2026-06-03", "2026-06-04", "2026-06-05", "2026-06-06", "2026-06-07"]

function MonthGrid(props: {
  monthIso: string
  tag: string
  todayIso: string
  windowEnd: string
  occupied: Set<string>
  checkIn: string
  checkOut: string
  onPick: (iso: string) => void
}) {
  const { monthIso, tag, todayIso, windowEnd, occupied, checkIn, checkOut, onPick } = props
  const y = Number(monthIso.slice(0, 4))
  const m = Number(monthIso.slice(5, 7))
  const first = new Date(Date.UTC(y, m - 1, 1))
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const lead = (first.getUTCDay() + 6) % 7 // Monday-first
  const labelFmt = new Intl.DateTimeFormat(tag, { month: "long", year: "numeric", timeZone: "UTC" })
  const dowFmt = new Intl.DateTimeFormat(tag, { weekday: "narrow", timeZone: "UTC" })
  const ariaFmt = new Intl.DateTimeFormat(tag, { dateStyle: "long", timeZone: "UTC" })

  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => addDays(monthIso, i)),
  ]

  return (
    <div>
      <div className="mb-2 text-center text-[13px] font-black text-sv-ink">{labelFmt.format(first)}</div>
      <div className="grid grid-cols-7 gap-y-1">
        {MONDAY_FIRST.map((d) => (
          <div key={d} className="text-center text-[11px] font-bold text-sv-ink/40" aria-hidden>
            {dowFmt.format(new Date(`${d}T00:00:00Z`))}
          </div>
        ))}
        {cells.map((iso, i) => {
          if (!iso) return <div key={`b${i}`} />
          const isPast = iso < todayIso
          const beyondWindow = iso > windowEnd
          const isOccupied = occupied.has(iso)
          const isStart = iso === checkIn
          const isEnd = iso === checkOut
          const inRange = checkIn && checkOut && iso > checkIn && iso < checkOut
          const disabled = isPast || beyondWindow
          const inSelected = isStart || isEnd || inRange
          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              aria-label={ariaFmt.format(new Date(`${iso}T00:00:00Z`))}
              aria-pressed={isStart || isEnd}
              onClick={() => onPick(iso)}
              className={[
                "mx-auto flex h-9 w-9 items-center justify-center text-[13px] font-semibold transition",
                disabled ? "cursor-not-allowed text-sv-ink/20" : "",
                !disabled && isOccupied && !inSelected ? "text-sv-ink/25 line-through" : "",
                !disabled && !inSelected && !isOccupied ? "text-sv-ink hover:bg-sv-blue/10" : "",
                inRange ? "rounded-none bg-sv-blue/15 text-sv-ink" : "",
                isStart ? "rounded-l-full bg-sv-blue text-white" : "",
                isEnd ? "rounded-r-full bg-sv-blue text-white" : "",
                isStart && isEnd ? "rounded-full" : "",
              ].join(" ")}
            >
              {Number(iso.slice(8, 10))}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function StayBooker({ listingId }: { listingId: string }) {
  const { t, lang } = useI18n()
  const [open, setOpen] = useState(false)
  const [avail, setAvail] = useState<{ status: "loading" } | { status: "ready"; data: Avail } | { status: "error" }>({ status: "loading" })
  const [cursor, setCursor] = useState(0) // month pair offset 0..2 (~120d window)
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [guests, setGuests] = useState(1)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [notes, setNotes] = useState("")
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  const todayIso = localTodayIso()
  const nf = useMemo(
    () => new Intl.NumberFormat(lang, { minimumFractionDigits: 0, maximumFractionDigits: 2 }),
    [lang],
  )
  const gel = (tetri: number) => `₾${nf.format(tetri / 100)}`
  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat(lang, { day: "numeric", month: "short", timeZone: "UTC" }),
    [lang],
  )
  const showDate = (iso: string) => dateFmt.format(new Date(`${iso}T00:00:00Z`))

  const loadAvail = () => {
    setAvail({ status: "loading" })
    fetch(`/api/bookings?listingId=${encodeURIComponent(listingId)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(String(r.status))
        setAvail({ status: "ready", data: (await r.json()) as Avail })
      })
      .catch(() => setAvail({ status: "error" }))
  }

  const onOpen = () => {
    setOpen(true)
    setDone(false)
    loadAvail() // fresh calendar on every open — bookings change between views
  }

  const data = avail.status === "ready" ? avail.data : null
  const occupied = useMemo(() => new Set(data?.bookable ? data.nights : []), [data])

  const onPick = (iso: string) => {
    // Second tap completes a range (every night in between free); any gap,
    // earlier date, or a fresh pair restarts the selection from this date.
    if (!checkIn || checkOut || iso <= checkIn || !rangeFree(checkIn, iso, occupied)) {
      if (occupied.has(iso)) return // an occupied night can end a stay, never start one
      setCheckIn(iso)
      setCheckOut("")
      return
    }
    setCheckOut(iso)
  }

  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0
  const s = data?.settings
  const quote =
    data?.bookable && nights > 0 && s
      ? quoteStay({
          nights,
          nightlyTetri: data.nightlyTetri,
          cleaningFeeTetri: s.cleaningFeeTetri,
          securityDepositTetri: s.securityDepositTetri,
          weeklyDiscountPct: s.weeklyDiscountPct,
          monthlyDiscountPct: s.monthlyDiscountPct,
        })
      : null
  const tooShort = Boolean(s && nights > 0 && nights < s.minNights)

  const reset = () => {
    setCheckIn("")
    setCheckOut("")
    setGuests(1)
    setDone(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!checkIn || !checkOut || !name || !phone) {
      toast.error(t("tour.required"))
      return
    }
    setSending(true)
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          checkIn,
          checkOut,
          guestCount: guests,
          guestName: name,
          guestPhone: phone,
          guestEmail: email || undefined,
          guestNotes: notes || undefined,
        }),
      })
      const err = (await res.json().catch(() => null)) as { error?: string } | null
      const code = err?.error
      if (res.ok) {
        setDone(true)
        return
      }
      if (code === "date_unavailable") {
        toast.error(lt(lang, "stayErrUnavailable"))
        loadAvail()
        setCheckIn("")
        setCheckOut("")
        return
      }
      if (code === "stay_length") {
        toast.error(lt(lang, "stayErrLength", { min: s?.minNights ?? 1, max: s?.maxNights ?? 30 }))
        return
      }
      if (code === "currency_unsupported" || code === "booking_disabled") {
        toast.error(lt(lang, "stayClosed"))
        setOpen(false)
        return
      }
      throw new Error(code ?? String(res.status))
    } catch {
      toast.error(t("tour.error"))
    } finally {
      setSending(false)
    }
  }

  const monthIso = (offset: number) => {
    const base = new Date(`${todayIso.slice(0, 7)}-01T00:00:00Z`)
    return new Date(base.getTime() + offset * 32 * DAY).toISOString().slice(0, 8) + "01"
  }

  return (
    <>
      <button
        onClick={onOpen}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-sv-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-glow-blue-sm"
      >
        <CalendarDays className="h-4 w-4" />
        {lt(lang, "stayCta")}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-sv-navy/60 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-card bg-sv-surface p-6 shadow-panel-dark"
            onClick={(e) => e.stopPropagation()}
          >
            {done ? (
              <div className="py-6 text-center">
                <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-sv-blue" aria-hidden />
                <h3 className="font-black text-lg text-sv-ink">{lt(lang, "staySuccess")}</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm font-semibold leading-relaxed text-sv-ink/60">
                  {lt(lang, "staySuccessSub", {
                    dates: `${showDate(checkIn)} → ${showDate(checkOut)}`,
                    nights,
                    guests,
                  })}
                </p>
                <button
                  onClick={() => {
                    setOpen(false)
                    reset()
                  }}
                  className="mt-5 rounded-control bg-sv-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-glow-blue-sm"
                >
                  {t("tour.cancel")}
                </button>
              </div>
            ) : (
              <>
                <h3 className="mb-1 font-black text-lg text-sv-ink">{lt(lang, "stayTitle")}</h3>
                <p className="mb-4 text-sm text-sv-ink/60">{lt(lang, "staySubtitle")}</p>

                {avail.status === "loading" && (
                  <p className="py-8 text-center text-sm font-semibold text-sv-ink/50">{lt(lang, "stayLoading")}</p>
                )}
                {avail.status === "error" && (
                  <div className="py-6 text-center">
                    <p className="mb-3 text-sm font-semibold text-sv-ink/60">{t("tour.error")}</p>
                    <button
                      onClick={loadAvail}
                      className="rounded-control border border-sv-ink/10 px-4 py-2 text-sm font-semibold text-sv-ink/70 hover:bg-sv-cloud"
                    >
                      {t("error.retry")}
                    </button>
                  </div>
                )}
                {data && !data.bookable && (
                  <p className="py-8 text-center text-sm font-semibold text-sv-ink/50">{lt(lang, "stayClosed")}</p>
                )}

                {data?.bookable && s && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center justify-between text-sm font-black text-sv-ink">
                      <span className={checkIn ? "text-sv-blue" : ""}>
                        {lt(lang, "stayCheckIn")}: {checkIn ? showDate(checkIn) : "—"}
                      </span>
                      <span className={checkOut ? "text-sv-blue" : ""}>
                        {lt(lang, "stayCheckOut")}: {checkOut ? showDate(checkOut) : "—"}
                      </span>
                    </div>

                    <div className="rounded-control border border-sv-ink/10 bg-sv-cloud p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <button
                          type="button"
                          aria-label={lt(lang, "stayPrevMonth")}
                          disabled={cursor === 0}
                          onClick={() => setCursor((c) => Math.max(0, c - 1))}
                          className="rounded-full border border-sv-ink/10 bg-sv-surface p-1.5 text-sv-ink/60 disabled:opacity-30"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={lt(lang, "stayNextMonth")}
                          disabled={cursor >= 2}
                          onClick={() => setCursor((c) => Math.min(2, c + 1))}
                          className="rounded-full border border-sv-ink/10 bg-sv-surface p-1.5 text-sv-ink/60 disabled:opacity-30"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <MonthGrid
                          monthIso={monthIso(cursor)}
                          tag={lang}
                          todayIso={todayIso}
                          windowEnd={data.windowEnd}
                          occupied={occupied}
                          checkIn={checkIn}
                          checkOut={checkOut}
                          onPick={onPick}
                        />
                        <div className="hidden sm:block">
                          <MonthGrid
                            monthIso={monthIso(cursor + 1)}
                            tag={lang}
                            todayIso={todayIso}
                            windowEnd={data.windowEnd}
                            occupied={occupied}
                            checkIn={checkIn}
                            checkOut={checkOut}
                            onPick={onPick}
                          />
                        </div>
                      </div>
                      {tooShort && (
                        <p className="mt-2 text-xs font-bold text-sv-orange-deep">{lt(lang, "stayMinNights", { n: s.minNights })}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between rounded-control border border-sv-ink/10 bg-sv-cloud px-4 py-3">
                      <div>
                        <div className="text-sm font-bold text-sv-ink">{lt(lang, "stayGuests")}</div>
                        <div className="text-xs font-semibold text-sv-ink/50">{lt(lang, "stayGuestsCap", { n: s.guestCapacity })}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          aria-label={`${lt(lang, "stayGuests")} −`}
                          disabled={guests <= 1}
                          onClick={() => setGuests((g) => Math.max(1, g - 1))}
                          className="rounded-full border border-sv-ink/15 bg-sv-surface p-1.5 text-sv-ink/70 disabled:opacity-30"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-5 text-center text-sm font-black text-sv-ink">{guests}</span>
                        <button
                          type="button"
                          aria-label={`${lt(lang, "stayGuests")} +`}
                          disabled={guests >= s.guestCapacity}
                          onClick={() => setGuests((g) => Math.min(s.guestCapacity, g + 1))}
                          className="rounded-full border border-sv-ink/15 bg-sv-surface p-1.5 text-sv-ink/70 disabled:opacity-30"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {quote && !tooShort && (
                      <div className="space-y-1.5 rounded-control border border-sv-ink/10 bg-sv-cloud px-4 py-3 text-sm">
                        <div className="flex justify-between font-semibold text-sv-ink/70">
                          <span>
                            {gel(data.nightlyTetri)} × {nights} {lt(lang, "stayNightsWord")}
                          </span>
                          <span>{gel(quote.subtotalTetri)}</span>
                        </div>
                        {quote.discountTetri > 0 && (
                          <div className="flex justify-between font-semibold text-sv-success">
                            <span>{lt(lang, nights >= 28 ? "stayDiscountMonth" : "stayDiscountWeek")}</span>
                            <span>−{gel(quote.discountTetri)}</span>
                          </div>
                        )}
                        {s.cleaningFeeTetri > 0 && (
                          <div className="flex justify-between font-semibold text-sv-ink/70">
                            <span>{lt(lang, "stayCleaning")}</span>
                            <span>{gel(s.cleaningFeeTetri)}</span>
                          </div>
                        )}
                        {s.securityDepositTetri > 0 && (
                          <div className="flex justify-between font-semibold text-sv-ink/70">
                            <span>{lt(lang, "stayDeposit")}</span>
                            <span>{gel(s.securityDepositTetri)}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-sv-ink/10 pt-1.5 font-black text-sv-ink">
                          <span>{lt(lang, "stayTotal")}</span>
                          <span>{gel(quote.totalTetri)}</span>
                        </div>
                        <p className="pt-1 text-xs font-semibold text-sv-ink/50">{lt(lang, "stayNoCharge")}</p>
                      </div>
                    )}

                    {checkIn && checkOut && !tooShort && (
                      <>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="flex items-center gap-2 rounded-control border border-sv-ink/10 bg-sv-cloud px-3 py-2">
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              required
                              placeholder={t("tour.namePh")}
                              aria-label={t("tour.name")}
                              className="w-full bg-transparent text-sm text-sv-ink outline-none"
                            />
                          </div>
                          <div className="flex items-center gap-2 rounded-control border border-sv-ink/10 bg-sv-cloud px-3 py-2">
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              required
                              placeholder={t("tour.phonePh")}
                              aria-label={t("tour.phone")}
                              className="w-full bg-transparent text-sm text-sv-ink outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-control border border-sv-ink/10 bg-sv-cloud px-3 py-2">
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t("tour.emailPh")}
                            aria-label={t("tour.email")}
                            className="w-full bg-transparent text-sm text-sv-ink outline-none"
                          />
                        </div>
                        <div className="flex items-start gap-2 rounded-control border border-sv-ink/10 bg-sv-cloud px-3 py-2">
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            placeholder={t("tour.notesPh")}
                            aria-label={t("tour.notes")}
                            className="w-full bg-transparent text-sm text-sv-ink outline-none resize-none"
                          />
                        </div>
                      </>
                    )}

                    <div className="flex gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="flex-1 rounded-control border border-sv-ink/10 px-4 py-2.5 text-sm font-semibold text-sv-ink/60 transition hover:bg-sv-cloud"
                      >
                        {t("tour.cancel")}
                      </button>
                      <button
                        type="submit"
                        disabled={sending || !quote || tooShort}
                        className="flex-1 rounded-control bg-sv-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-glow-blue-sm disabled:opacity-50"
                      >
                        {sending ? t("tour.sending") : lt(lang, "stayRequest")}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
