'use client'

/**
 * SIVRCE — live departures island for Berlin U/S-Bahn station pages.
 * Server shell stays static (ISR); this island fetches /api/departures
 * (CDN-cached 45 s) on mount, refreshes every 60 s while the tab is visible
 * and pauses when hidden. Zero dependencies, ~1 KB, renders nothing when the
 * upstream is down before first load — a dead board must never bloat a page.
 */

import { useEffect, useState } from 'react'
import { TrainFront, TriangleAlert } from 'lucide-react'

type Row = {
  line: string
  bg: string
  fg: string
  dir: string
  when: string
  planned: string
  cancelled: boolean
  platform?: string
  note?: string
}

const clock = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' })
const clockSec = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Berlin' })
const wall = (iso: string) => clock.format(new Date(iso))

export default function LiveDepartures({ stopId, name }: { stopId: string; name: string }) {
  const [rows, setRows] = useState<Row[] | null>(null) // null = loading
  const [stale, setStale] = useState(false)
  const [now, setNow] = useState(0)

  useEffect(() => {
    let dead = false
    const load = async () => {
      try {
        const r = await fetch(`/api/departures?stop=${stopId}`)
        if (!r.ok) throw new Error(String(r.status))
        const d = (await r.json()) as { departures?: Row[] }
        if (dead) return
        setRows(Array.isArray(d.departures) ? d.departures : [])
        setStale(false)
        setNow(Date.now())
      } catch {
        if (!dead) setStale(true)
      }
    }
    load()
    const poll = setInterval(() => {
      if (document.visibilityState === 'visible') load()
    }, 60_000)
    const tick = setInterval(() => {
      if (document.visibilityState === 'visible') setNow(Date.now())
    }, 20_000)
    const wake = () => {
      if (document.visibilityState === 'visible') load()
    }
    document.addEventListener('visibilitychange', wake)
    return () => {
      dead = true
      clearInterval(poll)
      clearInterval(tick)
      document.removeEventListener('visibilitychange', wake)
    }
  }, [stopId])

  // Upstream down before first load → the board never appeared; keep the page clean.
  if (stale && rows === null) return null

  const hms = () => clockSec.format(new Date())

  return (
    <section aria-labelledby="dep-h" className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card md:p-6">
      <div className="mb-3 flex items-center gap-2.5">
        <span aria-hidden className="grid h-9 w-9 place-items-center rounded-control bg-sv-blue/10">
          <TrainFront className="h-4 w-4 text-sv-blue" />
        </span>
        <h2 id="dep-h" className="text-[17px] font-black tracking-tight text-sv-ink">
          Nächste Abfahrten · <span className="text-sv-blue">live</span>
        </h2>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] font-bold text-sv-ink/45">
          <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${stale ? 'bg-sv-ink/25' : 'animate-pulse bg-sv-success'}`} />
          {name}
        </span>
      </div>

      {rows === null ? (
        <div aria-hidden className="grid gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[46px] animate-pulse rounded-module bg-sv-ink/[0.04]" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="py-2 text-[14px] font-semibold text-sv-ink/55">
          Derzeit keine Abfahrten in den nächsten 90 Minuten.
        </p>
      ) : (
        <ul className="grid gap-0.5">
          {rows.map((d, i) => {
            const mins = Math.round((Date.parse(d.when) - now) / 60_000)
            const late = Math.round((Date.parse(d.when) - Date.parse(d.planned)) / 60_000)
            return (
              <li
                key={`${d.line}-${d.when}-${i}`}
                className={`flex items-center gap-3 rounded-module px-3 py-2 transition-colors hover:bg-sv-cloud ${d.cancelled ? 'opacity-50' : ''}`}
              >
                <span
                  aria-hidden
                  className="min-w-[44px] shrink-0 rounded-[6px] px-2 py-1 text-center text-[12px] font-black leading-5"
                  style={{ background: d.bg, color: d.fg }}
                >
                  {d.line}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-[14px] font-extrabold text-sv-ink ${d.cancelled ? 'line-through' : ''}`}>
                    {d.dir}
                  </span>
                  {d.note && !d.cancelled && (
                    <span className="mt-0.5 flex items-center gap-1 truncate text-[11px] font-bold text-sv-orange-deep">
                      <TriangleAlert className="h-3 w-3 shrink-0" aria-hidden />
                      {d.note}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-right">
                  {d.cancelled ? (
                    <span className="text-[12px] font-black text-sv-orange-deep">Entfällt</span>
                  ) : (
                    <>
                      <span className="block text-[15px] font-black tabular-nums text-sv-ink">
                        {mins < 1 ? 'jetzt' : `${mins} Min.`}
                      </span>
                      <span className="block text-[11px] font-bold tabular-nums text-sv-ink/45">
                        {wall(d.when)} Uhr{Math.abs(late) >= 1 ? ` · ${late > 0 ? '+' : '−'}${Math.abs(late)}` : ''}
                      </span>
                    </>
                  )}
                  {d.platform && (
                    <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wide text-sv-ink/40">
                      Gleis {d.platform}
                    </span>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      <p className="mt-3 flex items-center justify-between border-t border-sv-ink/[0.05] pt-2.5 text-[10px] font-bold uppercase tracking-wide text-sv-ink/35">
        <span>{stale ? 'Aktualisierung …' : `Stand ${hms()} Uhr`}</span>
        <span>Daten: VBB / BVG</span>
      </p>
      <p aria-live="polite" className="sr-only">
        {rows && rows.length > 0
          ? `Nächste Abfahrt: Linie ${rows[0].line} Richtung ${rows[0].dir} um ${wall(rows[0].when)} Uhr.`
          : 'Keine Abfahrten in den nächsten 90 Minuten.'}
      </p>
    </section>
  )
}
