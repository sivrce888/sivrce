'use client'

import { useId, useState, type FormEvent } from 'react'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { RatingStars } from './RatingStars'
import type { ReviewStrings } from './i18n'
import type { ReviewItem } from './types'
// Type-only import — erased at compile time, so no runtime cycle with ReviewsSection.
import type { ReviewTargetType } from './ReviewsSection'

const MIN_BODY = 10

export interface ReviewFormProps {
  targetType: ReviewTargetType
  targetId: string
  strings: ReviewStrings
  /** BCP-47 locale tag sent as `locale` in the POST body. */
  locale: string
  onSubmitted?: (review: ReviewItem) => void
  className?: string
}

export function ReviewForm({ targetType, targetId, strings: s, locale, onSubmitted, className }: ReviewFormProps) {
  const { data: session } = useSession()
  const baseId = useId()
  const [rating, setRating] = useState(0)
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Prefill the name once the session resolves; never overwrite what the user
  // typed. State adjusted during render — no setState in effect bodies.
  const sessionName = session?.user?.name ?? ''
  const [prefilledFor, setPrefilledFor] = useState('')
  if (sessionName && prefilledFor !== sessionName) {
    setPrefilledFor(sessionName)
    setName((prev) => (prev ? prev : sessionName))
  }

  const bodyLen = body.trim().length

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (rating < 1) {
      setError(s.errorRating)
      return
    }
    if (bodyLen < MIN_BODY) {
      setError(s.errorBody(MIN_BODY))
      return
    }
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = { targetType, targetId, rating, body: body.trim(), locale }
      const t = title.trim()
      if (t) payload.title = t
      const n = name.trim()
      if (n) payload.authorName = n

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data: unknown = await res.json().catch(() => null)
      if (!res.ok) throw new Error(String(res.status))

      // ponytail: POST response shape isn't pinned — accept {review} or bare review,
      // else fall back to a local optimistic copy; next fetch reconciles.
      const fromApi =
        data && typeof data === 'object'
          ? 'review' in data
            ? ((data as { review: ReviewItem }).review ?? null)
            : (data as ReviewItem)
          : null
      const created: ReviewItem =
        fromApi && typeof fromApi.id === 'string'
          ? fromApi
          : {
              id: `optimistic-${Date.now()}`,
              authorName: n || s.anonymous,
              rating,
              body: body.trim(),
              verified: false,
              helpfulCount: 0,
              createdAt: new Date().toISOString(),
              ...(t ? { title: t } : {}),
            }

      onSubmitted?.(created)
      setRating(0)
      setTitle('')
      setBody('')
    } catch {
      setError(s.errorGeneric)
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls =
    'mt-1.5 h-11 w-full rounded-control border border-sv-ink/10 bg-sv-surface px-4 text-[15px] font-medium text-sv-ink placeholder:text-sv-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue'

  return (
    <form
      onSubmit={submit}
      noValidate
      className={cn('rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card', className)}
    >
      <h3 className="text-[18px] font-extrabold text-sv-ink">{s.formTitle}</h3>

      <div className="mt-4">
        <span id={`${baseId}-rating`} className="text-[13px] font-bold text-sv-ink/70">
          {s.yourRating}
        </span>
        <RatingStars
          interactive
          size="lg"
          value={rating}
          onChange={setRating}
          label={s.yourRating}
          optionLabel={s.starOption}
          className="-ms-2.5 mt-0.5"
        />
      </div>

      <div className="mt-3">
        <label htmlFor={`${baseId}-name`} className="text-[13px] font-bold text-sv-ink/70">
          {s.nameLabel}
          {session && <span className="ms-1.5 font-semibold text-sv-ink/45">· {s.optionalTag}</span>}
        </label>
        <input
          id={`${baseId}-name`}
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={s.namePlaceholder}
          maxLength={80}
          className={inputCls}
        />
      </div>

      <div className="mt-3">
        <label htmlFor={`${baseId}-title`} className="text-[13px] font-bold text-sv-ink/70">
          {s.titleLabel}
          <span className="ms-1.5 font-semibold text-sv-ink/45">· {s.optionalTag}</span>
        </label>
        <input
          id={`${baseId}-title`}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={s.titlePlaceholder}
          maxLength={120}
          className={inputCls}
        />
      </div>

      <div className="mt-3">
        <label htmlFor={`${baseId}-body`} className="text-[13px] font-bold text-sv-ink/70">
          {s.bodyLabel}
        </label>
        <textarea
          id={`${baseId}-body`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={s.bodyPlaceholder}
          rows={4}
          maxLength={4000}
          aria-describedby={`${baseId}-hint`}
          className={cn(inputCls, 'h-auto resize-y py-3 leading-relaxed')}
        />
        <p
          id={`${baseId}-hint`}
          className={cn('mt-1 text-[12px] font-semibold', bodyLen >= MIN_BODY ? 'text-sv-ink/40' : 'text-sv-orange')}
        >
          {s.minChars(bodyLen, MIN_BODY)}
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-control bg-red-50 px-4 py-3 text-[13px] font-bold text-red-600 dark:bg-red-950/40 dark:text-red-400"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-full bg-sv-orange px-6 text-[15px] font-extrabold text-white shadow-glow-orange transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-orange-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:hover:translate-y-0"
      >
        {submitting ? s.submitting : s.submit}
      </button>
    </form>
  )
}
