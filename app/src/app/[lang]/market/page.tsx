import type { Metadata } from 'next'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import MarketView from '@/components/market/MarketView'
import { getMarketOverview } from '@/lib/market-stats'
import { USD_GEL } from '@/lib/listings-db'
import { jsonLd } from '@/lib/utils'
import { isValidLang, type Lang } from '@/lib/i18n/core'
import { langAlternates } from '@/lib/i18n/server'

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
    alternates: { canonical: '/market', languages: langAlternates('/market') },
    openGraph: {
      title: `${m.title} | sivrce`,
      description: m.description,
      type: 'website',
      url: `https://sivrce.ge/market`,
      siteName: 'sivrce',
      locale: lang === 'ka' ? 'ka_GE' : lang === 'en' ? 'en_US' : 'ru_RU',
    },
  }
}

export default async function MarketPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const [data] = await Promise.all([getMarketOverview(USD_GEL)])
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
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'მთავარი', item: 'https://sivrce.ge' },
      { '@type': 'ListItem', position: 2, name: 'ბაზრის ანალიტიკა', item: 'https://sivrce.ge/market' },
    ],
  }

  return (
    <div className="min-h-screen bg-sv-surface">
      <Navbar />
      <main id="main">
        <MarketView data={data} updated={updated} />
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
