'use client'

import { useEffect, useState } from 'react'
import { MessageSquareText } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import SectionHeader from './SectionHeader'
import { useAccountStrings } from './i18n'

interface MyInquiry {
  id: string
  listingTitle: string | null
  agentName: string
  message: string
  status: string
  createdAt: string
}

type State =
  | { status: 'loading' }
  | { status: 'anon' }
  | { status: 'error' }
  | { status: 'ready'; inquiries: MyInquiry[] }

function isMyInquiry(x: unknown): x is MyInquiry {
  if (typeof x !== 'object' || x === null) return false
  const r = x as Record<string, unknown>
  return (
    typeof r.id === 'string' &&
    typeof r.agentName === 'string' &&
    typeof r.message === 'string' &&
    typeof r.createdAt === 'string' &&
    (r.listingTitle === null || typeof r.listingTitle === 'string')
  )
}

/** Buyer's sent inquiries (GET /api/inquiries). Anon visitors get null — ProfileCard owns the sign-in CTA. */
export default function MyInquiries() {
  const { lang } = useI18n()
  const s = useAccountStrings()
  const [state, setState] = useState<State>({ status: 'loading' })

  const load = () => {
    fetch('/api/inquiries')
      .then(async (r) => {
        if (r.status === 401) return setState({ status: 'anon' })
        if (!r.ok) throw new Error(String(r.status))
        const data = (await r.json()) as { inquiries?: unknown }
        const inquiries = Array.isArray(data.inquiries) ? data.inquiries.filter(isMyInquiry) : []
        setState({ status: 'ready', inquiries })
      })
      .catch(() => setState({ status: 'error' }))
  }

  const retry = () => {
    setState({ status: 'loading' })
    load()
  }

  useEffect(load, [])

  if (state.status === 'anon') return null

  const fmt = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long' })

  return (
    <section className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card">
      <SectionHeader
        icon={MessageSquareText}
        title={s('myInquiries')}
        count={state.status === 'ready' ? state.inquiries.length : undefined}
        chipClass="bg-sv-orange/10 text-sv-orange"
      />
      {state.status === 'loading' && <p className="text-[14px] font-semibold text-sv-ink/45">{s('loading')}</p>}
      {state.status === 'error' && (
        <div className="flex items-center gap-3">
          <p className="text-[14px] font-semibold text-sv-ink/45">{s('inquiriesError')}</p>
          <button onClick={retry} className="text-[13px] font-extrabold text-sv-blue hover:underline">
            {s('retry')}
          </button>
        </div>
      )}
      {state.status === 'ready' && state.inquiries.length === 0 && (
        <p className="text-[14px] font-semibold text-sv-ink/45">{s('noInquiries')}</p>
      )}
      {state.status === 'ready' && state.inquiries.length > 0 && (
        <ul className="divide-y divide-sv-ink/[0.06]">
          {state.inquiries.map((inq) => (
            <li key={inq.id} className="py-3">
              {/* ponytail: plain text, no link — inquiry rows predate the db catalog ids. */}
              <p className="truncate text-[14px] font-extrabold text-sv-ink">
                {inq.listingTitle ?? s('inquiryGeneral')}
              </p>
              <p className="mt-0.5 text-[12px] font-semibold text-sv-ink/50">
                {fmt.format(new Date(inq.createdAt))} · {inq.agentName}
              </p>
              <p className="mt-1 line-clamp-2 text-[13px] font-medium leading-snug text-sv-ink/60">
                {inq.message}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
