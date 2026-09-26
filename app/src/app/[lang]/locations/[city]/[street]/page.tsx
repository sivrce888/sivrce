import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, LayoutGrid, MapPin, Search, TrendingUp } from 'lucide-react'
import { SparkMark } from '@/components/SparkMark'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import ListingCard from '@/components/ListingCard'
import { Chip } from '@/components/seo/SeoLanding'
import { formatUSD, type Listing } from '@/data/listings'
import { geoStreetBySlug, geoStreetsWithSlugs } from '@/data/georgia-streets'
import { CITIES } from '@/lib/directory-seo-lite'
import { getListingsOnStreet } from '@/lib/listings-db'
import { statsOf } from '@/lib/seo-pages'
import { jsonLd } from '@/lib/utils'
import { isValidLang, translateRaw, type Lang } from '@/lib/i18n/core'
import { kaOnlyAlternates, OG_LOCALE } from '@/lib/i18n/server'
import { readableName } from '@/lib/ka-latin'

const BASE = 'https://sivrce.ge'

export const revalidate = 300

/**
 * Regional street landings — /locations/{city}/{street}. Tbilisi lives under
 * /tbilisi/{district}/{street}; every other catalog city lands here with live
 * inventory (or an honest empty state, same as the Tbilisi pages).
 */

function resolve(citySlug: string, streetSlug: string) {
  const city = CITIES.find((c) => c.slug === citySlug && c.ka !== 'თბილისი')
  if (!city) return null
  const ka = geoStreetBySlug(city.ka, streetSlug)
  if (!ka) return null
  return { city, streetKa: ka, slug: streetSlug }
}

interface PageProps {
  params: Promise<{ lang: string; city: string; street: string }>
}

