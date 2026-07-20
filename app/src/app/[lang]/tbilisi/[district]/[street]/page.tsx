import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, LayoutGrid, MapPin, Search, TrendingUp } from 'lucide-react'
import { SparkMark } from '@/components/SparkMark'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import ListingCard from '@/components/ListingCard'
import { WeatherBadge } from '@/components/WeatherBadge'
import { Chip } from '@/components/seo/SeoLanding'
import { formatUSD, type Listing } from '@/data/listings'
import {
  DISTRICT_COORDS,
  STREETS,
  getStreet,
  streetLocative,
  type TbilisiStreet,
} from '@/data/tbilisi-streets'
import { getListingsOnStreet } from '@/lib/listings-db'
import { DISTRICTS, parseSeoSlug, statsOf, type District, type Faq } from '@/lib/seo-pages'
import { jsonLd } from '@/lib/utils'
import { langAlternates } from '@/lib/i18n/server'

const BASE = 'https://sivrce.ge'

/** Tbilisi districts only — street pages live under /tbilisi/{district}/{street}. */
function tbilisiDistrictOf(slug: string): District | undefined {
  return DISTRICTS.find((d) => d.slug === slug && d.citySlug === 'tbilisi')
}

async function resolve(districtSlug: string, streetSlug: string) {
  const district = tbilisiDistrictOf(districtSlug)
  const street = getStreet(streetSlug)
  if (!district || !street || street.district !== district.slug) return null
  // Live inventory only — mock LISTINGS inflated SEO stats.
  let listings: Listing[] = []
  try {
    listings = await getListingsOnStreet(street.ka, district.ka)
  } catch {
    listings = []
  }
  return { district, street, listings }
}

export function generateStaticParams() {
  // ponytail: prerender ka only (today's build surface) — other locales SSR on
  // demand via dynamicParams. Upgrade path: per-locale SSG when build budget allows.
  return STREETS.filter((s) => s.district !== undefined).map((s) => ({
    lang: 'ka',
    district: s.district!,
    street: s.slug,
  }))
}

interface PageProps {
  params: Promise<{ district: string; street: string }>
}

function titleOfStreet(street: TbilisiStreet, district: District, count: number): string {
  const base = `ბინები ${streetLocative(street.ka)}, ${district.loc}`
  return count > 0 ? `${base} — ${count} განცხადება` : `${base} — იყიდება და ქირავდება`
}

