import type { Metadata } from 'next'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import LocalizedLink from '@/components/LocalizedLink'
import MarketView from '@/components/market/MarketView'
import TbilisiPriceMap from '@/components/market/TbilisiPriceMap'
import { getMarketOverview, getProjectRaionMedians } from '@/lib/market-stats'
import { quarterKey } from '@/lib/market-stats-core'
import { USD_GEL } from '@/lib/listings-db'
import { jsonLd } from '@/lib/utils'
import { isValidLang, type Lang } from '@/lib/i18n/core'
import {pageAlternates, OG_LOCALE,  } from '@/lib/i18n/server'
import { ArrowUpRight } from 'lucide-react'

const VALUATION_CTA: Partial<Record<Lang, string>> = {
  ka: 'გაიგე შენი ბინის ღირებულება — უფასო შეფასება 30 წამში',
  en: 'What is your home worth? — free instant estimate',
  ru: 'Узнайте стоимость квартиры — бесплатная оценка за 30 секунд',
  de: 'Was ist Ihre Wohnung wert? — kostenlose Sofortschätzung',
}

export const revalidate = 3600

// ponytail: prerender ka only — other locales SSR on demand via dynamicParams.
export function generateStaticParams() {
  return [{ lang: 'ka' }]
}

const META: Record<string, { title: string; description: string }> = {
  ka: {
    title: 'უძრავი ქონების ფასები საქართველოში — ბაზრის ანალიტიკა',
    description:
      'საშუალო ფასები მ²-ზე უბნების მიხედვით, მედიანური ფასები და მოთხოვნა — პირდაპირ აქტიური განცხადებებიდან, ყოველდღიური განახლებით.',
  },
  en: {
    title: 'Property prices in Georgia — market analytics',
    description:
      'Average prices per m² by district, medians and demand — aggregated live from active listings, updated daily.',
  },
  de: {
    title: 'Immobilienpreise in Georgien — Marktanalyse',
    description:
      'Durchschnittspreise pro m² nach Stadtteil, Mediane und Nachfrage — live aus aktiven Inseraten, täglich aktualisiert.',
  },
  ru: {
    title: 'Цены на недвижимость в Грузии — аналитика рынка',
    description:
      'Средние цены за м² по районам, медианы и спрос — напрямую из активных объявлений, обновляется ежедневно.',
  },
}

const INTL_LOCALE: Record<Lang, string> = {
  ka: 'ka-GE',
  en: 'en-US',
  ru: 'ru-RU',
  he: 'he-IL',
  ar: 'ar',
  tr: 'tr-TR',
  uk: 'uk-UA',
  hy: 'hy-AM',
  az: 'az',
  de: 'de-DE',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const m = META[lang] ?? META.en
  return {
    title: m.title,
    description: m.description,
    alternates: pageAlternates('/market', lang),
    openGraph: {
      title: `${m.title} | sivrce`,
      description: m.description,
      type: 'website',
      url: `https://sivrce.ge/market`,
      siteName: 'sivrce',
      locale: OG_LOCALE[lang],
    },
  }
}

export default async function MarketPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const [data, raions] = await Promise.all([getMarketOverview(USD_GEL), getProjectRaionMedians()])
  const updated = new Intl.DateTimeFormat(INTL_LOCALE[lang], {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date())

  const datasetLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'sivrce — Georgia real estate market prices',
    description:
      'Average USD price per m², medians, active and new listing counts by district, aggregated from active listings on sivrce.ge.',
    url: 'https://sivrce.ge/market',
    creator: { '@type': 'Organization', name: 'sivrce', url: 'https://sivrce.ge' },
    temporalCoverage: new Date().toISOString().slice(0, 7),
    isAccessibleForFree: true,
  }
  const homeLabel = lang === 'ka' ? 'მთავარი' : lang === 'ru' ? 'Главная' : lang === 'de' ? 'Startseite' : 'Home'
  const marketLabel = lang === 'ka' ? 'ბაზრის ანალიტიკა' : lang === 'ru' ? 'Аналитика рынка' : lang === 'de' ? 'Marktanalyse' : 'Market analytics'
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: homeLabel, item: 'https://sivrce.ge' },
      { '@type': 'ListItem', position: 2, name: marketLabel, item: 'https://sivrce.ge/market' },
    ],
  }

  return (
    <div className="min-h-screen bg-sv-surface">
      <Navbar />
      <main id="main">
        <div className="mx-auto max-w-[1100px] px-5 pt-10 md:px-10">
          {/* SSR choropleth — server component feeding off the same cached stats */}
          <TbilisiPriceMap rows={raions} loc={lang === 'ka' ? 'ka' : lang === 'ru' ? 'ru' : lang === 'de' ? 'de' : 'en'} />
        </div>
        <MarketView data={data} updated={updated} />
        <div className="mx-auto max-w-[1100px] space-y-2 px-5 pb-16 md:px-10">
          <LocalizedLink
            href={`/market/${quarterKey(new Date()).toLowerCase()}`}
            className="flex min-h-14 items-center justify-between gap-4 rounded-card border border-sv-ink/[0.06] bg-sv-surface px-6 py-4 text-[15px] font-extrabold text-sv-ink shadow-card transition-colors hover:text-sv-blue"
          >
            {lang === 'ka'
              ? `კვარტალური ანგარიში: ${quarterKey(new Date())}`
              : lang === 'ru'
                ? `Квартальный отчёт: ${quarterKey(new Date())}`
                : lang === 'de'
                  ? `Quartalsbericht: ${quarterKey(new Date())}`
                  : `Quarterly report: ${quarterKey(new Date())}`}
            <ArrowUpRight className="h-5 w-5 shrink-0 text-sv-blue" aria-hidden />
          </LocalizedLink>
          <LocalizedLink
            href="/valuation"
            className="flex min-h-14 items-center justify-between gap-4 rounded-card border border-sv-ink/[0.06] bg-sv-surface px-6 py-4 text-[15px] font-extrabold text-sv-ink shadow-card transition-colors hover:text-sv-blue"
          >
            {VALUATION_CTA[lang] ?? VALUATION_CTA.en}
            <ArrowUpRight className="h-5 w-5 shrink-0 text-sv-blue" aria-hidden />
          </LocalizedLink>
        </div>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(datasetLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbLd) }}
      />
    </div>
  )
}