/** Compact copy table — ka canonical (kaOnlyAlternates), other locales read en. */
const C = {
  ka: {
    badge: 'გაყიდო სწორად — sivrce',
    h1: '{street}, {city}',
    descFull: '{n} აქტიური განცხადება {street}-ზე, {city}-ში. ფასები, ფართობები და სერთიფიცირებული განმცხადებლები — ერთ გვერდზე.',
    descEmpty: '{street}, {city}-ში — აქტიური განცხადებები, ფასების სტატისტიკა და მოქმედი შეთავაზებები. ახალი განცხადებები ვლინდება ავტომატურად.',
    statListings: 'განცხადება',
    statAvg: 'საშ. ფასი/მ²',
    statFrom: 'ფასი — დან',
    perM2: '/მ²',
    chipSearch: '{name} — ძებნა',
    chipCity: 'ყველა განცხადება {city}-ში',
    chipStreets: '{city}: ქუჩები',
    listingsAria: 'განცხადებები {street}-ზე',
    emptyTitle: 'ამ ქუჩაზე ჯერ არ არის განცხადებები',
    emptyBody: 'იყავი პირველი — გამოაქვეყნე უფასოდ, ან შეხედე მიმდინარე შეთავაზებებს {city}-ში.',
    introTitle: 'უძრავი ქონება {street}-ზე, {city}-ში',
    introFull: '{street} — {city}-ის ერთ-ერთი მოთხოვნადი მისამართი. ამ გვერდზე თავმოყრილია ყველა აქტიური განცხადება ქუჩაზე: ბინები, სახლები და კომერციული ფართები გამჭვირვალე ფასებით და მრ-ზე სტატისტიკით.',
    introEmpty: '{street} — {city}-ის მისამართია, სადაც განცხადებები ქრონიკულად ჩნდება. სivrce აჩვენებს ყველა ახალ განცხადებას ამ ქუჩაზე ავტომატურად — დაიმახსოვრე გვერდი ან დაამატე ძებნას.',
    faqHeading: 'ხშირი კითხვები',
    faq1q: 'რამდენი ღირს ბინა {street}-ზე, {city}-ში?',
    faq1aAvg: 'აქტიური განცხადებებით, საშუალო ფასი {street}-ზე არის {avg}/მ². ფასები იცვლება მდებარეობის, მდგომარეობისა და სართულის მიხედვით.',
    faq1a: 'ამჟამინდელი განცხადებები ამ ქუჩაზე ნახავთ ქვემოთ — ფასები განახლდება პირდაპირ ბაზრიდან.',
    faq2q: 'უსაფრთხოა თუ არა აქ ყიდვა/ყიდვა?',
    faq2a: 'sivrce ამოწმებს ყოველ განმცხადებელს — scam-რადარი და სერთიფიცირებული პროფილები ხელმისაწვდომია ყველა განცხადებაზე.',
    faq3q: 'როგორ გავყიდო ქონება {street}-ზე?',
    faq3a: 'დაამატე განცხადება უფასოდ — sivrce აჩვენებს მას ამ გვერდზეც და მთელი {city}-ის ძებნაში.',
    faqAria: 'ხშირად დასმული კითხვები',
    streetsHeading: '{city}: სხვა ქუჩები',
  },
  en: {
    badge: 'Sell right — sivrce',
    h1: '{street}, {city}',
    descFull: '{n} active listings on {street}, {city}. Prices, sizes and verified sellers on one page.',
    descEmpty: '{street} in {city} — active listings, price stats and current offers, updated automatically.',
    statListings: 'Listings',
    statAvg: 'Avg price/m²',
    statFrom: 'From',
    perM2: '/m²',
    chipSearch: 'Search {name}',
    chipCity: 'All listings in {city}',
    chipStreets: '{city} streets',
    listingsAria: 'Listings on {street}',
    emptyTitle: 'No listings on this street yet',
    emptyBody: 'Be first — publish for free, or browse current offers in {city}.',
    introTitle: 'Real estate on {street}, {city}',
    introFull: '{street} is one of the in-demand addresses in {city}. This page gathers every active listing on the street: apartments, houses and commercial spaces with transparent prices and per-m² stats.',
    introEmpty: '{street} is an address in {city} where listings appear regularly. sivrce shows every new listing on this street automatically — bookmark the page or save the search.',
    faqHeading: 'FAQ',
    faq1q: 'How much does an apartment on {street} in {city} cost?',
    faq1aAvg: 'Across active listings, the average price on {street} is {avg}/m². Prices vary by location, condition and floor.',
    faq1a: 'Current listings on this street are shown below — prices update straight from the market.',
    faq2q: 'Is buying here safe?',
    faq2a: 'sivrce checks every seller — scam radar and verified profiles are available on every listing.',
    faq3q: 'How do I sell property on {street}?',
    faq3a: 'Add a listing for free — sivrce shows it on this page and across all of {city} search.',
    faqAria: 'Frequently asked questions',
    streetsHeading: 'Other streets in {city}',
  },
} as const

type CopyLang = keyof typeof C

function cLang(lang: Lang): CopyLang {
  return lang === 'ka' ? 'ka' : 'en'
}

function nameOf(ka: string, lang: Lang): string {
  return readableName(ka, lang)
}

