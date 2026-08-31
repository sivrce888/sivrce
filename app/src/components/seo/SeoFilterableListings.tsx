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
    <section aria-label={aria} className="sv-card-grid">
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
