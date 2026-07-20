'use client'

import LocalizedLink from '@/components/LocalizedLink'
import { Clock } from 'lucide-react'
import ListingCard from '@/components/ListingCard'
import HScroll from '@/components/HScroll'
import { useListingsByIds } from '@/lib/use-listings-by-ids'
import { useRecentIds } from '@/lib/recent'
import SectionHeader from './SectionHeader'
import { useAccountStrings } from './i18n'

interface RecentlyViewedProps {
  /** Cap on cards shown (storage keeps 10 by default). */
  limit?: number
  /** Override the localized default heading. */
  title?: string
  /** true (default) renders nothing when empty — safe for homepage drop-in. */
  hideWhenEmpty?: boolean
  className?: string
}

export default function RecentlyViewed({
  limit = 10,
  title,
  hideWhenEmpty = true,
  className,
}: RecentlyViewedProps) {
  const tt = useAccountStrings()
  const heading = title ?? tt('recentlyViewed')
  const ids = useRecentIds().slice(0, limit)
  const { items, loading } = useListingsByIds(ids)

  if (!loading && items.length === 0 && hideWhenEmpty) return null

  return (
    <section aria-label={heading} className={className}>
      <SectionHeader icon={Clock} title={heading} count={items.length} chipClass="bg-sv-violet/10 text-sv-violet" />
      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-64 w-64 shrink-0 animate-pulse rounded-card bg-sv-cloud" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card">
          <p className="text-[14px] font-semibold text-sv-ink/50">{tt('noRecent')}</p>
          <LocalizedLink
            href="/search"
            className="inline-flex h-11 items-center rounded-full px-1 text-[14px] font-extrabold text-sv-blue transition-colors hover:text-sv-blue-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue/30"
          >
            {tt('browse')}
          </LocalizedLink>
        </div>
      ) : (
        <HScroll>
          {items.map((l, i) => (
            <div key={l.id} className="w-[280px] shrink-0">
              <ListingCard l={l} i={i} layout="wide" />
            </div>
          ))}
        </HScroll>
      )}
    </section>
  )
}
