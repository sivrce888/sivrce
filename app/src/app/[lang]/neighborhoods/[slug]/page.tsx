import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import NeighborhoodDetail from '@/components/neighborhoods/NeighborhoodDetail'
import { NEIGHBORHOODS, getNeighborhood, pick } from '@/data/neighborhoods'
import { getListingsInDistricts, USD_GEL } from '@/lib/listings-db'
import { getNeighborhoodMarketStats } from '@/lib/market-stats'
import { AirBadge, WeatherBadge } from '@/components/WeatherBadge'
import { WeatherPanel } from '@/components/WeatherPanel'
import { nearestAmenities } from '@/lib/map/pois'
import { AmenityChips } from '@/components/places/AmenityChips'
import { jsonLd, ogImage } from '@/lib/utils'
import { getServerT, pageAlternates, OG_LOCALE } from '@/lib/i18n/server'
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
  // de gets German FAQ copy (neighborhoodFaqs carries its own 'de' corpus);
  // everything else on this page stays on the ka/en/ru dirLoc convention.
  const faqs = neighborhoodFaqs(n, lang === 'de' ? 'de' : loc, livePrice)

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
  const around = nearestAmenities(n.coords.lat, n.coords.lng)
  const aroundT = getServerT(lang)('detail.around')
  const amenitiesNode =
    around.length > 0 ? (
      <section aria-label={aroundT} className="bg-sv-cloud py-16 md:py-20">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          <h2 className="mb-6 text-[26px] font-black tracking-[-0.02em] text-sv-ink md:text-[32px]">
            {aroundT}
          </h2>
          <AmenityChips amenities={around} lang={lang} />
        </div>
      </section>
    ) : null
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
          forecast={<WeatherPanel coords={n.coords} place={name} lang={lang} />}
          faqs={faqs}
          amenities={amenitiesNode}
          weather={
            <>
              <WeatherBadge
                coords={n.coords}
                label={name}
                className="text-white/80"
                iconClassName="h-4 w-4"
              />
              <AirBadge
                coords={n.coords}
                lang={lang}
                className="text-white/80"
                iconClassName="h-4 w-4"
              />
            </>
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
