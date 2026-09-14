import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import NeighborhoodDetail from '@/components/neighborhoods/NeighborhoodDetail'
import { NEIGHBORHOODS, getNeighborhood, pick } from '@/data/neighborhoods'
import { getListingsInDistricts, USD_GEL } from '@/lib/listings-db'
import { getNeighborhoodMarketStats } from '@/lib/market-stats'
import { WeatherBadge } from '@/components/WeatherBadge'
import { jsonLd, ogImage } from '@/lib/utils'
import { pageAlternates, OG_LOCALE } from '@/lib/i18n/server'
import { isValidLang, type Lang } from '@/lib/i18n/core'
import { dirLoc, neighborhoodFaqs, faqPageLd } from '@/lib/directory-seo'

export const revalidate = 3600

// ponytail: dynamicParams default (true) — unknown slugs hit notFound() below.
export function generateStaticParams() {
  // ponytail: prerender ka only (today's build surface) — other locales SSR on
  // demand via dynamicParams. Upgrade path: per-locale SSG when build budget allows.
  return NEIGHBORHOODS.map((n) => ({ lang: 'ka', slug: n.slug }))
}

interface PageProps {
  params: Promise<{ lang: string; slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang: raw, slug } = await params
  const lang: Lang = isValidLang(raw) ? raw : 'ka'
  const loc = dirLoc(lang)
  const n = getNeighborhood(slug)
  if (!n) return {}
  const name = pick(n.name, loc)
  const desc = pick(n.description, loc)
  const title =
    loc === 'ka'
      ? `${name} — უბნის გზამკვლევი, ფასები და შეფასებები`
      : loc === 'ru'
      ? `${name} — гид по району, цены и отзывы`
      : `${name} — Neighborhood Guide, Prices & Reviews`
  return {
    title,
    description: desc,
    alternates: pageAlternates(`/neighborhoods/${n.slug}`, lang),
    openGraph: {
      title,
      description: desc,
      type: 'website',
      url: `https://sivrce.ge/neighborhoods/${n.slug}`,
      siteName: 'sivrce',
      locale: OG_LOCALE[lang],
      images: [{ url: ogImage(n.img), alt: name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: [ogImage(n.img)],
    },
  }
}

export default async function NeighborhoodPage({ params }: PageProps) {
  const { lang: raw, slug } = await params
  if (!isValidLang(raw)) notFound()
  const lang = raw as Lang
  const loc = dirLoc(lang)
  const n = getNeighborhood(slug)
  if (!n) notFound()

  const [listings, market] = await Promise.all([
    getListingsInDistricts(n.districts, 8),
    getNeighborhoodMarketStats(n.cityKey, n.districts, USD_GEL),
  ])

  const name = pick(n.name, loc)
  const city = pick(n.city, loc)
  const desc = pick(n.description, loc)
  const livePrice = market.stats?.avgPerM2USD ?? n.avgPriceM2USD
  const faqs = neighborhoodFaqs(n, loc, livePrice)

  // aggregateRating intentionally omitted — ratings are runtime data (Review model)
  const placeLd = {
    '@context': 'https://schema.org',
    '@type': n.type,
    name,
    alternateName: [n.name.ka, n.name.en, n.name.ru].filter((v) => v !== name),
    description: desc,
    url: `https://sivrce.ge/neighborhoods/${n.slug}`,
    image: `https://sivrce.ge${n.img}`,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: n.coords.lat,
      longitude: n.coords.lng,
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: n.city.ka,
      addressCountry: n.slug.startsWith('berlin') ? 'DE' : 'GE',
    },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '.speakable-lead'],
    },
    ...(n.type === 'Neighborhood' && {
      containedInPlace: { '@type': 'City', name: city },
    }),
  }

  const homeLabel = loc === 'ka' ? 'მთავარი' : loc === 'ru' ? 'Главная' : 'Home'
  const hubLabel = loc === 'ka' ? 'უბნები' : loc === 'ru' ? 'Районы' : 'Neighborhoods'
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: homeLabel, item: 'https://sivrce.ge' },
      { '@type': 'ListItem', position: 2, name: hubLabel, item: 'https://sivrce.ge/neighborhoods' },
      { '@type': 'ListItem', position: 3, name, item: `https://sivrce.ge/neighborhoods/${n.slug}` },
    ],
  }

  return (
    <div className="min-h-screen bg-sv-surface">
      <Navbar />
      <main id="main">
        <NeighborhoodDetail
          n={n}
          listings={listings}
          market={market}
          faqs={faqs}
          weather={
            <WeatherBadge
              coords={n.coords}
              label={name}
              className="text-white/80"
              iconClassName="h-4 w-4"
            />
          }
        />
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(placeLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqPageLd(faqs)) }} />
    </div>
  )
}
