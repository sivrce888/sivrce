import { Suspense } from 'react'
import type { Metadata } from 'next'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { WeatherBadge } from '@/components/WeatherBadge'
import MarketListings from '@/components/country/MarketListings'
import { COM_ORIGIN, MARKETS, type PathCountryId } from '@/lib/markets'
import { COUNTRY_NAMES } from '@/lib/country-copy'
import { nearestWorldMetroStation } from '@/lib/countries/global-os'
import { jsonLd } from '@/lib/utils'
import { hoodsByCity, type WorldNeighborhood } from '@/data/world-neighborhoods'

const TYPE_LABEL: Record<WorldNeighborhood['type'], string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  mixed: 'Mixed-use',
  luxury: 'Luxury',
  suburban: 'Suburban',
}

function priceLabel(hood: WorldNeighborhood): string {
  if (!hood.avgPricePerSqm) return 'On request'
  return `from ~${hood.currency ?? '$'}${hood.avgPricePerSqm.toLocaleString('en-US')}/m²`
}

export function hoodPath(country: PathCountryId, citySlug: string, hoodSlug: string): string {
  return `${MARKETS[country].pathPrefix}/${citySlug}/${hoodSlug}`
}

export function hoodMetadata(
  country: PathCountryId,
  citySlug: string,
  hood: WorldNeighborhood,
): Metadata {
  const path = hoodPath(country, citySlug, hood.slug)
  const url = `${COM_ORIGIN}${path}`
  const title = `${hood.en} real estate, ${hood.city} — prices & area guide | sivrce`
  const description = `${hood.en} (${TYPE_LABEL[hood.type].toLowerCase()}) area guide: ${priceLabel(hood)}, walk score ${hood.walkScore ?? '—'}/100, transit score ${hood.transitScore ?? '—'}/100. ${hood.highlights.join(' · ')}.`
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url, languages: { en: url, 'x-default': url } },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url,
      siteName: 'sivrce',
      title,
      description,
      images: [{ url: '/images/og-brand.png', width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: ['/images/og-brand.png'] },
    robots: { index: true, follow: true },
  }
}

export default function HoodPage({
  country,
  citySlug,
  hood,
}: {
  country: PathCountryId
  citySlug: string
  hood: WorldNeighborhood
}) {
  const market = MARKETS[country]
  const countryName = COUNTRY_NAMES[country]
  const cityUrl = `${COM_ORIGIN}${market.pathPrefix}/${citySlug}`
  const url = `${COM_ORIGIN}${hoodPath(country, citySlug, hood.slug)}`
  const siblings = hoodsByCity(market.countryCode ?? '', hood.city).filter((n) => n.slug !== hood.slug)
  const metro = nearestWorldMetroStation(hood.lat, hood.lng)

  const crumbs = [
    { name: 'sivrce', href: 'https://sivrce.com/' },
    { name: countryName, href: `${COM_ORIGIN}${market.pathPrefix}` },
    { name: hood.city, href: cityUrl },
    { name: hood.en, href: url },
  ]
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Place',
        '@id': `${url}#place`,
        name: `${hood.en}, ${hood.city}`,
        address: {
          '@type': 'PostalAddress',
          addressCountry: market.countryCode ?? '',
          addressLocality: hood.city,
          addressRegion: hood.en,
        },
        geo: { '@type': 'GeoCoordinates', latitude: hood.lat, longitude: hood.lng },
      },
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: `${hood.en} real estate, ${hood.city}`,
        inLanguage: 'en',
        isPartOf: { '@id': `${COM_ORIGIN}/#website` },
        about: { '@id': `${url}#place` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: c.name,
          item: c.href,
        })),
      },
    ],
  }

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main>
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <nav className="mb-8 text-sm text-sv-muted" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1">
              {crumbs.map((c, i) => (
                <li key={c.href} className="flex items-center">
                  {i > 0 && <span className="mx-2 text-sv-muted/50">/</span>}
                  {i === crumbs.length - 1 ? (
                    <span className="text-sv-ink">{c.name}</span>
                  ) : (
                    <a href={c.href} className="hover:underline">{c.name}</a>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <h1 className="mb-3 text-3xl font-bold tracking-tight text-sv-ink sm:text-4xl">
            {hood.en} real estate — {hood.city}
          </h1>
          <p className="mb-6 text-lg text-sv-ink/70">{TYPE_LABEL[hood.type]} area in {hood.city}, {countryName}</p>

          <div className="mb-4">
            <Suspense fallback={null}>
              {/* ponytail: renders null when the city isn't in the map corpus — no guards needed. */}
              <WeatherBadge
                citySlug={citySlug}
                label={hood.en}
                lang="en"
                className="rounded-full border border-sv-ink/[0.06] bg-white px-3 py-1.5 text-sv-ink/60 shadow-sm"
              />
            </Suspense>
          </div>

          <dl className="mb-8 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div className="rounded-lg border border-sv-edge bg-white p-4 shadow-sm">
              <dt className="text-sv-muted">Avg. price</dt>
              <dd className="mt-1 font-semibold text-sv-ink">{priceLabel(hood)}</dd>
            </div>
            <div className="rounded-lg border border-sv-edge bg-white p-4 shadow-sm">
              <dt className="text-sv-muted">Walk score</dt>
              <dd className="mt-1 font-semibold text-sv-ink">{hood.walkScore ?? '—'}/100</dd>
            </div>
            <div className="rounded-lg border border-sv-edge bg-white p-4 shadow-sm">
              <dt className="text-sv-muted">Transit score</dt>
              <dd className="mt-1 font-semibold text-sv-ink">{hood.transitScore ?? '—'}/100</dd>
            </div>
            <div className="rounded-lg border border-sv-edge bg-white p-4 shadow-sm">
              <dt className="text-sv-muted">Nearest metro</dt>
              <dd className="mt-1 font-semibold text-sv-ink">
                {metro ? `${metro.name} · ${metro.walkMin} min walk` : '—'}
              </dd>
            </div>
          </dl>

          <section className="mb-8 rounded-lg border border-sv-edge bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-xl font-semibold text-sv-ink">Why {hood.en}</h2>
            <ul className="grid gap-2 text-sv-ink/80 sm:grid-cols-2">
              {hood.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sv-accent" />
                  {h}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-sv-muted">
              Price anchors reflect public market ranges at publish time — check the city search for current
              pricing. Georgian name: {hood.ka}.
            </p>
          </section>

          <Suspense fallback={null}>
            <MarketListings country={country} city={citySlug} label={`${hood.en} · ${hood.city}`} />
          </Suspense>

          {siblings.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-sv-ink">More areas in {hood.city}</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {siblings.map((n) => (
                  <a
                    key={n.slug}
                    href={`${COM_ORIGIN}${market.pathPrefix}/${citySlug}/${n.slug}`}
                    className="rounded-lg border border-sv-edge bg-white px-4 py-3 text-center transition hover:border-sv-accent hover:shadow-sm"
                  >
                    <span className="text-sm font-medium text-sv-ink hover:text-sv-accent">{n.en}</span>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
    </div>
  )
}
