'use client'

import Link from 'next/link'
import { Clock } from 'lucide-react'
import ListingCard from '@/components/ListingCard'
import { getListing, type Listing } from '@/data/listings'
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
  const ids = useRecentIds()
  const items = ids
    .slice(0, limit)
    .map((id) => getListing(id))
    .filter((l): l is Listing => Boolean(l))

  if (items.length === 0 && hideWhenEmpty) return null

  return (
    <section aria-label={heading} className={className}>
      <SectionHeader icon={Clock} title={heading} count={items.length} chipClass="bg-sv-violet/10 text-sv-violet" />
      {items.length === 0 ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card">
          <p className="text-[14px] font-semibold text-sv-ink/50">{tt('noRecent')}</p>
          <Link
            href="/search"
            className="inline-flex h-11 items-center rounded-full px-1 text-[14px] font-extrabold text-sv-blue transition-colors hover:text-sv-blue-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue/30"
          >
            {tt('browse')}
          </Link>
        </div>
      ) : (
        <div className="flex snap-x gap-6 overflow-x-auto pb-4">
          {items.map((l, i) => (
            <ListingCard key={l.id} l={l} i={i} layout="grid" />
          ))}
        </div>
      )}
    </section>
  )
}
