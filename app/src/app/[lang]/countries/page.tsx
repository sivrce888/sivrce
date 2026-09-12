import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Building2, Globe2, MapPin } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { jsonLd } from '@/lib/utils'
import { isValidLang } from '@/lib/i18n/core'
import { COM_ORIGIN, COUNTRY_IDS, MARKETS } from '@/lib/markets'
import { COUNTRY_NAMES } from '@/lib/country-copy'
import {
  discoveryCountryCodes,
  globalCountries,
  globalCoverage,
  globalOsStats,
} from '@/lib/countries/global-os'

/**
 * All-countries directory — the visible index of the Global OS.
 * Server-only, zero client JS, ISR. Deep hubs link out; pinned metros and
 * discovery countries render as text (no dead URLs — sitemap stays deep-only).
 * ponytail: ka/en copy, every other locale renders English (seo-page precedent).
 * Upgrade: per-locale hreflang alternates + footer cross-link.
 */
export const revalidate = 86400

export function generateStaticParams() {
  return [{ lang: 'ka' }, { lang: 'en' }]
}

const COPY = {
  ka: {
    title: 'მსოფლიოს ყველა ქვეყანა — უძრავი ქონება ერთ სივრცეში | sivrce',
    description:
      'SIVRCE Global OS: 249 ქვეყანა, ყველა მეტრო, დეველოპერები, პროექტები და მეტროს სადგურები — verified მონაცემები ერთ სივრცეში.',
    kicker: 'SIVRCE Global OS',
    h1: 'მსოფლიოს ყველა ქვეყანა',
    lede: 'თითოეული ქვეყანა: მეტროები, დეველოპერები, პროექტები, რენდერები და მეტრო — ცოცხალი verified მონაცემებიდან.',
    deep: 'ღია ბაზრები',
    deepSub: 'სრული გზამკვლევი: ქალაქები, ყიდვა/ქირა, ხარჯები და verified განცხადებები.',
    pinned: 'რუკაზე და ძიებაში',
    pinnedSub: 'დადასტურებული მეტრო-წერტილები — სრული გზამკვლევი იხსნება ინვენტარის მოსვლისთანავე.',
    discovery: 'ასევე იძებნება',
    discoverySub: 'ყველა სხვა ქვეყანა — ცოცხალი რუკა და ძიება მოთხოვნით, გამოგონილი წერტილების გარეშე.',
    cities: 'ქალაქი',
    developers: 'დეველოპერი',
    projects: 'პროექტი',
    metros: 'მეტრო',
    countries: 'ქვეყანა',
  },
  en: {
    title: 'All countries — real estate in one place | sivrce',
    description:
      'SIVRCE Global OS: 249 countries, every metro, developers, projects and metro stations — verified data in one place.',
    kicker: 'SIVRCE Global OS',
    h1: 'Every country, one OS',
    lede: 'Each country: metros, developers, projects, renders and transit — from live verified data.',
    deep: 'Open markets',
    deepSub: 'Full briefings: cities, buy/rent, purchase costs and verified listings.',
    pinned: 'On the map & in search',
    pinnedSub: 'Committed metro pins — full briefings unlock as inventory lands.',
    discovery: 'Also searchable',
    discoverySub: 'Every other country — live map & search on demand, zero invented pins.',
    cities: 'cities',
    developers: 'developers',
    projects: 'projects',
    metros: 'metros',
    countries: 'countries',
  },
} as const

type Copy = (typeof COPY)[keyof typeof COPY]

interface PageProps {
  params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang: raw } = await params
  if (!isValidLang(raw)) return {}
  const t: Copy = raw === 'ka' ? COPY.ka : COPY.en
  const url = `${COM_ORIGIN}/countries`
  return {
    title: t.title,
    description: t.description,
    alternates: { canonical: url, languages: { en: url, 'x-default': url } },
    openGraph: {
      title: t.title,
      description: t.description,
      type: 'website',
      url,
      siteName: 'sivrce',
      images: [{ url: '/images/og-brand.png', width: 1200, height: 630, alt: t.h1 }],
    },
    twitter: { card: 'summary_large_image', title: t.title, description: t.description },
  }
}

