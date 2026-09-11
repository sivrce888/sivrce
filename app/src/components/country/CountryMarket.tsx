import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { Reveal } from '@/components/Reveal'
import { jsonLd } from '@/lib/utils'
import { isValidLang, localizedHref, type Lang } from '@/lib/i18n/core'
import { COM_ORIGIN, canonicalIntent, MARKETS, type PathCountryId } from '@/lib/markets'
import {
  AE_CITIES_AR,
  AE_HUB_AR,
  COUNTRY_HUBS,
  COUNTRY_NAMES,
  cityPack,
  heroPair,
  type CountryCopy,
} from '@/lib/country-copy'
import { marketCenter } from '@/lib/geo-market'
import { mapHrefForPlace } from '@/lib/map/map-href'
import { cityBySlug } from '@/lib/map/user-place'
import DeMarketHome from '@/components/country/DeMarketHome'

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
    const hub = COUNTRY_HUBS[country]
    return hub ? { copy: hub, kind: 'hub' } : null
  }
  const [citySlug, intentRaw] = slug
  if (!citySlug || slug.length > 2) return null
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
  if (slug?.[1] === 'sale') {
    return {}
  }
  const found = copyFor(country, slug, lang)
  if (!found) return {}
  const path = publicPath(country, slug)
  const url = `${COM_ORIGIN}${path}`
  const market = MARKETS[country]
  const languages: Record<string, string> = {
    en: `${COM_ORIGIN}${path}`,
    'x-default': `${COM_ORIGIN}${path}`,
  }
  if (country === 'ae') {
    languages.ar = `${COM_ORIGIN}/ar${path}`
  }
  return {
    title: found.copy.title,
    description: found.copy.description,
    alternates: { canonical: url, languages },
    openGraph: {
      type: 'website',
      locale: lang === 'ar' ? 'ar_AE' : `en_${market.countryCode ?? 'US'}`,
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
  if (slug?.[1] === 'sale' && slug[0]) {
    permanentRedirect(`/en${MARKETS[country].pathPrefix}/${slug[0]}/buy`)
  }
  const found = copyFor(country, slug, lang)
  if (!found) notFound()

  // Germany runs the full marketplace home (rails, EUR, transfer-tax rules).
  // Other markets keep the thin hub until they carry inventory.
  if (country === 'de' && found.kind === 'hub') {
    return (
      <>
        <Navbar />
        <DeMarketHome copy={found.copy} />
        <Footer />
      </>
    )
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

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: found.copy.h1,
        description: found.copy.description,
        inLanguage: lang === 'ar' ? 'ar' : 'en',
        isPartOf: { '@id': `${COM_ORIGIN}/#website` },
        about: {
          '@type': 'Place',
          name: found.city ? (cityPack(country, found.city)?.name ?? found.city) : COUNTRY_NAMES[country],
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

  const cities = MARKETS[country].citySlugs.filter((s) => cityPack(country, s))
  const pack = found.city ? cityPack(country, found.city) : null
  const pair = heroPair(found.copy.h1)
  const pin = found.city ? cityBySlug(found.city) : null
  const cam = pin ?? marketCenter(country)
  const mapHref = localizedHref(mapHrefForPlace(cam.lat, cam.lng), lang)

  return (
    <>
      <Navbar />
      <main id="main">
        <PageHero
          kicker="sivrce"
          title={
            pair.place ? (
              <>
                <span className="block">{pair.lead}</span>
                <span className="text-gradient-blue">{pair.place}</span>
              </>
            ) : (
              found.copy.h1
            )
          }
          subtitle={found.copy.lede}
        >
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={mapHref}
              className="rounded-full bg-sv-orange px-5 py-2.5 text-[14px] font-extrabold text-sv-ink shadow-glow-orange"
            >
              3D map
            </Link>
            {pack?.buy && (
              <Link
                href={`/en${market.pathPrefix}/${found.city}/buy`}
                className="rounded-full bg-white/10 px-5 py-2.5 text-[14px] font-extrabold text-white ring-1 ring-white/15"
              >
                Buy
              </Link>
            )}
            {pack?.rent && (
              <Link
                href={`/en${market.pathPrefix}/${found.city}/rent`}
                className="rounded-full bg-white/10 px-5 py-2.5 text-[14px] font-extrabold text-white ring-1 ring-white/15"
              >
                Rent
              </Link>
            )}
            {found.kind === 'hub' &&
              cities.slice(0, 6).map((s) => {
                const p = cityPack(country, s)
                if (!p) return null
                return (
                  <Link
                    key={s}
                    href={`/en${market.pathPrefix}/${s}`}
                    className="rounded-full bg-white/10 px-4 py-2.5 text-[13px] font-extrabold text-white/90 ring-1 ring-white/12"
                  >
                    {p.name}
                  </Link>
                )
              })}
          </div>
        </PageHero>
        <div className="sv-container py-12">
          <nav aria-label="Breadcrumb" className="mb-8 text-[13px] font-semibold text-sv-ink/50">
            {crumbs.map((c, i) => (
              <span key={c.href}>
                {i > 0 ? <span className="px-2">/</span> : null}
                <a href={c.href} className="hover:text-sv-blue">{c.name}</a>
              </span>
            ))}
          </nav>
          <Reveal>
            <article className="speakable-lead max-w-3xl space-y-5 text-[16px] font-medium leading-relaxed text-sv-ink/80">
              {found.copy.body.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </article>
          </Reveal>
          {pack && found.kind === 'city' && (pack.buy || pack.rent) && (
            <div className="mt-10 flex flex-wrap gap-3">
              {pack.buy && (
                <Link
                  href={`/en${market.pathPrefix}/${found.city}/buy`}
                  className="rounded-full bg-sv-blue px-5 py-2.5 text-[14px] font-extrabold text-white"
                >
                  Buy in {pack.name}
                </Link>
              )}
              {pack.rent && (
                <Link
                  href={`/en${market.pathPrefix}/${found.city}/rent`}
                  className="rounded-full border border-sv-ink/10 px-5 py-2.5 text-[14px] font-extrabold text-sv-ink"
                >
                  Rent in {pack.name}
                </Link>
              )}
            </div>
          )}
          {found.kind === 'hub' && (
            <ul className="mt-12 grid gap-3 sm:grid-cols-2">
              {cities.map((s) => {
                const p = cityPack(country, s)
                if (!p) return null
                return (
                  <li key={s}>
                    <Link
                      href={`/en${market.pathPrefix}/${s}`}
                      className="block rounded-[22px] border border-sv-ink/8 bg-sv-surface px-5 py-4 font-extrabold text-sv-ink hover:border-sv-blue/30"
                    >
                      {p.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
          {found.copy.faqs.length > 0 && (
            <section className="mt-14 max-w-3xl">
              <h2 className="text-[22px] font-black tracking-tight text-sv-ink">FAQ</h2>
              <dl className="mt-6 space-y-6">
                {found.copy.faqs.map((f) => (
                  <div key={f.q}>
                    <dt className="font-extrabold text-sv-ink">{f.q}</dt>
                    <dd className="mt-2 text-[15px] font-medium text-sv-ink/75">{f.a}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
          <p className="mt-14 text-[13px] font-semibold text-sv-ink/45">
            All markets:{' '}
            <a href={`${COM_ORIGIN}/?worldwide=1`} className="text-sv-blue">sivrce.com</a>
            {' · '}
            Georgia marketplace:{' '}
            <a href="https://sivrce.ge/" className="text-sv-blue">sivrce.ge</a>
            {' · '}
            Prices and availability are published only when a verified listing exists.
            Market currency: {market.currency}.
          </p>
        </div>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
    </>
  )
}
