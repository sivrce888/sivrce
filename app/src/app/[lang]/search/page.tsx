import type { Metadata } from 'next'
import { Suspense } from 'react'
import SearchClient from '@/components/search/SearchClient'
import { audienceFromRole } from '@/lib/ads'
import { pickAds } from '@/lib/ads-db'
import { getSessionUser } from '@/lib/guards'
import { isValidLang } from '@/lib/i18n/core'
import { getSearchLocations } from '@/lib/listings-db'
import { langAlternates } from '@/lib/i18n/server'

// Align with getSearchLocations unstable_cache (5 min) — skip full SSR each hit.
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
      <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-sv-blue/20 border-t-sv-blue" />
    </div>
  )
}

export default async function SearchPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const user = await getSessionUser()
  const [locations, ads] = await Promise.all([
    getSearchLocations(),
    pickAds(['search_top', 'search_native'], {
      audience: audienceFromRole(user?.role),
      lang,
    }),
  ])
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchClient
        locations={locations}
        ads={{ top: ads.search_top ?? null, native: ads.search_native ?? null }}
      />
    </Suspense>
  )
}
