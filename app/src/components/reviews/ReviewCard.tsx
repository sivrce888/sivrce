'use client'

import { useState } from 'react'
import { BadgeCheck, ThumbsUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RatingStars } from './RatingStars'
import type { ReviewStrings } from './i18n'
import type { ReviewItem, ReviewOwnerReply } from './types'

interface ReviewCardProps {
  review: ReviewItem
  strings: ReviewStrings
  /** BCP-47 locale for Intl date formatting. */
  locale: string
  className?: string
}

export function ReviewCard({ review: r, strings: s, locale, className }: ReviewCardProps) {
  const [helpfulCount, setHelpfulCount] = useState(r.helpfulCount)
  const [voted, setVoted] = useState(false)
  const [pending, setPending] = useState(false)

  // ponytail: API ownerReply shape isn't pinned down — accept string or object
  const reply: ReviewOwnerReply | null =
    typeof r.ownerReply === 'string' ? { body: r.ownerReply } : (r.ownerReply ?? null)

  const date = new Date(r.createdAt)
  const dateText = Number.isNaN(date.getTime())
    ? ''
    : new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(date)

  async function markHelpful() {
    if (voted || pending) return
    setVoted(true)
    setPending(true)
    setHelpfulCount((c) => c + 1)
    try {
      const res = await fetch(`/api/reviews/${encodeURIComponent(r.id)}/helpful`, { method: 'POST' })
      if (!res.ok) throw new Error(String(res.status))
      const data: unknown = await res.json().catch(() => null)
      if (data && typeof data === 'object' && 'helpfulCount' in data) {
        const n = (data as { helpfulCount: unknown }).helpfulCount
        if (typeof n === 'number') setHelpfulCount(n)
      }
    } catch {
      setVoted(false)
      setHelpfulCount((c) => c - 1)
    } finally {
      setPending(false)
    }
  }

  return (
    <article className={cn('rounded-card border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card md:p-6', className)}>
      <header className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sv-orange/10 text-[16px] font-black text-sv-orange"
        >
          {r.authorName.trim().charAt(0).toUpperCase() || '?'}
        </span>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-1.5 text-[15px] font-extrabold text-sv-ink">
            <span className="truncate">{r.authorName}</span>
            {r.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sv-blue/10 px-2 py-0.5 text-[11px] font-extrabold text-sv-blue">
                <BadgeCheck aria-hidden className="h-3.5 w-3.5" />
                {s.verified}
              </span>
            )}
          </p>
          {dateText && (
            <time dateTime={r.createdAt} className="mt-0.5 block text-[13px] font-semibold text-sv-ink/50">
              {dateText}
            </time>
          )}
        </div>
        <RatingStars value={r.rating} size="sm" label={s.starsReadOnly(r.rating)} className="ms-auto mt-1 shrink-0" />
      </header>

      {r.title && <h3 className="mt-3 text-[16px] font-extrabold text-sv-ink">{r.title}</h3>}
      <p className="mt-2 whitespace-pre-line text-[15px] font-medium leading-relaxed text-sv-ink/70">{r.body}</p>

      <div className="mt-4">
        <button
          type="button"
          onClick={markHelpful}
          disabled={voted || pending}
          aria-pressed={voted}
          aria-label={`${s.helpful} (${helpfulCount})`}
          className={cn(
            'flex min-h-[44px] items-center gap-2 rounded-full border px-4 text-[13px] font-bold transition-colors duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed',
            voted
              ? 'border-sv-orange/40 bg-sv-orange/10 text-sv-orange'
              : 'border-sv-ink/10 text-sv-ink/65 hover:border-sv-orange/40 hover:text-sv-orange',
          )}
        >
          <ThumbsUp aria-hidden className="h-4 w-4" />
          {s.helpful}
          <span className="text-sv-ink/45">({helpfulCount})</span>
        </button>
      </div>

      {reply && (
        <div className="mt-4 rounded-module border-s-2 border-sv-orange bg-sv-cloud p-4">
          <p className="text-[12px] font-extrabold uppercase tracking-wide text-sv-ink/55">{s.ownerResponse}</p>
          <p className="mt-1.5 whitespace-pre-line text-[14px] font-medium leading-relaxed text-sv-ink/75">{reply.body}</p>
        </div>
      )}
    </article>
  )
}
