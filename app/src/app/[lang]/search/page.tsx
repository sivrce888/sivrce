import type { Metadata } from 'next'
import { Suspense } from 'react'
import SearchClient from '@/components/search/SearchClient'
import { pickAds } from '@/lib/ads-db'
import { isValidLang } from '@/lib/i18n/core'
import { langAlternates } from '@/lib/i18n/server'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'ძიება — ბინები, სახლები, კომერციული',
  description:
    'მოძებნე ბინები, სახლები, აგარაკები, მიწა და კომერციული ფართები მთელ საქართველოში — ვერიფიცირებული განცხადებები AI ფასის შეფასებით.',
  alternates: { canonical: '/search', languages: langAlternates('/search') },
  robots: { index: false, follow: true },
}

function SearchFallback() {
  return (
    <div className="grid min-h-screen place-items-center bg-sv-cloud" role="status" aria-label="იტვირთება">
      <span className="sv-spinner" aria-hidden />
    </div>
  )
}

export default async function SearchPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const ads = await pickAds(['search_top', 'search_native'], { audience: 'guest', lang })
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchClient
        ads={{ top: ads.search_top ?? null, native: ads.search_native ?? null }}
      />
    </Suspense>
  )
}
