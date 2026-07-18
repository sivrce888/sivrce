import type { Metadata } from 'next'
import Link from 'next/link'
import LocalizedLink from '@/components/LocalizedLink'
import { ChevronRight, MapPin, TrendingUp, LayoutGrid } from 'lucide-react'
import { SparkMark } from '@/components/SparkMark'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import ListingCard from '@/components/ListingCard'
import { WeatherBadge } from '@/components/WeatherBadge'
import { formatUSD } from '@/data/listings'
import { DISTRICT_COORDS, streetsOfDistrict } from '@/data/tbilisi-streets'
import { jsonLd } from '@/lib/utils'
import { langAlternates } from '@/lib/i18n/server'
import {
  dealLabel,
  h1Of,
  titleOf,
  descriptionOf,
  introOf,
  faqsOf,
  statsOf,
  breadcrumbsOf,
  linkChipsOf,
  locPrefix,
  cityProseOf,
  type SeoLoc,
  type SeoPageDef,
} from '@/lib/seo-pages'

const BASE = 'https://sivrce.ge'

/** Page-chrome strings per locale (content copy lives in lib/seo-pages). */
const UI = {
  ka: {
    badge: 'AI შეფასებით',
    listings: 'განცხადება',
    avg: 'საშუალო ფასი',
    from: 'ფასი დაწყება',
    crumbAria: 'ბრედკრამბი',
    gridAria: 'განცხადებები',
    overview: 'ბაზრის მიმოხილვა',
    faq: 'ხშირად დასმული კითხვები',
  },
  en: {
    badge: 'AI priced',
    listings: 'listings',
    avg: 'average price',
    from: 'from',
    crumbAria: 'Breadcrumb',
    gridAria: 'Listings',
    overview: 'market overview',
    faq: 'Frequently asked questions',
  },
  ru: {
    badge: 'AI-оценка',
    listings: 'объявлений',
    avg: 'средняя цена',
    from: 'от',
    crumbAria: 'Хлебные крошки',
    gridAria: 'Объявления',
    overview: 'обзор рынка',
    faq: 'Частые вопросы',
  },
} as const

const OG_LOCALE: Record<SeoLoc, string> = { ka: 'ka_GE', en: 'en_US', ru: 'ru_RU' }

export function seoMetadata(def: SeoPageDef, loc: SeoLoc, urlPrefix: string = locPrefix(loc)): Metadata {
  // city-info: curated title — "გორი — უძრავი ქონება, ფასები, გზამკვლევი | sivrce"
  // (avoids the "0 განცხადება" suffix that titleOf would emit for empty listings).
  const isCityInfo = def.kind === 'city-info' && def.city
  const placeName = isCityInfo
    ? (loc === 'ka' ? def.city!.ka : loc === 'en' ? def.city!.en : def.city!.ru)
    : ''
  const title = isCityInfo
    ? (loc === 'ka'
        ? `${placeName} — უძრავი ქონება, ფასები, გზამკვლევი`
        : loc === 'en'
          ? `${placeName} — Real Estate, Prices & Area Guide`
          : `${placeName} — недвижимость, цены и гид`)
    : titleOf(def, loc)
  const description = isCityInfo ? (cityProseOf(def.city!.slug)?.lede ?? '') : descriptionOf(def, loc)
  const url = `${urlPrefix}${def.path}`
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: langAlternates(def.path),
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${BASE}${url}`,
      siteName: 'sivrce',
      locale: OG_LOCALE[loc],
      images: [{ url: '/images/og.jpg', width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: ['/images/og.jpg'] },
  }
}

function seoLd(def: SeoPageDef, loc: SeoLoc, p: string = locPrefix(loc)) {
  const crumbs = breadcrumbsOf(def, loc, p)
  // city-info: Place + TouristDestination + Breadcrumb. No ItemList (empty)
  // and no FAQPage (faqsOf needs listings). The prose carries the entity.
  if (def.kind === 'city-info' && def.city) {
    const prose = cityProseOf(def.city.slug)
    const placeName = loc === 'ka' ? def.city.ka : loc === 'en' ? def.city.en : def.city.ru
    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Place',
          name: placeName,
          description: prose?.lede,
          url: `${BASE}${p}${def.path}`,
          inLanguage: loc,
          address: { '@type': 'PostalAddress', addressCountry: 'GE', addressLocality: placeName },
          ...(prose?.coords && {
            geo: { '@type': 'GeoCoordinates', latitude: prose.coords.lat, longitude: prose.coords.lng },
          }),
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: crumbs.map((c, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: c.name,
            item: `${BASE}${c.href}`,
          })),
        },
      ],
    }
  }
  const faqs = faqsOf(def, loc)
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: titleOf(def, loc),
        description: descriptionOf(def, loc),
        url: `${BASE}${p}${def.path}`,
        inLanguage: loc,
        isPartOf: { '@id': `${BASE}/#website` },
      },
      {
        '@type': 'ItemList',
        numberOfItems: def.listings.length,
        itemListElement: def.listings.slice(0, 30).map((l, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${BASE}${p}/listing/${l.id}`,
          name: l.title,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: c.name,
          item: `${BASE}${c.href}`,
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  }
}

export function Chip({ label, href, active }: { label: string; href: string; active?: boolean }) {
  return (
    <LocalizedLink
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-extrabold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue ${
        active
          ? 'bg-sv-blue text-white shadow-glow-blue-sm'
          : 'border border-sv-ink/10 bg-sv-surface text-sv-ink/70 hover:border-sv-blue/40 hover:text-sv-blue'
      }`}
    >
      {label}
    </LocalizedLink>
  )
}