function descriptionOfStreet(street: TbilisiStreet, district: District, listings: Listing[]): string {
  const loc = streetLocative(street.ka)
  if (listings.length === 0) {
    return (
      `ბინები ${loc}, ${district.loc}, თბილისში: იყიდება და ქირავდება, ფასები და ახალი პროექტები. ` +
      `მოძებნეთ ბინა ${street.ka}-ზე sivrce-ის ვერიფიცირებული განცხადებებით — AI ფასის შეფასებით და პირდაპირი კონტაქტით მესაკუთრესთან.`
    )
  }
  const s = statsOf(listings)
  const perM2 = s.avgPerM2 ? ` საშუალო ფასი ${formatUSD(s.avgPerM2)}/მ².` : ''
  return (
    `იყიდება და ქირავდება ბინები ${loc}, ${district.loc}, თბილისში — ${s.count} ვერიფიცირებული განცხადება ` +
    `sivrce-ზე.${perM2} ფასები ${formatUSD(s.minPrice)}-დან ${formatUSD(s.maxPrice)}-მდე. ` +
    `AI ფასის შეფასება, 3D რუკა, პირდაპირი კონტაქტი მესაკუთრესთან.`
  )
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { district: d, street: s } = await params
  const ctx = await resolve(d, s)
  if (!ctx) return {}
  const title = titleOfStreet(ctx.street, ctx.district, ctx.listings.length)
  const description = descriptionOfStreet(ctx.street, ctx.district, ctx.listings)
  const path = `/tbilisi/${ctx.district.slug}/${ctx.street.slug}`
  return {
    title,
    description,
    alternates: { canonical: path, languages: langAlternates(path) },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${BASE}${path}`,
      siteName: 'sivrce',
      locale: 'ka_GE',
      images: [{ url: '/images/og.jpg', width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: ['/images/og.jpg'] },
  }
}

/** Intro paragraph — unique per street via live stats; honest when empty. */
function introOfStreet(street: TbilisiStreet, district: District, listings: Listing[]): string {
  if (listings.length === 0) {
    return (
      `${street.ka} ${district.loc} — ამ წამს ქუჩაზე აქტიური განცხადება არ არის, მაგრამ მარაგი ყოველდღე იცვლება ` +
      `და ახალი ბინები ხშირად სწორედ ასეთ, მშვიდ ქუჩებზე ჩნდება პირველად. მოძებნეთ ბინა ძიებით ან დაათვალიერეთ ` +
      `${district.loc} სხვა ქუჩები — განცხადების გამოქვეყნებისთანავე იხილავთ ფასს, ფოტოებს და AI შეფასებას.`
    )
  }
  const s = statsOf(listings)
  const perM2 = s.avgPerM2 ? `, საშუალო კვადრატულის ფასი ${formatUSD(s.avgPerM2)}/მ²-ია` : ''
  return (
    `${street.ka} — ${district.loc} ერთ-ერთი მოთხოვნადი მისამართია როგორც ყიდვისთვის, ისე ქირისთვის. ` +
    `ამჟამად ქუჩაზე ${s.count} აქტიური განცხადებაა: ფასები ${formatUSD(s.minPrice)}-დან ${formatUSD(s.maxPrice)}-მდე იცვლება${perM2}. ` +
    `ყველა განცხადება მოწმდება sivrce-ის ვერიფიკაციის სისტემით, AI კი თითოეულ ფასს ბაზრის რეალურ მაჩვენებლებთან ადარებს — ` +
    `ასე მყიდველიც და მოიჯარეც ერთ სივრცეში პოულობს საუკეთესო ვარიანტს.`
  )
}

function faqsOfStreet(street: TbilisiStreet, district: District, listings: Listing[]): Faq[] {
  const loc = streetLocative(street.ka)
  const s = listings.length > 0 ? statsOf(listings) : null
  return [
    {
      q: `რა ღირს ბინა ${loc}?`,
      a: s
        ? s.avgPerM2
          ? `ამჟამად საშუალო ფასი ${formatUSD(s.avgPerM2)}/მ²-ია. ყველაზე ხელმისაწვდომი ვარიანტი ${formatUSD(s.minPrice)} ღირს, პრემიუმ სეგმენტი კი ${formatUSD(s.maxPrice)}-მდე აღწევს. AI ფასის შეფასება თითოეული განცხადების ბარათზე ჩანს.`
          : `ფასები ${formatUSD(s.minPrice)}-დან იწყება და ${formatUSD(s.maxPrice)}-მდე იცვლება. AI ფასის შეფასება თითოეული განცხადების ბარათზე ჩანს.`
        : `ფასი ბინის ფართზე, სართულზე, რემონტსა და კორპუსის მდებარეობაზეა დამოკიდებული. ${district.loc} მიმდინარე ფასები დაათვალიერეთ უბნის გვერდზე, ხოლო კონკრეტული ბინის ღირებულებას თითოეული განცხადების AI შეფასება გაჩვენებს.`,
    },
    {
      q: `როგორ ვიპოვო ვერიფიცირებული განცხადებები ${loc}?`,
      a: `ჩაწერეთ ძიებაში „${street.ka}" ან აირჩიეთ უბანი — ${district.ka}. sivrce-ზე ყველა განცხადება გადის მონაცემთა შემოწმებას: მესაკუთრის ვერიფიკაცია, ფოტოების ავთენტურობა და ფასის ბაზრის შედარება.`,
    },
    {
      q: `შემიძლია თუ არა უფასოდ განცხადების დამატება?`,
      a: `დიახ — sivrce-ზე განცხადების დამატება უფასოა. VIP პაკეტები (VIP, VIP+, SUPER VIP) განცხადებას ძიების თავში აჩვენებს და საშუალოდ 5-ჯერ მეტ ნახვას იძლევა.`,
    },
  ]
}

function streetLd(
  street: TbilisiStreet,
  district: District,
  listings: Listing[],
  crumbs: { name: string; href: string }[],
  faqs: Faq[],
  title: string,
  description: string,
) {
  const path = `/tbilisi/${district.slug}/${street.slug}`
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: title,
        description,
        url: `${BASE}${path}`,
        inLanguage: 'ka',
        isPartOf: { '@id': `${BASE}/#website` },
      },
      ...(listings.length > 0
        ? [
            {
              '@type': 'ItemList',
              numberOfItems: listings.length,
              itemListElement: listings.slice(0, 30).map((l, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                url: `${BASE}/listing/${l.id}`,
                name: l.title,
              })),
            },
          ]
        : []),
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

