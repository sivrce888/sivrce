'use client'

/**
 * Owner dashboard panel: published reviews about the caller's own profiles
 * and listings, with an inline reply box (writes ownerReply via the API).
 */
import { useEffect, useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import UserAvatar from '@/components/UserAvatar'
import { RatingStars } from './RatingStars'
import { getReviewStrings, type ReviewStrings } from './i18n'
import type { ReviewItem } from './types'

function isReview(x: unknown): x is ReviewItem {
  if (typeof x !== 'object' || x === null) return false
  const r = x as Record<string, unknown>
  return (
    typeof r.id === 'string' &&
    typeof r.authorName === 'string' &&
    typeof r.rating === 'number' &&
    typeof r.body === 'string' &&
    typeof r.createdAt === 'string'
  )
}

const inputCls =
  'mt-2 w-full rounded-control border border-sv-ink/10 bg-sv-surface px-3 py-2 text-[14px] font-medium text-sv-ink placeholder:text-sv-ink/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue'

function ReplyRow({ review: r, s }: { review: ReviewItem; s: ReviewStrings }) {
  const [value, setValue] = useState(
    typeof r.ownerReply === 'string' ? r.ownerReply : (r.ownerReply?.body ?? ''),
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(false)

  async function send() {
    if (saving || value.trim().length < 2) return
    setSaving(true)
    setError(false)
    try {
      const res = await fetch(`/api/reviews/${encodeURIComponent(r.id)}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: value.trim() }),
      })
      if (!res.ok) throw new Error(String(res.status))
      setSaved(true)
    } catch {
      setError(true)
      setSaved(false)
    } finally {
      setSaving(false)
    }
  }

  const date = new Date(r.createdAt)
  const dateText = Number.isNaN(date.getTime())
    ? ''
    : new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'long', year: 'numeric' }).format(date)

  return (
    <article className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card">
      <header className="flex items-start gap-3">
        <UserAvatar name={r.authorName} size={40} />
        <div className="min-w-0">
          <p className="truncate text-[14px] font-extrabold text-sv-ink">{r.authorName}</p>
          {dateText && (
            <time dateTime={r.createdAt} className="text-[12px] font-semibold text-sv-ink/60">
              {dateText}
            </time>
          )}
        </div>
        <RatingStars value={r.rating} size="sm" label={s.starsReadOnly(r.rating)} className="ms-auto shrink-0" />
      </header>
      <p className="mt-2.5 whitespace-pre-line text-[14px] font-medium leading-relaxed text-sv-ink/70">{r.body}</p>

      <div className="mt-3 border-t border-sv-ink/[0.06] pt-3">
        <label className="flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-wide text-sv-ink/60">
          <MessageSquare aria-hidden className="h-3.5 w-3.5" />
          {s.ownerResponse}
        </label>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={s.replyPlaceholder}
          rows={2}
          maxLength={1000}
          aria-label={s.replyCta}
          className={inputCls}
        />
        {error && (
          <p role="alert" className="mt-1 text-[12px] font-bold text-red-600 dark:text-red-400">
            {s.replyError}
          </p>
        )}
        <div className="mt-2 flex items-center justify-end gap-3">
          {saved && !error && (
            <span role="status" className="text-[12px] font-semibold text-sv-ink/60">
              {s.replySaved}
            </span>
          )}
          <button
            type="button"
            onClick={send}
            disabled={saving || value.trim().length < 2}
            className={cn(
              'min-h-[40px] rounded-full bg-sv-orange px-5 text-[13px] font-extrabold text-sv-ink transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0',
            )}
          >
            {saving ? s.replySaving : s.replySave}
          </button>
        </div>
      </div>
    </article>
  )
}

type State =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error' }
  | { status: 'ready'; reviews: ReviewItem[] }

export default function OwnerReviews({ className }: { className?: string }) {
  const { lang } = useI18n()
  const s = getReviewStrings(lang)
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    fetch('/api/reviews?about=1', { credentials: 'same-origin' })
      .then(async (res) => {
        if (res.status === 401) return { status: 'empty' as const }
        if (!res.ok) throw new Error(String(res.status))
        const data: unknown = await res.json()
        const raw = typeof data === 'object' && data !== null ? (data as Record<string, unknown>).reviews : null
        const reviews = Array.isArray(raw) ? raw.filter(isReview) : []
        return { status: 'ready' as const, reviews }
      })
      .then((v) => {
        if (!cancelled) setState(v.status === 'ready' && v.reviews.length === 0 ? { status: 'empty' } : v)
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [])

  // No reviews about this owner (or not an owner) — the panel stays quiet.
  if (state.status === 'loading' || state.status === 'empty') return null

  if (state.status === 'error') {
    return (
      <section aria-label={s.aboutYou} className={cn('rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card', className)}>
        <h2 className="text-[18px] font-extrabold text-sv-ink">{s.aboutYou}</h2>
        <p className="mt-2 text-[14px] font-semibold text-sv-ink/60">{s.loadError}</p>
      </section>
    )
  }

  return (
    <section aria-label={s.aboutYou} className={cn('rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card', className)}>
      <h2 className="flex items-center gap-2 text-[18px] font-extrabold text-sv-ink">
        {s.aboutYou}
        <span className="rounded-full bg-sv-orange/10 px-2.5 py-0.5 text-[12px] font-extrabold text-sv-orange">
          {state.reviews.length}
        </span>
      </h2>
      <div className="mt-4 space-y-4">
        {state.reviews.map((r) => (
          <ReplyRow key={r.id} review={r} s={s} />
        ))}
      </div>
    </section>
  )
}