async function listingsOf(streetKa: string, cityKa: string): Promise<Listing[]> {
  try {
    return await getListingsOnStreet(streetKa, undefined, cityKa)
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang: rawLang, city: citySlug, street: streetSlug } = await params
  const lang = isValidLang(rawLang) ? rawLang : 'ka'
  const ctx = resolve(citySlug, streetSlug)
  if (!ctx) return {}
  const cl = cLang(lang)
  const c = C[cl]
  const street = nameOf(ctx.streetKa, lang)
  const city = nameOf(ctx.city.ka, lang)
  const listings = await listingsOf(ctx.streetKa, ctx.city.ka)
  const v = { street, city, n: listings.length }
  // page title pattern already carries "| sivrce" via the root title template
  const title = listings.length
    ? `${street}, ${city} — ${translateRaw('{n} {what}', { n: listings.length, what: cl === 'ka' ? 'განცხადება' : 'listings' })}`
    : `${street}, ${city}`
  return {
    title,
    description: translateRaw(listings.length ? c.descFull : c.descEmpty, v),
    alternates: kaOnlyAlternates(`/locations/${ctx.city.slug}/${ctx.slug}`),
    openGraph: {
      title,
      description: translateRaw(listings.length ? c.descFull : c.descEmpty, v),
      type: 'website',
      url: `${BASE}/locations/${ctx.city.slug}/${ctx.slug}`,
      siteName: 'sivrce',
      locale: OG_LOCALE[cl === 'ka' ? 'ka' : 'en'],
      images: [{ url: '/images/og-brand.png', width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description: translateRaw(listings.length ? c.descFull : c.descEmpty, v), images: ['/images/og-brand.png'] },
  }
}

function pageLd(
  cityKa: string,
  streetKa: string,
  slug: string,
  citySlug: string,
  listings: Listing[],
  faqs: { q: string; a: string }[],
  title: string,
  description: string,
) {
  const path = `/locations/${citySlug}/${slug}`
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: title,
        description,
        url: `${BASE}${path}`,
        isPartOf: { '@type': 'WebSite', name: 'sivrce', url: BASE },
        about: {
          '@type': 'Place',
          name: `${streetKa}, ${cityKa}`,
          containedInPlace: { '@type': 'City', name: cityKa },
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'sivrce', item: BASE },
          { '@type': 'ListItem', position: 2, name: cityKa, item: `${BASE}/locations/${citySlug}` },
          { '@type': 'ListItem', position: 3, name: streetKa, item: `${BASE}${path}` },
        ],
      },
      ...(listings.length
        ? [{
            '@type': 'ItemList',
            numberOfItems: listings.length,
            itemListElement: listings.slice(0, 20).map((l, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              url: `${BASE}${`/listing/${l.publicId ?? l.id}`}`,
              name: l.title,
            })),
          }]
        : []),
      { '@type': 'FAQPage', mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    ],
  }
}

