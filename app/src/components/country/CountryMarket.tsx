import type { Metadata } from 'next'
import { notFound, permanentRedirect, redirect } from 'next/navigation'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import MarketHome from '@/components/country/MarketHome'
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
  DE_HUB_DE,
  cityPack,
  type CountryCopy,
} from '@/lib/country-copy'
import DeMarketHome from '@/components/country/DeMarketHome'
import ProjectPage, { generateMetadata as projectPageMetadata } from '@/app/[lang]/projects/[slug]/page'
import { DE_CITIES } from '@/lib/countries/de'
import { getProject } from '@/data/professionals'

/** True when the slug targets a German-catalog project detail page. */
function deProjectSlug(country: PathCountryId, slug: string[] | undefined): string | null {
  if (country !== 'de' || slug?.[0] !== 'projects' || !slug?.[1]) return null
  const p = getProject(slug[1])
  return p && DE_CITIES.some((c) => c.ka === p.city) ? slug[1] : null
}

export const revalidate = 86400

type Slug = string[] | undefined

function publicPath(country: PathCountryId, slug: Slug): string {
  const prefix = MARKETS[country].pathPrefix
  if (!slug?.length) return prefix
  return `${prefix}/${slug.join('/')}`
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
  const found = copyFor(country, slug, lang)
  if (!found) return {}
  const path = publicPath(country, slug)
  // German copy exists for the DE hub + Berlin — those paths publish a /de/de
  // variant (self-canonical per locale, reciprocal hreflang).
  const hasDeCopy = country === 'de' && (!slug?.length || slug[0] === 'berlin')
  const url = lang === 'de' && hasDeCopy ? `${COM_ORIGIN}/de${path}` : `${COM_ORIGIN}${path}`
  const market = MARKETS[country]
  const languages: Record<string, string> = {
    en: `${COM_ORIGIN}${path}`,
    'x-default': `${COM_ORIGIN}${path}`,
    ...(hasDeCopy ? { de: `${COM_ORIGIN}/de${path}` } : {}),
  }
  if (country === 'ae') {
    languages.ar = `${COM_ORIGIN}/ar${path}`
  }
  return {
    // Copy strings already carry the "| sivrce" suffix; `absolute` stops the
    // layout template from appending a second one.
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

export default async function CountryPage({
  country,
  params,
}: {
  country: PathCountryId
  params: Promise<{ lang: string; slug?: string[] }>
}) {
  const { lang: raw, slug } = await params
  const lang: Lang = isValidLang(raw) ? raw : 'en'
  // German copy exists for hub + Berlin only — other cities and project pages
  // have no /de/de variant; send them to the English URL (not a soft-404).
  if (country === 'de' && lang === 'de' && slug?.length && slug[0] !== 'berlin') {
    redirect(`${MARKETS.de.pathPrefix}/${slug.join('/')}`)
  }
  const projectSlug = deProjectSlug(country, slug)
  if (projectSlug) {
    return <ProjectPage params={Promise.resolve({ lang, slug: projectSlug, market: 'de' })} />
  }
  if (slug?.[1] === 'sale' && slug[0]) {
    permanentRedirect(`/en${MARKETS[country].pathPrefix}/${slug[0]}/buy`)
  }
  const found = copyFor(country, slug, lang)
  if (!found) notFound()

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
          // City pages carry the catalog pin so the Place resolves to a point,
          // not just a country code. Hubs stay unpinned on purpose.
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
