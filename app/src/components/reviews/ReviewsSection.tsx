/**
 * CONTRACT — implemented by the Reviews_UI worker; consumed by listing,
 * project, developer, agent, neighborhood and account pages.
 * Do NOT change the exported signature — internals only.
 */
'use client'

import { useCallback, useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { RatingStars } from './RatingStars'
import { ReviewCard } from './ReviewCard'
import { ReviewForm } from './ReviewForm'
import { getReviewStrings } from './i18n'
import type { ReviewItem, ReviewsResponse, ReviewSort } from './types'

export type ReviewTargetType =
  | 'listing'
  | 'project'
  | 'developer'
  | 'agent'
  | 'neighborhood'
  | 'account'

export interface ReviewsSectionProps {
  targetType: ReviewTargetType
  targetId: string
  className?: string
}

const SORTS: ReviewSort[] = ['newest', 'highest', 'helpful']

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2'

export function ReviewsSection({ targetType, targetId, className }: ReviewsSectionProps) {
  const { lang } = useI18n()
  const s = getReviewStrings(lang)
  const [data, setData] = useState<ReviewsResponse | null>(null)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<ReviewSort>('newest')
  const [reloadKey, setReloadKey] = useState(0)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const [errorKey, setErrorKey] = useState<string | null>(null)

  // Reset paging/sorting when the target changes — state adjusted during render
  // (react.dev: "You Might Not Need an Effect"); no setState in effect bodies.
  const targetKey = `${targetType}:${targetId}`
  const [prevTarget, setPrevTarget] = useState(targetKey)
  if (prevTarget !== targetKey) {
    setPrevTarget(targetKey)
    setPage(1)
    setSort('newest')
  }

  // busy/error are derived from which request the current data answers.
  const reqKey = `${targetKey}:${page}:${sort}:${reloadKey}`
  const busy = loadedKey !== reqKey && errorKey !== reqKey

  useEffect(() => {
    const ac = new AbortController()
    const params = new URLSearchParams({ targetType, targetId, page: String(page), sort })
    fetch(`/api/reviews?${params}`, { signal: ac.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status))
        return (await res.json()) as ReviewsResponse
      })
      .then((d) => {
        setData(d)
        setLoadedKey(reqKey)
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setErrorKey(reqKey)
      })
    return () => ac.abort()
  }, [targetType, targetId, page, sort, reloadKey, reqKey])

  // ponytail: optimistic prepend + local aggregate bump; the next page/sort fetch reconciles.
  const onSubmitted = useCallback((review: ReviewItem) => {
    setData((prev) => {
      if (!prev) return prev
      const count = prev.count + 1
      const average = (prev.average * prev.count + review.rating) / count
      const key = String(Math.round(review.rating))
      const distribution = { ...prev.distribution, [key]: (prev.distribution?.[key] ?? 0) + 1 }
      return { ...prev, count, average, distribution, reviews: [review, ...prev.reviews] }
    })
    setErrorKey((k) => (k === reqKey ? null : k))
  }, [reqKey])

  return (
    <section aria-label={s.sectionTitle} className={cn('w-full', className)}>
      <h2 className="text-[26px] font-black tracking-[-0.02em] text-sv-ink md:text-[32px]">
        {s.sectionTitle}
        {data && data.count > 0 && (
          <span className="ms-3 align-middle text-[15px] font-bold text-sv-ink/45">{s.reviewsCount(data.count)}</span>
        )}
      </h2>

      {busy && !data && (
        <>
          <span className="sr-only" role="status">
            {s.loading}
          </span>
          <div aria-hidden className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
            <div className="space-y-6">
              <div className="h-48 animate-pulse rounded-card bg-sv-ink/[0.06]" />
              <div className="h-80 animate-pulse rounded-card bg-sv-ink/[0.06]" />
            </div>
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-36 animate-pulse rounded-card bg-sv-ink/[0.06]" />
              ))}
            </div>
          </div>
        </>
      )}

      {errorKey === reqKey && (
        <div role="alert" className="mt-6 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-8 text-center shadow-card">
          <p className="text-[16px] font-extrabold text-sv-ink">{s.loadError}</p>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className={cn(
              'mt-4 min-h-[44px] rounded-full bg-sv-orange px-6 text-[14px] font-extrabold text-white transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]',
              focusRing,
            )}
          >
            {s.retry}
          </button>
        </div>
      )}

      {data && errorKey !== reqKey && (
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {data.count > 0 && (
              <div className="rounded-card border border-sv-ink/[0.06] bg-gradient-to-b from-sv-cloud to-sv-surface p-6 shadow-card">
                <div className="flex items-end gap-4">
                  <span className="text-[46px] font-black leading-none tracking-tight text-sv-ink">
                    {data.average.toFixed(1)}
                  </span>
                  <div className="pb-1">
                    <RatingStars value={data.average} label={s.starsReadOnly(Number(data.average.toFixed(1)))} />
                    <p className="mt-1 text-[13px] font-semibold text-sv-ink/55">{s.reviewsCount(data.count)}</p>
                  </div>
                </div>
                <ul className="mt-5 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const c = data.distribution?.[String(stars)] ?? 0
                    const pct = data.count > 0 ? (c / data.count) * 100 : 0
                    return (
                      <li key={stars} aria-label={s.distributionRow(stars, c)} className="flex items-center gap-2.5">
                        <span className="flex w-6 items-center gap-0.5 text-[13px] font-bold text-sv-ink/70">
                          {stars}
                          <Star aria-hidden className="h-3 w-3 fill-sv-ink/30 text-sv-ink/30" />
                        </span>
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-sv-ink/[0.07]">
                          <span
                            className="block h-full rounded-full bg-sv-orange transition-[width] duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </span>
                        <span className="w-8 text-end text-[12px] font-semibold tabular-nums text-sv-ink/50">{c}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            <ReviewForm
              targetType={targetType}
              targetId={targetId}
              strings={s}
              locale={lang}
              onSubmitted={onSubmitted}
            />
          </div>

          <div aria-busy={busy} className={cn('transition-opacity duration-200', busy && 'opacity-50')}>
            {data.count === 0 ? (
              <div className="flex h-full min-h-[260px] flex-col items-center justify-center rounded-card border border-dashed border-sv-ink/15 bg-sv-cloud/60 p-10 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-sv-orange/10 text-sv-orange">
                  <Star aria-hidden className="h-6 w-6 fill-current" />
                </span>
                <p className="mt-4 text-[18px] font-extrabold text-sv-ink">{s.emptyTitle}</p>
                <p className="mt-1.5 max-w-[320px] text-[14px] font-medium leading-relaxed text-sv-ink/55">{s.emptySub}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-end">
                  <label className="flex items-center gap-2.5 text-[13px] font-bold text-sv-ink/60">
                    {s.sortLabel}
                    <select
                      value={sort}
                      onChange={(e) => {
                        const v = e.target.value as ReviewSort
                        if (SORTS.includes(v)) {
                          setSort(v)
                          setPage(1)
                        }
                      }}
                      className={cn(
                        'h-11 rounded-control border border-sv-ink/10 bg-sv-surface px-3 text-[14px] font-semibold text-sv-ink',
                        focusRing,
                      )}
                    >
                      <option value="newest">{s.sortNewest}</option>
                      <option value="highest">{s.sortHighest}</option>
                      <option value="helpful">{s.sortHelpful}</option>
                    </select>
                  </label>
                </div>

                <div className="mt-4 space-y-4">
                  {data.reviews.map((r) => (
                    <ReviewCard key={r.id} review={r} strings={s} locale={lang} />
                  ))}
                </div>

                {data.pages > 1 && (
                  <nav aria-label={s.sectionTitle} className="mt-6 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={cn(
                        'min-h-[44px] rounded-full border border-sv-ink/10 px-5 text-[14px] font-bold text-sv-ink transition-colors duration-200 hover:border-sv-orange/40 hover:text-sv-orange disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-sv-ink/10 disabled:hover:text-sv-ink',
                        focusRing,
                      )}
                    >
                      {s.prevPage}
                    </button>
                    <span className="text-[13px] font-bold tabular-nums text-sv-ink/60">{s.pageOf(data.page, data.pages)}</span>
                    <button
                      type="button"
                      disabled={page >= data.pages}
                      onClick={() => setPage((p) => p + 1)}
                      className={cn(
                        'min-h-[44px] rounded-full border border-sv-ink/10 px-5 text-[14px] font-bold text-sv-ink transition-colors duration-200 hover:border-sv-orange/40 hover:text-sv-orange disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-sv-ink/10 disabled:hover:text-sv-ink',
                        focusRing,
                      )}
                    >
                      {s.nextPage}
                    </button>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
