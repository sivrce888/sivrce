'use client'

import { Suspense } from 'react'
import SearchClient, { type SearchLock } from '@/components/search/SearchClient'
import ListingCard from '@/components/ListingCard'
import type { Listing } from '@/data/listings'

interface SeoFilterableListingsProps {
  initialListings: Listing[]
  gridAriaLabel: string
  lock?: SearchLock
}

function FallbackGrid({ listings, aria }: { listings: Listing[]; aria: string }) {
  return (
    <section aria-label={aria} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {listings.slice(0, 24).map((l, i) => (
        <ListingCard key={l.id} l={l} i={i} layout="wide" />
      ))}
    </section>
  )
}

export default function SeoFilterableListings({
  initialListings,
  gridAriaLabel,
  lock,
}: SeoFilterableListingsProps) {
  return (
    <Suspense fallback={<FallbackGrid listings={initialListings} aria={gridAriaLabel} />}>
      <SearchClient embed lock={lock} initialHits={initialListings.slice(0, 24)} />
    </Suspense>
  )
}
