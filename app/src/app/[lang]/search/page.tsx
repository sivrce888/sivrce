import type { Metadata } from 'next'
import { Suspense } from 'react'
import SearchClient from '@/components/search/SearchClient'
import { getSearchLocations } from '@/lib/listings-db'

export const metadata: Metadata = {
  title: 'ძიება — ბინები, სახლები, კომერციული',
  description:
    'მოძებნე ბინები, სახლები, აგარაკები, მიწა და კომერციული ფართები მთელ საქართველოში — ვერიფიცირებული განცხადებები AI ფასის შეფასებით.',
  alternates: { canonical: '/search' },
  robots: { index: false, follow: true },
}

function SearchFallback() {
  return (
    <div className="grid min-h-screen place-items-center bg-sv-cloud" role="status" aria-label="იტვირთება">
      <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-sv-blue/20 border-t-sv-blue" />
    </div>
  )
}

export default async function SearchPage() {
  // Live city/district facets (DB-backed, 5-min cache; static fallback inside).
  const locations = await getSearchLocations()
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchClient locations={locations} />
    </Suspense>
  )
}
