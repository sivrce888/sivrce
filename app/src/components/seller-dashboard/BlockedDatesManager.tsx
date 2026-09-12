"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"

import { useI18n } from "@/lib/i18n/context"

/**
 * Host calendar: tap a date to block/unblock it. Writes go straight to
 * /api/listings/[id]/blocked-dates (owner-gated); optimistic UI reverts on
 * failure. ponytail: single month + nav, not a range picker — blocking is a
 * per-date decision. MonthGrid in StayBooker stays guest-range-shaped.
 */

const DAY = 86_400_000
const MONDAY_FIRST = ["2026-06-01", "2026-06-02", "2026-06-03", "2026-06-04", "2026-06-05", "2026-06-06", "2026-06-07"]
const MONTHS_AHEAD = 6

function localTodayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function monthIsoAt(offset: number): string {
  const base = new Date(`${localTodayIso().slice(0, 7)}-01T00:00:00Z`)
  return new Date(base.getTime() + offset * 32 * DAY).toISOString().slice(0, 8) + "01"
}

export function BlockedDatesManager({
  listingId,
  listingTitle,
  initialBlocked,
}: {
  listingId: string
  listingTitle: string
  initialBlocked: string[]
}) {
  const { lang } = useI18n()
  const [blocked, setBlocked] = useState<Set<string>>(() => new Set(initialBlocked))
  const [cursor, setCursor] = useState(0)
  const todayIso = localTodayIso()

  const monthIso = monthIsoAt(cursor)
  const labelFmt = useMemo(
    () => new Intl.DateTimeFormat(lang, { month: "long", year: "numeric", timeZone: "UTC" }),
    [lang],
  )
  const dowFmt = useMemo(
    () => new Intl.DateTimeFormat(lang, { weekday: "narrow", timeZone: "UTC" }),
    [lang],
  )

  const y = Number(monthIso.slice(0, 4))
  const m = Number(monthIso.slice(5, 7))
  const first = new Date(Date.UTC(y, m - 1, 1))
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const lead = (first.getUTCDay() + 6) % 7
  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      new Date(Date.UTC(y, m - 1, i + 1)).toISOString().slice(0, 10),
    ),
  ]

  const toggle = async (iso: string) => {
    const wasBlocked = blocked.has(iso)
    const next = new Set(blocked)
    if (wasBlocked) next.delete(iso)
    else next.add(iso)
    setBlocked(next)
    try {
      const res = await fetch(`/api/listings/${encodeURIComponent(listingId)}/blocked-dates`, {
        method: wasBlocked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dates: [iso], reason: "host" }),
      })
      if (!res.ok) throw new Error(String(res.status))
    } catch {
      setBlocked(blocked) // revert
      toast.error("ვერ შეიცვლა — სცადე თავიდან")
    }
  }

  return (
    <div className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-4 shadow-card">
      <div className="mb-2 truncate text-[13px] font-extrabold text-sv-ink">{listingTitle}</div>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          aria-label="წინა თვე"
          disabled={cursor === 0}
          onClick={() => setCursor((c) => Math.max(0, c - 1))}
          className="rounded-full border border-sv-ink/10 bg-sv-cloud p-1.5 text-sv-ink/60 disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-[13px] font-black text-sv-ink">{labelFmt.format(first)}</span>
        <button
          type="button"
          aria-label="შემდეგი თვე"
          disabled={cursor >= MONTHS_AHEAD - 1}
          onClick={() => setCursor((c) => Math.min(MONTHS_AHEAD - 1, c + 1))}
          className="rounded-full border border-sv-ink/10 bg-sv-cloud p-1.5 text-sv-ink/60 disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {MONDAY_FIRST.map((d) => (
          <div key={d} className="text-center text-[11px] font-bold text-sv-ink/40" aria-hidden>
            {dowFmt.format(new Date(`${d}T00:00:00Z`))}
          </div>
        ))}
        {cells.map((iso, i) => {
          if (!iso) return <div key={`b${i}`} />
          const isPast = iso < todayIso
          const isBlocked = blocked.has(iso)
          return (
            <button
              key={iso}
              type="button"
              disabled={isPast}
              aria-pressed={isBlocked}
              onClick={() => toggle(iso)}
              className={[
                "mx-auto flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold transition",
                isPast ? "cursor-not-allowed text-sv-ink/20" : "",
                !isPast && isBlocked ? "bg-sv-orange text-white" : "",
                !isPast && !isBlocked ? "text-sv-ink hover:bg-sv-blue/10" : "",
              ].join(" ")}
            >
              {Number(iso.slice(8, 10))}
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-[11.5px] font-semibold text-sv-ink/45">
        დაბლოკილი ღამები: {blocked.size}
      </p>
    </div>
  )
}
