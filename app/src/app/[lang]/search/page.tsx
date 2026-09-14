import type { Metadata } from 'next'
import { Suspense } from 'react'
import SearchClient from '@/components/search/SearchClient'
import { pickAds } from '@/lib/ads-db'
import { canCatalogFallback, catalogSearch } from '@/lib/catalog-search'
import { isValidLang } from '@/lib/i18n/core'
import { kaOnlyAlternates, pageMeta } from '@/lib/i18n/server'
import { mapSearchHit } from '@/lib/map-search-hit'
import { countryIsoForMarket } from '@/lib/markets'
import { requestMarket } from '@/lib/request-market'
import { parseSearchParams } from '@/lib/search-filters'

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const worldwide = (await requestMarket()) === 'global'
  return {
    ...pageMeta('/search', lang, {
      ka: {
        title: 'ძიება',
        description:
          'მოძებნე ბინები, სახლები, აგარაკები, მიწა და კომერციული ფართები მთელ საქართველოში — ვერიფიცირებული განცხადებები AI ფასის შეფასებით.',
      },
      en: {
        title: 'Search',
        description: worldwide
          ? 'Search apartments, houses, cottages, land and commercial spaces worldwide — verified listings with AI price estimates.'
          : 'Search apartments, houses, cottages, land and commercial spaces across Georgia — verified listings with AI price estimates.',
      },
      ru: {
        title: 'Поиск',
        description:
          'Поиск квартир, домов, коттеджей, земли и коммерческих площадей по всей Грузии — проверенные объявления с ИИ-оценкой цены.',
      },
    }),
    alternates: worldwide ? { canonical: '/en/search' } : kaOnlyAlternates('/search'),
    robots: { index: false, follow: true },
  }
}

function SearchFallback({ lang }: { lang: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-sv-cloud" role="status" aria-label={lang === "ru" ? "Загрузка" : lang === "ka" ? "იტვირთება" : "Loading"}>
      <span className="sv-spinner" aria-hidden />
    </div>
  )
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const spIn = await searchParams
  const ads = await pickAds(['search_top', 'search_native'], { audience: 'guest', lang })
  const marketIso = countryIsoForMarket(await requestMarket()) ?? 'all'

  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(spIn)) {
    const s = one(v)
    if (s) qs.set(k, s)
  }
  if (!qs.get('country') && marketIso !== 'all') qs.set('country', marketIso)

  const filters = parseSearchParams(qs)
  const country = filters.country ?? marketIso

  let initialHits: ReturnType<typeof mapSearchHit>[] | undefined
  let initialTotal: number | undefined
  if (canCatalogFallback(filters)) {
    const cat = await catalogSearch(filters)
    if (cat && cat.totalHits > 0) {
      initialHits = cat.hits.map((h) => mapSearchHit(h as Record<string, unknown>))
      initialTotal = cat.totalHits
    } else {
      initialHits = []
      initialTotal = 0
    }
  } else if (filters.country && filters.country !== 'GE') {
    initialHits = []
    initialTotal = 0
  }

  return (
    <Suspense fallback={<SearchFallback lang={lang} />}>
      <SearchClient
        ads={{ top: ads.search_top ?? null, native: ads.search_native ?? null }}
        country={country}
        initialHits={initialHits}
        initialTotal={initialTotal}
      />
    </Suspense>
  )
}
