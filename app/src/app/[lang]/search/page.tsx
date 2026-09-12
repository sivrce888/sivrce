import type { Metadata } from 'next'
import { Suspense } from 'react'
import SearchClient from '@/components/search/SearchClient'
import { pickAds } from '@/lib/ads-db'
import { isValidLang } from '@/lib/i18n/core'
import { kaOnlyAlternates, pageMeta } from '@/lib/i18n/server'
import { requestMarket } from '@/lib/request-market'

export const revalidate = 300

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

export default async function SearchPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const ads = await pickAds(['search_top', 'search_native'], { audience: 'guest', lang })
  // Market scope: global hub (.com /search) searches the whole world incl.
  // Georgia; the Georgia catalog (.ge + /ge mirror) stays GE-scoped.
  const country = (await requestMarket()) === 'global' ? 'all' : 'GE'
  return (
    <Suspense fallback={<SearchFallback lang={lang} />}>
      <SearchClient
        ads={{ top: ads.search_top ?? null, native: ads.search_native ?? null }}
        country={country}
      />
    </Suspense>
  )
}