export default function SeoLanding({
  def,
  loc,
  urlPrefix = locPrefix(loc),
}: {
  def: SeoPageDef
  loc: SeoLoc
  /** URL prefix for internal links — differs from loc when a non-ka/en/ru locale falls back to English copy. */
  urlPrefix?: string
}) {
  const ui = UI[loc]
  const stats = statsOf(def.listings)
  const crumbs = breadcrumbsOf(def, loc, urlPrefix)
  const chips = linkChipsOf(def, loc, urlPrefix)
  const faqs = faqsOf(def, loc)
  const h1 = h1Of(def, loc)
  // city-info pages: no listings yet, just curated prose. Hide the empty
  // grid + FAQ and substitute a long-form guide instead of a thin shell.
  const isCityInfo = def.kind === 'city-info'
  const cityProse = isCityInfo && def.city ? cityProseOf(def.city.slug) : null

  // Tbilisi district extras: live weather badge + street-level link mesh (ka only).
  const tbilisiDistrict = def.district?.citySlug === 'tbilisi' ? def.district : undefined
  const distCoords = tbilisiDistrict ? DISTRICT_COORDS[tbilisiDistrict.slug] : undefined
  const districtStreets =
    loc === 'ka' && tbilisiDistrict ? streetsOfDistrict(tbilisiDistrict.slug).slice(0, 24) : []

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main" className="mx-auto max-w-[1440px] px-5 pb-20 pt-24 md:px-10 md:pt-28">
        {/* Breadcrumbs */}
        <nav aria-label={ui.crumbAria} className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold text-sv-ink/50">
            {crumbs.map((c, i) => (
              <li key={c.href} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-sv-ink/30" aria-hidden />}
                {i === crumbs.length - 1 ? (
                  <span aria-current="page" className="text-sv-ink/80">{c.name}</span>
                ) : (
                  <Link href={c.href} className="transition-colors hover:text-sv-blue">
                    {c.name}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-sv-blue/10 px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-sv-blue">
            <SparkMark className="h-3.5 w-3.5" aria-hidden /> {ui.badge}
          </span>
          {tbilisiDistrict && distCoords && (
            <WeatherBadge
              coords={distCoords}
              label={tbilisiDistrict.ka}
              className="mb-3 ml-2 rounded-full border border-sv-ink/[0.06] bg-sv-surface px-3 py-1.5 text-sv-ink/60 shadow-card"
            />
          )}
          <h1 className="max-w-[900px] text-balance text-[30px] font-black tracking-[-0.02em] text-sv-ink md:text-[44px]">
            {h1}
          </h1>
          <p className="mt-3 max-w-[720px] text-[15px] font-semibold text-sv-ink/60 md:text-[16px]">
            {isCityInfo && cityProse ? cityProse.lede : descriptionOf(def, loc)}
          </p>

          {/* Live stats — hidden on city-info pages (no listings to report) */}
          {!isCityInfo && (
            <dl className="mt-6 flex flex-wrap gap-3">
              {[
                { icon: LayoutGrid, label: ui.listings, value: String(stats.count) },
                ...(stats.avgPerM2
                  ? [{ icon: TrendingUp, label: ui.avg, value: `${formatUSD(stats.avgPerM2)}/მ²` }]
                  : []),
                { icon: MapPin, label: ui.from, value: formatUSD(stats.minPrice) },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-3 rounded-module border border-sv-ink/[0.06] bg-sv-surface px-4 py-3 shadow-card"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-control bg-sv-blue/10">
                    <s.icon className="h-4 w-4 text-sv-blue" aria-hidden />
                  </span>
                  <div>
                    <dd className="text-[16px] font-black text-sv-ink">{s.value}</dd>
                    <dt className="text-[11px] font-bold uppercase tracking-wide text-sv-ink/45">{s.label}</dt>
                  </div>
                </div>
              ))}
            </dl>
          )}
        </header>

        {/* Filter chips — internal link mesh */}
        {(chips.dealSwitch || chips.types.length > 1 || chips.rooms.length > 1 || chips.geo.length > 0) && (
          <div className="mb-8 space-y-3">
            {chips.dealSwitch && (
              <div className="flex flex-wrap gap-2">
                <Chip label={dealLabel(def.dealSlug!, loc)} href={`${urlPrefix}${def.path}`} active />
                <Chip label={chips.dealSwitch.label} href={chips.dealSwitch.href} />
              </div>
            )}
            {chips.types.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {chips.types.map((t) => (
                  <Chip key={t.href} label={t.label} href={t.href} active={t.active} />
                ))}
              </div>
            )}
            {chips.rooms.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {chips.rooms.map((r) => (
                  <Chip key={r.href} label={r.label} href={r.href} active={r.active} />
                ))}
              </div>
            )}
            {chips.geo.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {chips.geo.map((g) => (
                  <Chip key={g.href} label={g.label} href={g.href} active={g.active} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Listings — hidden on city-info (no inventory yet) */}
        {!isCityInfo && (
          <section aria-label={ui.gridAria} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {def.listings.map((l, i) => (
              <ListingCard key={l.id} l={l} i={i} />
            ))}
          </section>
        )}

        {/* District streets — street-level SEO link mesh (ka only) */}
        {districtStreets.length > 0 && tbilisiDistrict && (
          <section className="mt-10" aria-label={`ქუჩები ${tbilisiDistrict.loc}`}>
            <h2 className="mb-5 text-[20px] font-black tracking-[-0.02em] text-sv-ink md:text-[24px]">
              ქუჩები {tbilisiDistrict.loc}
            </h2>
            <div className="flex flex-wrap gap-2">
              {districtStreets.map((s) => (
                <Chip key={s.slug} label={s.ka} href={`/tbilisi/${tbilisiDistrict.slug}/${s.slug}`} />
              ))}
              <Chip label="ყველა ქუჩა" href="/tbilisi/kuchebi" />
            </div>
          </section>
        )}

        {/* City-info prose (inventory-light city) — replaces the market-overview
            block with curated long-form prose so every city page is unique. */}
        {isCityInfo && cityProse ? (
          <section className="mt-14 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-10">
            <h2 className="text-[24px] font-black tracking-[-0.02em] text-sv-ink md:text-[28px]">
              {def.city![loc === 'ka' ? 'ka' : loc]}
            </h2>
            <p className="mt-4 max-w-[860px] text-[16px] font-semibold leading-[1.8] text-sv-ink/80">
              {cityProse.lede}
            </p>
            {cityProse.body.map((para, i) => (
              <p key={i} className="mt-4 max-w-[860px] text-[15px] font-medium leading-[1.75] text-sv-ink/65">
                {para}
              </p>
            ))}
          </section>
        ) : (
          /* SEO intro — only on pages with listings */
          <section className="mt-14 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-10">
            <h2 className="text-[20px] font-black tracking-[-0.02em] text-sv-ink md:text-[24px]">
              {h1} — {ui.overview}
            </h2>
            <p className="mt-3 max-w-[860px] text-[15px] font-medium leading-relaxed text-sv-ink/65">
              {introOf(def, loc)}
            </p>
          </section>
        )}

        {/* FAQ — skipped on city-info (faqsOf needs listings for live stats) */}
        {!isCityInfo && (
          <section className="mt-10" aria-label={ui.faq}>
            <h2 className="mb-5 text-[20px] font-black tracking-[-0.02em] text-sv-ink md:text-[24px]">
              {ui.faq}
            </h2>
            <div className="grid gap-3">
              {faqs.map((f) => (
                <details
                  key={f.q}
                  className="group rounded-module border border-sv-ink/[0.06] bg-sv-surface px-5 py-4 shadow-card open:shadow-card-hover"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-extrabold text-sv-ink [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <ChevronRight className="h-4 w-4 shrink-0 text-sv-blue transition-transform duration-300 group-open:rotate-90" aria-hidden />
                  </summary>
                  <p className="mt-3 text-[14px] font-medium leading-relaxed text-sv-ink/60">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(seoLd(def, loc, urlPrefix)) }} />
    </div>
  )
}
