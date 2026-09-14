import type { Metadata } from 'next'
import Navbar from '@/components/sections/Navbar'
import CTA from '@/components/sections/CTA'
import Footer from '@/components/sections/Footer'
import NeighborhoodsIndex from '@/components/neighborhoods/NeighborhoodsIndex'
import { AdSlot } from '@/components/ads/AdSlot'
import { isValidLang, type Lang } from '@/lib/i18n/core'
import { NEIGHBORHOODS, pick } from '@/data/neighborhoods'
import { getDistrictListingCounts, USD_GEL } from '@/lib/listings-db'
import { getNeighborhoodMarketStats } from '@/lib/market-stats'
import { jsonLd } from '@/lib/utils'
import { pageMeta } from '@/lib/i18n/server'
import { dirLoc } from '@/lib/directory-seo'

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  return {
    ...pageMeta('/neighborhoods', lang, {
      ka: {
        title: 'უბნები თბილისში — ვაკე, საბურთალო და სხვა რაიონების გზამკვლევი',
        description:
          'ბინები იყიდება და ქირავდება საბურთალოზე, ვაკეში და სხვა უბნებში, ასევე დღიურად ქირავდება. ცხოვრების ხარისხის ქულები, ფასი მ²-ზე და რეალური ფოტოები.',
      },
      en: {
        title: 'Tbilisi Neighborhoods — Vake, Saburtalo Guides & Prices',
        description:
          'Daily rentals in Saburtalo and Vake, for sale and for rent. Quality-of-life scores, price per m² and real photos.',
      },
      ru: {
        title: 'Районы Тбилиси — Ваке, Сабуртало: гиды и цены',
        description:
          'Посуточно в Сабуртало и Ваке, продажа и аренда. Оценки качества жизни, цена за м² и реальные фото.',
      },
    }),
    openGraph: {
      title: 'უბნების გზამკვლევი — ცხოვრების ხარისხის ქულები და ფასები',
      description:
        'ვაკე, საბურთალო, ძველი თბილისი, ბათუმი, ქუთაისი — ქულები, ფასები მ²-ზე და მცხოვრებლების შეფასებები.',
      type: 'website',
    },
  }
}

export default async function NeighborhoodsPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang: raw } = await params
  const lang: Lang = isValidLang(raw) ? raw : 'ka'
  const loc = dirLoc(lang)
  const counts = await getDistrictListingCounts()
  // Same live source as the detail page so index and detail never contradict.
  const markets = await Promise.all(
    NEIGHBORHOODS.map((n) => getNeighborhoodMarketStats(n.cityKey, n.districts, USD_GEL)),
  )
  const liveAvg: Record<string, number> = {}
  NEIGHBORHOODS.forEach((n, i) => {
    const v = markets[i].stats?.avgPerM2USD
    if (v) liveAvg[n.slug] = v
  })

  const hubName = loc === 'ka' ? 'უბნების გზამკვლევი — sivrce' : loc === 'ru' ? 'Районы Грузии — sivrce' : 'Georgia Neighborhood Guides — sivrce'
  const homeLabel = loc === 'ka' ? 'მთავარი' : loc === 'ru' ? 'Главная' : 'Home'
  const hubLabel = loc === 'ka' ? 'უბნები' : loc === 'ru' ? 'Районы' : 'Neighborhoods'

  const listLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: hubName,
    url: 'https://sivrce.ge/neighborhoods',
    numberOfItems: NEIGHBORHOODS.length,
    itemListElement: NEIGHBORHOODS.map((n, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: pick(n.name, loc),
      url: `https://sivrce.ge/neighborhoods/${n.slug}`,
    })),
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: homeLabel, item: 'https://sivrce.ge' },
      { '@type': 'ListItem', position: 2, name: hubLabel, item: 'https://sivrce.ge/neighborhoods' },
    ],
  }

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <NeighborhoodsIndex counts={counts} liveAvg={liveAvg} />
        <AdSlot slot="neighborhoods" lang={lang} />
        <CTA />
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(listLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbLd) }} />
    </div>
  )
}
