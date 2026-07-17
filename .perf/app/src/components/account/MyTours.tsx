'use client'

import { useEffect, useState } from 'react'
import { CalendarCheck } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import SectionHeader from './SectionHeader'
import { useAccountStrings, type AccountStringKey } from './i18n'

interface MyTour {
  id: string
  tourDate: string
  tourTime: string
  status: 'pending' | 'confirmed' | 'cancelled_by_guest' | 'cancelled_by_agent' | 'completed' | 'no_show'
  listing: { title: string } | null
  agent: { name: string } | null
}

type State =
  | { status: 'loading' }
  | { status: 'anon' }
  | { status: 'error' }
  | { status: 'ready'; tours: MyTour[] }

function isMyTour(x: unknown): x is MyTour {
  if (typeof x !== 'object' || x === null) return false
  const r = x as Record<string, unknown>
  return typeof r.id === 'string' && typeof r.tourDate === 'string' && typeof r.tourTime === 'string'
}

const STATUS_KEY: Record<MyTour['status'], AccountStringKey> = {
  pending: 'tourPending',
  confirmed: 'tourConfirmed',
  cancelled_by_guest: 'tourCancelled',
  cancelled_by_agent: 'tourCancelled',
  completed: 'tourCompleted',
  no_show: 'tourCancelled',
}

const STATUS_CLASS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-sv-ink/[0.06] text-sv-ink/55',
  completed: 'bg-sv-blue/10 text-sv-blue',
}

/** Buyer's booked tours (GET /api/tours). Anon visitors get null — ProfileCard owns the sign-in CTA. */
export default function MyTours() {
  const { lang } = useI18n()
  const s = useAccountStrings()
  const [state, setState] = useState<State>({ status: 'loading' })

  const load = () => {
    fetch('/api/tours')
      .then(async (r) => {
        if (r.status === 401) return setState({ status: 'anon' })
        if (!r.ok) throw new Error(String(r.status))
        const data = (await r.json()) as { tours?: unknown }
        const tours = Array.isArray(data.tours) ? data.tours.filter(isMyTour) : []
        setState({ status: 'ready', tours })
      })
      .catch(() => setState({ status: 'error' }))
  }

  const retry = () => {
    setState({ status: 'loading' })
    load()
  }

  useEffect(load, [])

  if (state.status === 'anon') return null

  const fmt = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', weekday: 'short' })

  return (
    <section className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card">
      <SectionHeader
        icon={CalendarCheck}
        title={s('myTours')}
        count={state.status === 'ready' ? state.tours.length : undefined}
        chipClass="bg-sv-blue/10 text-sv-blue"
      />
      {state.status === 'loading' && <p className="text-[14px] font-semibold text-sv-ink/45">{s('loading')}</p>}
      {state.status === 'error' && (
        <div className="flex items-center gap-3">
          <p className="text-[14px] font-semibold text-sv-ink/45">{s('toursError')}</p>
          <button onClick={retry} className="text-[13px] font-extrabold text-sv-blue hover:underline">
            {s('retry')}
          </button>
        </div>
      )}
      {state.status === 'ready' && state.tours.length === 0 && (
        <p className="text-[14px] font-semibold text-sv-ink/45">{s('noTours')}</p>
      )}
      {state.status === 'ready' && state.tours.length > 0 && (
        <ul className="divide-y divide-sv-ink/[0.06]">
          {state.tours.map((tour) => {
            const cancelled = tour.status.startsWith('cancelled') || tour.status === 'no_show'
            const pill = cancelled ? STATUS_CLASS.cancelled : (STATUS_CLASS[tour.status] ?? STATUS_CLASS.pending)
            return (
              <li key={tour.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  {/* ponytail: plain text, no link — public /listing/[id] is static-catalog until plan #2. */}
                  <p className="truncate text-[14px] font-extrabold text-sv-ink">{tour.listing?.title ?? '—'}</p>
                  <p className="mt-0.5 text-[12px] font-semibold text-sv-ink/50">
                    {fmt.format(new Date(tour.tourDate))} · {tour.tourTime}
                    {tour.agent?.name ? ` · ${tour.agent.name}` : ''}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${pill}`}>
                  {s(STATUS_KEY[tour.status] ?? 'tourPending')}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