export default async function LocationStreetPage({ params }: PageProps) {
  const { lang: rawLang, city: citySlug, street: streetSlug } = await params
  const lang = isValidLang(rawLang) ? rawLang : 'ka'
  const ctx = resolve(citySlug, streetSlug)
  if (!ctx) notFound()
  const cl = cLang(lang)
  const c = C[cl]
  const street = nameOf(ctx.streetKa, lang)
  const city = nameOf(ctx.city.ka, lang)
  const v = { street, city, n: 0 }

  const listings = await listingsOf(ctx.streetKa, ctx.city.ka)
  const stats = listings.length > 0 ? statsOf(listings) : null
  const description = translateRaw(listings.length ? c.descFull : c.descEmpty, { ...v, n: listings.length })
  const path = `/locations/${ctx.city.slug}/${ctx.slug}`

  const faqs = [
    {
      q: translateRaw(c.faq1q, v),
      a: stats?.avgPerM2 ? translateRaw(c.faq1aAvg, { ...v, avg: formatUSD(stats.avgPerM2) }) : translateRaw(c.faq1a, v),
    },
    { q: translateRaw(c.faq2q, v), a: translateRaw(c.faq2a, v) },
    { q: translateRaw(c.faq3q, v), a: translateRaw(c.faq3a, v) },
  ]

  const crumbs = [
    { name: 'sivrce', href: '/' },
    { name: city, href: `/search?city=${encodeURIComponent(ctx.city.ka)}` },
    { name: street, href: path },
  ]

  // Sibling street mesh — same-city catalog streets, this one excluded.
  const siblings = geoStreetsWithSlugs(ctx.city.ka)
    .filter((s) => s.slug !== ctx.slug)
    .slice(0, 12)

  const title = listings.length
    ? `${street}, ${city} — ${listings.length} ${cl === 'ka' ? 'განცხადება' : 'listings'}`
    : `${street}, ${city}`

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main" className="sv-pt-nav mx-auto max-w-[1440px] px-5 pb-20 md:px-10">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold text-sv-ink/60">
            {crumbs.map((cr, i) => (
              <li key={cr.href} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-sv-ink/30" aria-hidden />}
                {i === crumbs.length - 1 ? (
                  <span aria-current="page" className="text-sv-ink/80">{cr.name}</span>
                ) : (
                  <Link href={cr.href} className="transition-colors hover:text-sv-blue">{cr.name}</Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <header className="mb-8">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-sv-blue/10 px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-sv-blue-deep">
            <SparkMark className="h-3.5 w-3.5" aria-hidden /> {c.badge}
          </span>
          <h1 className="max-w-[900px] text-balance text-[30px] font-black tracking-[-0.02em] text-sv-ink md:text-[44px]">
            {translateRaw(c.h1, v)}
          </h1>
          <p className="mt-3 max-w-[720px] text-[15px] font-semibold text-sv-ink/60 md:text-[16px]">{description}</p>

          {stats && (
            <dl className="mt-6 flex flex-wrap gap-3">
              {[
                { icon: LayoutGrid, label: c.statListings, value: String(stats.count) },
                ...(stats.avgPerM2 ? [{ icon: TrendingUp, label: c.statAvg, value: `${formatUSD(stats.avgPerM2)}${c.perM2}` }] : []),
                { icon: MapPin, label: c.statFrom, value: formatUSD(stats.minPrice) },
              ].map((st) => (
                <div
                  key={st.label}
                  className="flex items-center gap-3 rounded-module border border-sv-ink/[0.06] bg-sv-surface px-4 py-3 shadow-card"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-control bg-sv-blue/10">
                    <st.icon className="h-4 w-4 text-sv-blue" aria-hidden />
                  </span>
                  <div>
                    <dd className="text-[16px] font-black text-sv-ink">{st.value}</dd>
                    <dt className="text-[11px] font-bold uppercase tracking-wide text-sv-ink/60">{st.label}</dt>
                  </div>
                </div>
              ))}
            </dl>
          )}
        </header>

        <div className="mb-8 flex flex-wrap gap-2">
          <Chip label={translateRaw(c.chipSearch, { name: street })} href={`/search?q=${encodeURIComponent(ctx.streetKa)}`} />
          <Chip label={translateRaw(c.chipCity, { city })} href={`/search?city=${encodeURIComponent(ctx.city.ka)}`} />
        </div>

        {listings.length > 0 ? (
          <section aria-label={translateRaw(c.listingsAria, v)} className="sv-card-grid">
            {listings.map((l, i) => (
              <ListingCard key={l.id} l={l} i={i} layout="wide" />
            ))}
          </section>
        ) : (
          <section className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 text-center shadow-card md:p-10">
            <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-module bg-sv-blue/10">
              <Search className="h-5 w-5 text-sv-blue" aria-hidden />
            </span>
            <h2 className="text-[20px] font-black tracking-[-0.02em] text-sv-ink md:text-[24px]">{c.emptyTitle}</h2>
            <p className="mx-auto mt-2 max-w-[520px] text-[14px] font-medium leading-relaxed text-sv-ink/60">
              {translateRaw(c.emptyBody, v)}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Chip label={translateRaw(c.chipCity, { city })} href={`/search?city=${encodeURIComponent(ctx.city.ka)}`} active />
            </div>
          </section>
        )}

        <section className="mt-14 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-10">
          <h2 className="text-[20px] font-black tracking-[-0.02em] text-sv-ink md:text-[24px]">
            {translateRaw(c.introTitle, v)}
          </h2>
          <p className="mt-3 max-w-[860px] text-[15px] font-medium leading-relaxed text-sv-ink/65">
            {translateRaw(listings.length ? c.introFull : c.introEmpty, v)}
          </p>
        </section>

        <section className="mt-10" aria-label={c.faqAria}>
          <h2 className="mb-5 text-[20px] font-black tracking-[-0.02em] text-sv-ink md:text-[24px]">{c.faqHeading}</h2>
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

        {siblings.length > 0 && (
          <section className="mt-10" aria-label={translateRaw(c.streetsHeading, v)}>
            <h2 className="mb-4 text-[18px] font-black tracking-[-0.02em] text-sv-ink md:text-[22px]">
              {translateRaw(c.streetsHeading, v)}
            </h2>
            <div className="flex flex-wrap gap-2">
              {siblings.map((s) => (
                <Chip key={s.slug} label={nameOf(s.ka, lang)} href={`/locations/${ctx.city.slug}/${s.slug}`} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(pageLd(ctx.city.ka, ctx.streetKa, ctx.slug, ctx.city.slug, listings, faqs, title, description)) }}
      />
    </div>
  )
}