export default async function CountriesPage({ params }: PageProps) {
  const { lang: raw } = await params
  if (!isValidLang(raw)) notFound()
  const t: Copy = raw === 'ka' ? COPY.ka : COPY.en
  const stats = globalOsStats()
  const coverage = new Map(globalCoverage().rows.map((r) => [r.cc, r]))
  const countries = globalCountries()
  const deep = COUNTRY_IDS.map((id) => ({
    id,
    name: COUNTRY_NAMES[id],
    market: MARKETS[id],
    cov: coverage.get(MARKETS[id].countryCode ?? ''),
  }))
  const pinned = countries.filter((c) => !c.deep && c.cityCount > 0)
  const byCc = new Map(countries.map((c) => [c.cc, c]))
  const discovery = discoveryCountryCodes().map((cc) => byCc.get(cc)!)

  const facts = [
    { n: String(stats.isoCountries), label: t.countries },
    { n: String(stats.metros), label: t.metros },
    { n: String(stats.developers), label: t.developers },
    { n: String(stats.projects), label: t.projects },
  ]
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t.h1,
    description: t.description,
    url: `${COM_ORIGIN}/countries`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: deep.map((d, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: d.name,
        url: `${COM_ORIGIN}${d.market.pathPrefix}`,
      })),
    },
  }

  return (
    <div className="min-h-screen bg-sv-surface">
      <Navbar />
      <main id="main">
        <section className="bg-sv-cloud py-14 md:py-20">
          <div className="mx-auto max-w-[1440px] px-5 md:px-10">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-sv-blue/10 px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-sv-blue-deep dark:text-sv-blue-light">
              <Globe2 className="h-3.5 w-3.5" aria-hidden /> {t.kicker}
            </span>
            <h1 className="sv-h1 max-w-3xl text-sv-ink">{t.h1}</h1>
            <p className="mt-3 max-w-2xl text-[15px] font-semibold text-sv-ink/65 md:text-[16px]">
              {t.lede}
            </p>
            <dl className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {facts.map((f) => (
                <div
                  key={f.label}
                  className="flex flex-col rounded-card border border-sv-ink/[0.07] bg-sv-surface p-5 shadow-card"
                >
                  <dt className="order-2 mt-1 text-[13px] font-bold text-sv-ink/60">{f.label}</dt>
                  <dd className="order-1 text-[26px] font-black tracking-tight text-sv-ink md:text-[32px]">
                    {f.n}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="py-14 md:py-20">
          <div className="mx-auto max-w-[1440px] px-5 md:px-10">
            <h2 className="sv-h2 text-sv-ink">{t.deep}</h2>
            <p className="mt-2 max-w-2xl text-[15px] font-semibold text-sv-ink/65">{t.deepSub}</p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {deep.map((d) => (
                <li key={d.id}>
                  <Link
                    href={d.market.pathPrefix}
                    className="flex h-full flex-col gap-1 rounded-module border border-sv-ink/[0.07] bg-sv-surface px-5 py-4 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-sv-blue/30 hover:shadow-card-hover"
                  >
                    <span className="flex items-center gap-2 text-[15px] font-extrabold text-sv-ink">
                      <Building2 className="h-4 w-4 text-sv-blue" aria-hidden /> {d.name}
                    </span>
                    <span className="text-[12px] font-bold text-sv-ink/45">
                      {d.market.citySlugs.length} {t.cities} · {d.market.currency}
                      {d.cov ? ` · ${d.cov.developers} ${t.developers} · ${d.cov.projects} ${t.projects}` : ''}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-sv-cloud py-14 md:py-20">
          <div className="mx-auto max-w-[1440px] px-5 md:px-10">
            <h2 className="sv-h2 text-sv-ink">{t.pinned}</h2>
            <p className="mt-2 max-w-2xl text-[15px] font-semibold text-sv-ink/65">{t.pinnedSub}</p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pinned.map((c) => {
                const cov = coverage.get(c.cc)
                const label = raw === 'ka' ? c.names.ka : c.names.en
                return (
                  <li
                    key={c.cc}
                    className="rounded-module border border-sv-ink/[0.07] bg-sv-surface px-5 py-4 shadow-card"
                  >
                    <span className="flex items-center gap-2 text-[15px] font-extrabold text-sv-ink">
                      <MapPin className="h-4 w-4 text-sv-blue" aria-hidden /> {label}
                    </span>
                    <span className="mt-1 block text-[12px] font-bold leading-relaxed text-sv-ink/45">
                      {c.metros
                        .slice(0, 6)
                        .map((m) => (raw === 'ka' ? m.ka : m.en))
                        .join(' · ')}
                      {c.cityCount > 6 ? ` · +${c.cityCount - 6}` : ''}
                    </span>
                    {cov && (cov.developers > 0 || cov.projects > 0) ? (
                      <span className="mt-1 block text-[12px] font-bold text-sv-ink/45">
                        {cov.developers} {t.developers} · {cov.projects} {t.projects}
                      </span>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </div>
        </section>

        <section className="py-14 md:py-20">
          <div className="mx-auto max-w-[1440px] px-5 md:px-10">
            <h2 className="sv-h2 text-sv-ink">{t.discovery}</h2>
            <p className="mt-2 max-w-2xl text-[15px] font-semibold text-sv-ink/65">{t.discoverySub}</p>
            <p className="mt-6 text-[13px] font-semibold leading-loose text-sv-ink/55">
              {discovery.map((c) => (raw === 'ka' ? c.names.ka : c.names.en)).join(' · ')}
            </p>
          </div>
        </section>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
    </div>
  )
}
