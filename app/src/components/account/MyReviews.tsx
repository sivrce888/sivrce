'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { LogIn, Star } from 'lucide-react'
import { getListing } from '@/data/listings'
import { useI18n } from '@/lib/i18n/context'
import SectionHeader from './SectionHeader'
import { useAccountStrings, type AccountStringKey } from './i18n'

interface MyReview {
  id: string
  rating: number
  title?: string
  body: string
  createdAt: string
  // ponytail: the landed /api/reviews toDto omits targetType/targetId — the
  // target column renders only when the API starts sending them.
  targetType?: string
  targetId?: string
}

type State =
  | { status: 'loading' }
  | { status: 'anon' }
  | { status: 'error' }
  | { status: 'ready'; reviews: MyReview[] }

function isMyReview(x: unknown): x is MyReview {
  if (typeof x !== 'object' || x === null) return false
  const r = x as Record<string, unknown>
  return (
    typeof r.id === 'string' &&
    typeof r.rating === 'number' &&
    typeof r.body === 'string' &&
    typeof r.createdAt === 'string' &&
    (r.targetType === undefined || typeof r.targetType === 'string') &&
    (r.targetId === undefined || typeof r.targetId === 'string')
  )
}

const TARGET_KEYS: Record<string, AccountStringKey> = {
  listing: 'targetListing',
  project: 'targetProject',
  developer: 'targetDeveloper',
  agent: 'targetAgent',
  neighborhood: 'targetNeighborhood',
  account: 'targetAccount',
}

function Stars({ rating }: { rating: number }) {
  const n = Math.max(0, Math.min(5, Math.round(rating)))
  return (
    <span className="flex items-center gap-0.5" aria-label={`${n}/5`} role="img">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < n ? 'fill-current text-sv-orange' : 'text-sv-ink/20'}`}
          aria-hidden="true"
        />
      ))}
    </span>
  )
}

export default function MyReviews({ signedIn }: { signedIn: boolean }) {
  const tt = useAccountStrings()
  const { lang } = useI18n()
  const [attempt, setAttempt] = useState(0)
  // ponytail: signedIn comes from the server render and is stable for the
  // page's lifetime, so the anon branch never needs a runtime reset.
  const [state, setState] = useState<State>(signedIn ? { status: 'loading' } : { status: 'anon' })

  useEffect(() => {
    if (!signedIn) return
    let cancelled = false
    fetch('/api/reviews?mine=1', { credentials: 'same-origin' })
      .then(async (res): Promise<State> => {
        if (res.status === 401) return { status: 'anon' }
        if (!res.ok) return { status: 'error' }
        const data: unknown = await res.json()
        const raw = typeof data === 'object' && data !== null ? (data as Record<string, unknown>).reviews : null
        return { status: 'ready', reviews: Array.isArray(raw) ? raw.filter(isMyReview) : [] }
      })
      .catch((): State => ({ status: 'error' }))
      .then((s) => {
        if (!cancelled) setState(s)
      })
    return () => {
      cancelled = true
    }
  }, [signedIn, attempt])

  return (
    <section aria-label={tt('myReviews')} className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card">
      <SectionHeader
        icon={Star}
        title={tt('myReviews')}
        count={state.status === 'ready' ? state.reviews.length : undefined}
        chipClass="bg-sv-orange/10 text-sv-orange"
      />

      {state.status === 'loading' && (
        <div className="space-y-3" role="status" aria-label={tt('loading')}>
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-module bg-sv-ink/[0.05]" />
          ))}
        </div>
      )}

      {state.status === 'anon' && (
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-[14px] font-semibold text-sv-ink/50">{tt('reviewsSignIn')}</p>
          <button
            onClick={() => signIn('google')}
            className="flex h-11 items-center gap-2 rounded-full bg-sv-orange px-5 text-[13px] font-extrabold text-white shadow-glow-orange transition-all hover:-translate-y-0.5 hover:shadow-glow-orange-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            {tt('signIn')}
          </button>
        </div>
      )}

      {state.status === 'error' && (
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-[14px] font-semibold text-sv-ink/50">{tt('reviewsError')}</p>
          <button
            onClick={() => {
              setState({ status: 'loading' })
              setAttempt((a) => a + 1)
            }}
            className="flex h-11 items-center rounded-full border border-sv-ink/10 px-5 text-[13px] font-extrabold text-sv-ink transition-colors hover:border-sv-blue/50 hover:text-sv-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue/30"
          >
            {tt('retry')}
          </button>
        </div>
      )}

      {state.status === 'ready' &&
        (state.reviews.length === 0 ? (
          <p className="text-[14px] font-semibold text-sv-ink/50">{tt('noReviews')}</p>
        ) : (
          <ul className="divide-y divide-sv-ink/[0.06]">
            {state.reviews.map((r) => {
              // Target column only when the API sends targetType/targetId
              const hasTarget = typeof r.targetType === 'string' && typeof r.targetId === 'string'
              const listing = hasTarget && r.targetType === 'listing' ? getListing(r.targetId ?? '') : undefined
              const targetLabel = listing?.title ?? (hasTarget ? tt(TARGET_KEYS[r.targetType ?? ''] ?? 'targetListing') : null)
              return (
                <li key={r.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                    {hasTarget && targetLabel ? (
                      r.targetType === 'listing' ? (
                        <Link
                          href={`/listing/${r.targetId ?? ''}`}
                          className="rounded-sm font-extrabold text-sv-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue/30"
                        >
                          {targetLabel}
                        </Link>
                      ) : (
                        <span className="font-extrabold text-sv-ink">{targetLabel}</span>
                      )
                    ) : null}
                    <Stars rating={r.rating} />
                    <time className="ml-auto text-[12px] font-semibold text-sv-ink/40" dateTime={r.createdAt}>
                      {new Date(r.createdAt).toLocaleDateString(lang)}
                    </time>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[13px] font-semibold leading-relaxed text-sv-ink/65">
                    {r.title ? <span className="font-black text-sv-ink">{r.title} — </span> : null}
                    {r.body}
                  </p>
                </li>
              )
            })}
          </ul>
        ))}
    </section>
  )
}
