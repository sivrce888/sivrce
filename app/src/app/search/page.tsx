import type { Metadata } from 'next'
import { Suspense } from 'react'
import SearchClient from '@/components/search/SearchClient'

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

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchClient />
    </Suspense>
  )
}