export default async function StreetPage({ params }: PageProps) {
  const { district: d, street: s } = await params
  const ctx = await resolve(d, s)
  if (!ctx) notFound()
  const { district, street, listings } = ctx

  const loc = streetLocative(street.ka)
  const stats = listings.length > 0 ? statsOf(listings) : null
  const faqs = faqsOfStreet(street, district, listings)
  const title = titleOfStreet(street, district, listings.length)
  const description = descriptionOfStreet(street, district, listings)
  const coords = DISTRICT_COORDS[district.slug]
  // District hub self-throttles (≥1 listing rule) — link only when it exists.
  const districtHub = parseSeoSlug(['tbilisi', district.slug]) !== null

  const crumbs = [
    { name: 'მთავარი', href: '/' },
    { name: 'თბილისი', href: '/tbilisi' },
    ...(districtHub ? [{ name: district.ka, href: `/tbilisi/${district.slug}` }] : []),
    { name: street.ka, href: `/tbilisi/${district.slug}/${street.slug}` },
  ]

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main" className="mx-auto max-w-[1440px] px-5 pb-20 pt-24 md:px-10 md:pt-28">
        {/* Breadcrumbs */}
        <nav aria-label="ბრედკრამბი" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold text-sv-ink/50">
            {crumbs.map((c, i) => (
              <li key={c.href} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-sv-ink/30" aria-hidden />}
                {i === crumbs.length - 1 ? (
                  <span aria-current="page" className="text-sv-ink/80">
                    {c.name}
                  </span>
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
            <SparkMark className="h-3.5 w-3.5" aria-hidden /> AI შეფასებით
          </span>
          {coords && (
            <WeatherBadge
              coords={coords}
              label={district.ka}
              className="mb-3 ml-2 rounded-full border border-sv-ink/[0.06] bg-sv-surface px-3 py-1.5 text-sv-ink/60 shadow-card"
            />
          )}
          <h1 className="max-w-[900px] text-balance text-[30px] font-black tracking-[-0.02em] text-sv-ink md:text-[44px]">
            ბინები {loc}
          </h1>
          <p className="mt-3 max-w-[720px] text-[15px] font-semibold text-sv-ink/60 md:text-[16px]">{description}</p>

          {/* Live stats — only with real inventory */}
          {stats && (
            <dl className="mt-6 flex flex-wrap gap-3">
              {[
                { icon: LayoutGrid, label: 'განცხადება', value: String(stats.count) },
                ...(stats.avgPerM2
                  ? [{ icon: TrendingUp, label: 'საშუალო ფასი', value: `${formatUSD(stats.avgPerM2)}/მ²` }]
                  : []),
                { icon: MapPin, label: 'ფასი დაწყება', value: formatUSD(stats.minPrice) },
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

        {/* Link mesh — district hub + search + streets directory */}
        <div className="mb-8 flex flex-wrap gap-2">
          {districtHub && <Chip label={district.ka} href={`/tbilisi/${district.slug}`} />}
          <Chip label={`ძიება: ${street.ka}`} href={`/search?q=${encodeURIComponent(street.ka)}`} />
          <Chip
            label={`${district.ka} — ყველა განცხადება`}
            href={`/search?city=${encodeURIComponent('თბილისი')}&district=${encodeURIComponent(district.ka)}`}
          />
          <Chip label="თბილისის ქუჩები" href="/tbilisi/kuchebi" />
        </div>

        {/* Listings */}
        {listings.length > 0 ? (
          <section aria-label="განცხადებები" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((l, i) => (
              <ListingCard key={l.id} l={l} i={i} layout="wide" />
            ))}
          </section>
        ) : (
          <section className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 text-center shadow-card md:p-10">
            <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-module bg-sv-blue/10">
              <Search className="h-5 w-5 text-sv-blue" aria-hidden />
            </span>
            <h2 className="text-[20px] font-black tracking-[-0.02em] text-sv-ink md:text-[24px]">
              ამ ქუჩაზე ჯერ განცხადება არ არის
            </h2>
            <p className="mx-auto mt-2 max-w-[520px] text-[14px] font-medium leading-relaxed text-sv-ink/60">
              მარაგი ყოველდღე იცვლება — მოძებნეთ ბინა ძიებით ან დაათვალიერეთ მთლიანი უბანი.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Chip label={`ძიება: ${street.ka}`} href={`/search?q=${encodeURIComponent(street.ka)}`} active />
              {districtHub && <Chip label={`უბანი: ${district.ka}`} href={`/tbilisi/${district.slug}`} />}
            </div>
          </section>
        )}

        {/* SEO intro */}
        <section className="mt-14 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-10">
          <h2 className="text-[20px] font-black tracking-[-0.02em] text-sv-ink md:text-[24px]">
            ბინები {loc} — ბაზრის მიმოხილვა
          </h2>
          <p className="mt-3 max-w-[860px] text-[15px] font-medium leading-relaxed text-sv-ink/65">
            {introOfStreet(street, district, listings)}
          </p>
        </section>

        {/* FAQ */}
        <section className="mt-10" aria-label="ხშირად დასმული კითხვები">
          <h2 className="mb-5 text-[20px] font-black tracking-[-0.02em] text-sv-ink md:text-[24px]">
            ხშირად დასმული კითხვები
          </h2>
          <div className="grid gap-3">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-module border border-sv-ink/[0.06] bg-sv-surface px-5 py-4 shadow-card open:shadow-card-hover"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-extrabold text-sv-ink [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-sv-blue transition-transform duration-300 group-open:rotate-90"
                    aria-hidden
                  />
                </summary>
                <p className="mt-3 text-[14px] font-medium leading-relaxed text-sv-ink/60">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(streetLd(street, district, listings, crumbs, faqs, title, description)) }}
      />
    </div>
  )
}
