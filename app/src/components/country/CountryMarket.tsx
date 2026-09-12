import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound, permanentRedirect, redirect } from 'next/navigation'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import MarketHome from '@/components/country/MarketHome'
import MarketListings from '@/components/country/MarketListings'
import { WeatherBadge } from '@/components/WeatherBadge'
import { jsonLd } from '@/lib/utils'
import { cityBySlug } from '@/lib/map/user-place'
import { isValidLang, type Lang } from '@/lib/i18n/core'
import { COM_ORIGIN, canonicalIntent, MARKETS, type PathCountryId } from '@/lib/markets'
import {
  AE_CITIES_AR,
  AE_HUB_AR,
  COUNTRY_HUBS,
  COUNTRY_NAMES,
  DE_BERLIN_BUY_DE,
  DE_BERLIN_HUB_DE,
  DE_BERLIN_RENT_DE,
  DE_HAMBURG_HUB_DE,
  DE_HUB_DE,
  DE_MUNICH_HUB_DE,
  cityPack,
  type CountryCopy,
} from '@/lib/country-copy'
import DeMarketHome from '@/components/country/DeMarketHome'
import HoodPage, { hoodMetadata } from '@/components/country/HoodPage'
import { hoodBySlug } from '@/data/world-neighborhoods'
import ProjectPage, { generateMetadata as projectPageMetadata } from '@/app/[lang]/projects/[slug]/page'
import { DE_CITIES } from '@/lib/countries/de'
import { getProject } from '@/data/professionals'
import { COUNTRIES, type WorldCountry } from '@/data/world-countries'
import type { WorldNeighborhood } from '@/data/world-neighborhoods'

/** True when the slug targets a German-catalog project detail page. */
function deProjectSlug(country: PathCountryId, slug: string[] | undefined): string | null {
  if (country !== 'de' || slug?.[0] !== 'projects' || !slug?.[1]) return null
  const p = getProject(slug[1])
  return p && DE_CITIES.some((c) => c.ka === p.city) ? slug[1] : null
}

export const revalidate = 86400

/** DE cities with a native German hub (no /buy /rent copy yet — mirrors the EN pack). */
const DE_HUB_ONLY_DE_CITIES = new Set(['munich', 'hamburg'])

type Slug = string[] | undefined

function publicPath(country: PathCountryId, slug: Slug): string {
  const prefix = MARKETS[country].pathPrefix
  if (!slug?.length) return prefix
  return `${prefix}/${slug.join('/')}`
}

/** Resolve a depth-2 hood path `/{cc}/{city}/{hood}` — intent + DE Berlin bezirk slugs stay excluded. */
function hoodFor(country: PathCountryId, slug: Slug): { citySlug: string; hood: WorldNeighborhood } | null {
  if (slug?.length !== 2) return null
  const [citySlug, hoodSlug] = slug
  if (hoodSlug === 'buy' || hoodSlug === 'rent' || hoodSlug === 'sale') return null
  if (country === 'de' && citySlug === 'berlin') return null // /de/berlin/[bezirk] route owns these
  const cc = MARKETS[country].countryCode
  const pack = cc ? cityPack(country, citySlug) : null
  if (!cc || !pack) return null
  const hood = hoodBySlug(cc, pack.name, hoodSlug)
  return hood ? { citySlug, hood } : null
}

function copyFor(
  country: PathCountryId,
  slug: Slug,
  lang: Lang,
): { copy: CountryCopy; kind: 'hub' | 'city' | 'intent'; city?: string; intent?: 'buy' | 'rent' } | null {
  if (!slug?.length) {
    if (country === 'ae' && lang === 'ar') return { copy: AE_HUB_AR, kind: 'hub' }
    if (country === 'de' && lang === 'de') return { copy: DE_HUB_DE, kind: 'hub' }
    const hub = COUNTRY_HUBS[country]
    return hub ? { copy: hub, kind: 'hub' } : null
  }
  const [citySlug, intentRaw] = slug
  if (!citySlug || slug.length > 2) return null
  if (country === 'de' && lang === 'de' && citySlug === 'berlin') {
    const intent = intentRaw ? canonicalIntent(intentRaw) : undefined
    if (!intentRaw) return { copy: DE_BERLIN_HUB_DE, kind: 'city', city: 'berlin' }
    if (intent === 'buy') return { copy: DE_BERLIN_BUY_DE, kind: 'intent', city: 'berlin', intent }
    if (intent === 'rent') return { copy: DE_BERLIN_RENT_DE, kind: 'intent', city: 'berlin', intent }
    return null
  }
  if (country === 'de' && lang === 'de' && !intentRaw && DE_HUB_ONLY_DE_CITIES.has(citySlug)) {
    return { copy: citySlug === 'munich' ? DE_MUNICH_HUB_DE : DE_HAMBURG_HUB_DE, kind: 'city', city: citySlug }
  }
  const pack = cityPack(country, citySlug)
  if (!pack) return null
  if (!intentRaw) {
    if (country === 'ae' && lang === 'ar' && AE_CITIES_AR[citySlug]) {
      return { copy: AE_CITIES_AR[citySlug]!, kind: 'city', city: citySlug }
    }
    return { copy: pack.hub, kind: 'city', city: citySlug }
  }
  const intent = canonicalIntent(intentRaw)
  if (!intent) return null
  const packIntent = intent === 'buy' ? pack.buy : pack.rent
  if (!packIntent) return null
  return { copy: packIntent, kind: 'intent', city: citySlug, intent }
}

export function countryStaticParams(country: PathCountryId) {
  const out: { slug?: string[] }[] = [{ slug: [] }]
  for (const c of MARKETS[country].citySlugs) {
    const pack = cityPack(country, c)
    if (!pack) continue
    out.push({ slug: [c] })
    if (pack.buy) out.push({ slug: [c, 'buy'] })
    if (pack.rent) out.push({ slug: [c, 'rent'] })
    // ponytail: hoods stay ISR-on-demand (dynamicParams) — prerendering 125+
    // hood pages pushed SSG over the 3GB heap ceiling; sitemap still drives discovery.
  }
  return out
}

export async function countryMetadata(
  country: PathCountryId,
  params: Promise<{ lang: string; slug?: string[] }>,
): Promise<Metadata> {
  const { lang: raw, slug } = await params
  const lang: Lang = isValidLang(raw) ? raw : 'en'
  const projectSlug = deProjectSlug(country, slug)
  if (projectSlug) {
    return projectPageMetadata({ params: Promise.resolve({ lang, slug: projectSlug, market: 'de' }) })
  }
  if (slug?.[1] === 'sale') {
    return {}
  }
  const hoodHit = hoodFor(country, slug)
  if (hoodHit) return hoodMetadata(country, hoodHit.citySlug, hoodHit.hood)
  const found = copyFor(country, slug, lang)
  if (!found) {
    // Generic metadata for countries without custom copy
    const wc = COUNTRIES.find((c) => c.cc === MARKETS[country].countryCode)
    if (!wc) return {}
    const path = publicPath(country, slug)
    const url = `${COM_ORIGIN}${path}`
    const title = slug?.length
      ? `${wc.en} real estate — ${slug[0].replace(/-/g, ' ')} | sivrce`
      : `${wc.en} real estate | sivrce`
    return {
      title: { absolute: title },
      description: wc.realEstateNote,
      alternates: { canonical: url, languages: { en: url, 'x-default': url } },
      openGraph: {
        type: 'website',
        locale: 'en_US',
        url,
        siteName: 'sivrce',
        title,
        description: wc.realEstateNote,
        images: [{ url: '/images/og-brand.png', width: 1200, height: 630, alt: title }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description: wc.realEstateNote,
        images: ['/images/og-brand.png'],
      },
      robots: { index: true, follow: true },
    }
  }
  const path = publicPath(country, slug)
  const url = `${COM_ORIGIN}${path}`
  const market = MARKETS[country]
  const languages: Record<string, string> = {
    en: `${COM_ORIGIN}${path}`,
    'x-default': `${COM_ORIGIN}${path}`,
  }
  if (
    country === 'de' &&
    (!slug?.length || slug[0] === 'berlin' || (slug.length === 1 && DE_HUB_ONLY_DE_CITIES.has(slug[0])))
  ) {
    languages.de = `${COM_ORIGIN}/de${path}`
  }
  if (country === 'ae') {
    languages.ar = `${COM_ORIGIN}/ar${path}`
  }
  return {
    title: { absolute: found.copy.title },
    description: found.copy.description,
    alternates: { canonical: url, languages },
    openGraph: {
      type: 'website',
      locale: lang === 'ar' ? 'ar_AE' : lang === 'de' ? 'de_DE' : `en_${market.countryCode ?? 'US'}`,
      url,
      siteName: 'sivrce',
      title: found.copy.title,
      description: found.copy.description,
      images: [{ url: '/images/og-brand.png', width: 1200, height: 630, alt: found.copy.h1 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: found.copy.title,
      description: found.copy.description,
      images: ['/images/og-brand.png'],
    },
    robots: { index: true, follow: true },
  }
}

/** Find a world country by its 2-letter ISO code. */
function worldCountry(cc: string): WorldCountry | undefined {
  return COUNTRIES.find((c) => c.cc === cc)
}

/** Country hub page for countries without custom copy. */
function GenericCountryPage({
  country,
  wc,
  slug,
}: {
  country: PathCountryId
  wc: WorldCountry
  slug: string[] | undefined
  lang: Lang
}) {
  const market = MARKETS[country]
  const isHub = !slug?.length
  const citySlug = slug?.[0]
  const cityName = citySlug
    ? citySlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : null

  const path = publicPath(country, slug)
  const url = `${COM_ORIGIN}${path}`

  const crumbs = [
    { name: 'sivrce', href: 'https://sivrce.com/' },
    { name: wc.en, href: `${COM_ORIGIN}${market.pathPrefix}` },
  ]
  if (cityName) {
    crumbs.push({ name: cityName, href: url })
  }

  const h1 = cityName
    ? `${cityName} real estate — ${wc.en}`
    : `${wc.en} real estate`

  const description = wc.realEstateNote

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: h1,
        description,
        inLanguage: 'en',
        isPartOf: { '@id': `${COM_ORIGIN}/#website` },
        about: {
          '@type': 'Place',
          name: cityName ?? wc.en,
          address: { '@type': 'PostalAddress', addressCountry: market.countryCode },
        },
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

  const ldScript = <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />

  const displayCities = wc.cities.slice(0, 8)
  const cityLock =
    citySlug && (market.citySlugs.includes(citySlug) || wc.cities.includes(citySlug))
      ? citySlug
      : undefined
  const intent = slug?.[1] === 'buy' || slug?.[1] === 'rent' ? slug[1] : undefined

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

        <h1 className="mb-6 text-3xl font-bold tracking-tight text-sv-ink sm:text-4xl">
          {h1}
        </h1>

        <div className="mb-4 flex items-center gap-3">
          <Suspense fallback={null}>
            {/* ponytail: renders null when the city isn't in the map corpus — no guards needed. */}
            <WeatherBadge
              citySlug={cityLock ?? market.defaultCitySlug}
              label={cityName ?? wc.capital}
              lang="en"
              className="rounded-full border border-sv-ink/[0.06] bg-white px-3 py-1.5 text-sv-ink/60 shadow-sm"
            />
          </Suspense>
        </div>

        <div className="mb-8 rounded-lg border border-sv-edge bg-white p-6 shadow-sm">
          <p className="mb-4 text-sv-ink/80 leading-relaxed">{description}</p>
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="font-medium text-sv-muted">Currency</dt>
              <dd className="mt-1 text-sv-ink">{wc.currency} ({wc.currencySymbol})</dd>
            </div>
            <div>
              <dt className="font-medium text-sv-muted">Language</dt>
              <dd className="mt-1 text-sv-ink">{wc.languages.join(', ')}</dd>
            </div>
            <div>
              <dt className="font-medium text-sv-muted">Population</dt>
              <dd className="mt-1 text-sv-ink">{wc.population.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="font-medium text-sv-muted">Capital</dt>
              <dd className="mt-1 text-sv-ink">{wc.capital.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</dd>
            </div>
            <div>
              <dt className="font-medium text-sv-muted">Region</dt>
              <dd className="mt-1 text-sv-ink">{wc.subregion}</dd>
            </div>
            <div>
              <dt className="font-medium text-sv-muted">Drive side</dt>
              <dd className="mt-1 text-sv-ink capitalize">{wc.driveSide}</dd>
            </div>
          </dl>
        </div>
        </div>

        <Suspense fallback={null}>
          <MarketListings country={country} city={cityLock} intent={intent} />
        </Suspense>

        <div className="mx-auto max-w-4xl px-4 pb-12 sm:px-6 lg:px-8">
        {displayCities.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-sv-ink">
              {isHub ? `Major cities in ${wc.en}` : `More cities in ${wc.en}`}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {displayCities.map((city) => {
                const cityPath = `${market.pathPrefix}/${city}`
                return (
                  <a
                    key={city}
                    href={`${COM_ORIGIN}${cityPath}`}
                    className="group rounded-lg border border-sv-edge bg-white px-4 py-3 text-center transition hover:border-sv-accent hover:shadow-sm"
                  >
                    <span className="text-sm font-medium text-sv-ink group-hover:text-sv-accent">
                      {city.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                  </a>
                )
              })}
            </div>
          </section>
        )}

        <section className="mb-8 rounded-lg border border-sv-edge bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-xl font-semibold text-sv-ink">
            Real estate in {wc.en}
          </h2>
          <p className="text-sv-ink/80 leading-relaxed">
            {wc.realEstateNote}
          </p>
          <p className="mt-4 text-sm text-sv-muted">
            sivrce.com{market.pathPrefix} is the canonical {wc.en} URL.
          </p>
        </section>
        </div>
      </main>
      <Footer />
      {ldScript}
    </div>
  )
}

export default async function CountryPage({
  country,
  params,
}: {
  country: PathCountryId
  params: Promise<{ lang: string; slug?: string[] }>
}) {
  const { lang: raw, slug } = await params
  const lang: Lang = isValidLang(raw) ? raw : 'en'
  // German copy exists for hub + Berlin (incl. buy/rent) and a Munich/Hamburg
  // hub-only page — everything else (other cities, project pages, Munich/
  // Hamburg buy or rent) has no /de/de variant; send it to the English URL
  // instead of a language-mismatched soft-404.
  if (
    country === 'de' &&
    lang === 'de' &&
    slug?.length &&
    slug[0] !== 'berlin' &&
    !(slug.length === 1 && DE_HUB_ONLY_DE_CITIES.has(slug[0]))
  ) {
    redirect(`${MARKETS.de.pathPrefix}/${slug.join('/')}`)
  }
  const projectSlug = deProjectSlug(country, slug)
  if (projectSlug) {
    return <ProjectPage params={Promise.resolve({ lang, slug: projectSlug, market: 'de' })} />
  }
  if (slug?.[1] === 'sale' && slug[0]) {
    permanentRedirect(`/en${MARKETS[country].pathPrefix}/${slug[0]}/buy`)
  }
  // One platform: /{cc}/search is the product search scoped to that market,
  // not a marketing page. 302 — search itself is noindex.
  if (slug?.[0] === 'search') {
    const iso = MARKETS[country].countryCode
    if (iso) redirect(`/search?country=${iso}`)
  }
  const hoodHit = hoodFor(country, slug)
  if (hoodHit) return <HoodPage country={country} citySlug={hoodHit.citySlug} hood={hoodHit.hood} />
  const found = copyFor(country, slug, lang)

  // Generic page for countries without custom copy
  if (!found) {
    const cc = MARKETS[country].countryCode
    if (!cc) notFound()
    const wc = worldCountry(cc)
    if (!wc) notFound()
    // No soft-404s: a generic URL must name a real city (market set or world
    // facts) and at most one known intent segment.
    const citySlug = slug?.[0]
    const cityOk =
      !citySlug ||
      MARKETS[country].citySlugs.includes(citySlug) ||
      wc.cities.includes(citySlug)
    const intent = slug?.[1]
    const intentOk =
      !intent ||
      (slug?.length === 2 &&
        !!citySlug &&
        (intent === 'buy' || intent === 'rent') &&
        MARKETS[country].intentCities.includes(citySlug))
    if (!cityOk || !intentOk || (slug?.length ?? 0) > 2) notFound()
    return <GenericCountryPage country={country} wc={wc} slug={slug} lang={lang} />
  }

  const path = publicPath(country, slug)
  const url = `${COM_ORIGIN}${path}`
  const market = MARKETS[country]
  const crumbs = [
    { name: 'sivrce', href: 'https://sivrce.com/' },
    { name: COUNTRY_NAMES[country], href: `${COM_ORIGIN}${market.pathPrefix}` },
  ]
  if (found.city) {
    const pack = cityPack(country, found.city)
    crumbs.push({
      name: pack?.name ?? found.city,
      href: `${COM_ORIGIN}${market.pathPrefix}/${found.city}`,
    })
  }
  if (found.intent) {
    crumbs.push({ name: found.intent === 'buy' ? 'Buy' : 'Rent', href: url })
  }

  const pin = found.city ? cityBySlug(found.city) : null

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: found.copy.h1,
        description: found.copy.description,
        inLanguage: lang === 'ar' ? 'ar' : lang === 'de' ? 'de' : 'en',
        isPartOf: { '@id': `${COM_ORIGIN}/#website` },
        about: {
          '@type': 'Place',
          name: found.city ? (cityPack(country, found.city)?.name ?? found.city) : COUNTRY_NAMES[country],
          address: { '@type': 'PostalAddress', addressCountry: market.countryCode },
          ...(pin ? { geo: { '@type': 'GeoCoordinates', latitude: pin.lat, longitude: pin.lng } } : {}),
        },
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
      ...(found.copy.faqs.length
        ? [{
            '@type': 'FAQPage',
            mainEntity: found.copy.faqs.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }]
        : []),
    ],
  }

  const ldScript = <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />

  if (country === 'de') {
    return (
      <div className="min-h-screen bg-sv-cloud">
        <Navbar />
        <DeMarketHome copy={found.copy} city={found.city} intent={found.intent} lang={lang} />
        <Footer />
        {ldScript}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <MarketHome
        country={country}
        copy={found.copy}
        city={found.city}
        intent={found.intent}
        lang={lang}
        crumbs={crumbs}
      />
      <Footer />
      {ldScript}
    </div>
  )
}
