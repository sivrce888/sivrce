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
  METRO_LINES,
  METRO_RADIUS_M,
  getMetroStation,
  metroNeighbours,
  type MetroStation,
} from '@/data/tbilisi-metro'
import { getListingsNearMetro } from '@/lib/listings-db'
import { DISTRICTS, parseSeoSlug, statsOf, type District, type Faq } from '@/lib/seo-pages'
import { jsonLd } from '@/lib/utils'
import { listingPath } from '@/lib/listing-slug'
import {kaOnlyAlternates,  } from '@/lib/i18n/server'

const BASE = 'https://sivrce.ge'

export const revalidate = 300

function districtOf(station: MetroStation): District | undefined {
  return DISTRICTS.find((d) => d.slug === station.district && d.citySlug === 'tbilisi')
}

async function resolve(stationSlug: string) {
  const station = getMetroStation(stationSlug)
  if (!station) return null
  const listings = await getListingsNearMetro(station.lat, station.lng, METRO_RADIUS_M)
  return { station, listings }
}

interface PageProps {
  params: Promise<{ station: string }>
}

function titleOfStation(station: MetroStation, count: number): string {
  const base = `ბინები ${station.near}, თბილისში`
  return count > 0 ? `${base} — ${count} განცხადება` : `${base} — იყიდება და ქირავდება`
}

function descriptionOfStation(station: MetroStation, district: District | undefined, listings: Listing[]): string {
  const place = district ? `, ${district.loc}` : ''
  // ≤160 chars — Lighthouse/Google meta-description budget.
  if (listings.length === 0) {
    return (
      `ბინები ${station.near}${place} — იყიდება და ქირავდება. რეალური ფასები, AI შეფასება ` +
      `და პირდაპირი კონტაქტი მესაკუთრესთან sivrce-ზე.`
    )
  }
  const s = statsOf(listings)
  return (
    `${s.count} განცხადება ${station.near}${place} — ფასები ${formatUSD(s.minPrice)}-დან. ` +
    `AI ფასის შეფასება და პირდაპირი კონტაქტი მესაკუთრესთან sivrce-ზე.`
  )
}

/** Intro paragraph — unique per station via live stats; honest when empty. */
function introOfStation(station: MetroStation, district: District | undefined, listings: Listing[]): string {
  const line = METRO_LINES[station.line]
  if (listings.length === 0) {
    return (
      `„${station.ka}“ — მე-${station.line} ხაზის სადგური${district ? `, ${district.loc}` : ''}. ` +
      `ამ წამს სადგურის ფეხით მოსასვლელ რადიუსში აქტიური განცხადება არ არის, მაგრამ მარაგი ყოველდღე იცვლება — ` +
      `განცხადების გამოქვეყნებისთანავე აქ იხილავთ ფასს, ფოტოებს და AI შეფასებას. ამავე უბნის სრული მარაგი იხილეთ ` +
      `უბნის გვერდზე ან მეტროს სხვა სადგურებთან.`
    )
  }
  const s = statsOf(listings)
  const perM2 = s.avgPerM2 ? `, საშუალო კვადრატულის ფასი ${formatUSD(s.avgPerM2)}/მ²-ია` : ''
  return (
    `„${station.ka}“ — მე-${station.line} ხაზის სადგური (${line})${district ? `, ${district.loc}` : ''}. ` +
    `მეტრო თბილისში ერთადერთი ტრანსპორტია, რომელიც ტრაფიკს არ ექვემდებარება, ამიტომ სადგურთან ახლოს არსებული ბინები ` +
    `როგორც საცხოვრებლად, ისე ქირით მუდამ მოთხოვნადია. ამჟამად 15 წუთიან ფეხით მანძილზე ${s.count} აქტიური განცხადებაა: ` +
    `ფასები ${formatUSD(s.minPrice)}-დან ${formatUSD(s.maxPrice)}-მდე იცვლება${perM2}. ` +
    `ყველა განცხადება მოწმდება sivrce-ის ვერიფიკაციის სისტემით, AI კი თითოეულ ფასს ბაზრის რეალურ მაჩვენებლებთან ადარებს.`
  )
}

function faqsOfStation(station: MetroStation, listings: Listing[]): Faq[] {
  const s = listings.length > 0 ? statsOf(listings) : null
  return [
    {
      q: `რა ღირს ბინა ${station.near}?`,
      a: s
        ? s.avgPerM2
          ? `ამჟამად საშუალო ფასი ${formatUSD(s.avgPerM2)}/მ²-ია. ყველაზე ხელმისაწვდომი ვარიანტი ${formatUSD(s.minPrice)} ღირს, პრემიუმ სეგმენტი კი ${formatUSD(s.maxPrice)}-მდე აღწევს. AI ფასის შეფასება თითოეული განცხადების ბარათზე ჩანს.`
          : `ფასები ${formatUSD(s.minPrice)}-დან იწყება და ${formatUSD(s.maxPrice)}-მდე იცვლება. AI ფასის შეფასება თითოეული განცხადების ბარათზე ჩანს.`
        : `ფასი ბინის ფართზე, სართულზე, რემონტსა და სადგურამდე მანძილზეა დამოკიდებული. უბნის მიმდინარე ფასები დაათვალიერე უბნის გვერდზე, ხოლო კონკრეტული ბინის ღირებულებას თითოეული განცხადების AI შეფასება გიჩვენებს.`,
    },
    {
      q: `რატომ არის მოთხოვნადი ბინები ${station.near}?`,
      a: `მეტრო თბილისში ერთადერთი ტრანსპორტია, რომელიც გაცოცხლებულ ტრაფიკს არ ექვემდებარება — მგზავრობის დრო პროგნოზირებადია დღის ნებისმიერ საათზე. სწორედ ამიტომ ${station.near.replace(/მეტროსთან$/, 'მეტროს მახლობლად')} ბინები უფრო სწრაფად იყიდება და ქირავდება, ვიდრე იმავე უბნის სადგურისგან მოშორებული ნაწილები.`,
    },
    {
      q: `როგორ ვიპოვო ვერიფიცირებული განცხადებები ${station.near}?`,
      a: `ამ გვერდზე ნაჩვენებია სადგურიდან 15 წუთიან ფეხით მანძილზე არსებული ყველა აქტიური განცხადება. sivrce-ზე თითოეული განცხადება გადის მონაცემთა შემოწმებას: მესაკუთრის ვერიფიკაცია, ფოტოების ავთენტურობა და ფასის ბაზრის შედარება.`,
    },
    {
      q: `შემიძლია თუ არა უფასოდ განცხადების დამატება?`,
      a: `დიახ — sivrce-ზე განცხადების დამატება უფასოა. VIP პაკეტები (VIP, VIP+, SUPER VIP) განცხადებას ძიების თავში აჩვენებს და საშუალოდ 5-ჯერ მეტ ნახვას იძლევა.`,
    },
  ]
}

function stationLd(
  station: MetroStation,
  district: District | undefined,
  listings: Listing[],
  crumbs: { name: string; href: string }[],
  faqs: Faq[],
  title: string,
  description: string,
) {
  const path = `/metro/${station.slug}`
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
      {
        '@type': 'TransitStation',
        name: `${station.ka} — მეტროსადგური`,
        alternateName: `${station.en} Metro Station`,
        geo: { '@type': 'GeoCoordinates', latitude: station.lat, longitude: station.lng },
        containedInPlace: { '@type': 'City', name: 'თბილისი' },
        ...(district ? { address: { '@type': 'PostalAddress', addressRegion: district.ka, addressLocality: 'თბილისი', addressCountry: 'GE' } } : {}),
      },
      ...(listings.length > 0
        ? [
            {
              '@type': 'ItemList',
              numberOfItems: listings.length,
              itemListElement: listings.slice(0, 30).map((l, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                url: `${BASE}${listingPath(l)}`,
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { station: s } = await params
  const ctx = await resolve(s)
  if (!ctx) return {}
  const title = titleOfStation(ctx.station, ctx.listings.length)
  const description = descriptionOfStation(ctx.station, districtOf(ctx.station), ctx.listings)
  const path = `/metro/${ctx.station.slug}`
  return {
    title,
    description,
    alternates: kaOnlyAlternates(path),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${BASE}${path}`,
      siteName: 'sivrce',
      locale: 'ka_GE',
      images: [{ url: '/images/og-brand.png', width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: ['/images/og-brand.png'] },
  }
}

export default async function MetroStationPage({ params }: PageProps) {
  const { station: s } = await params
  const ctx = await resolve(s)
  if (!ctx) notFound()
  const { station, listings } = ctx
  const district = districtOf(station)
  const neighbours = metroNeighbours(station.slug)

  const stats = listings.length > 0 ? statsOf(listings) : null
  const faqs = faqsOfStation(station, listings)
  const title = titleOfStation(station, listings.length)
  const description = descriptionOfStation(station, district, listings)
  // District hub self-throttles (≥1 listing rule) — link only when it exists.
  const districtHub = district ? parseSeoSlug(['tbilisi', district.slug]) !== null : false

  const crumbs = [
    { name: 'მთავარი', href: '/' },
    { name: 'მეტრო', href: '/metro' },
    { name: station.ka, href: `/metro/${station.slug}` },
  ]

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main" className="sv-pt-nav mx-auto max-w-[1440px] px-5 pb-20 md:px-10">
        {/* Breadcrumbs */}
        <nav aria-label="ბრედკრამბი" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold text-sv-ink/60">
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
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-sv-blue/10 px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-sv-blue-deep">
            <SparkMark className="h-3.5 w-3.5" aria-hidden /> მე-{station.line} ხაზი · {METRO_LINES[station.line]}
          </span>
          <WeatherBadge
            coords={{ lat: station.lat, lng: station.lng }}
            label={station.ka}
            className="mb-3 ml-2 rounded-full border border-sv-ink/[0.06] bg-sv-surface px-3 py-1.5 text-sv-ink/60 shadow-card"
          />
          <h1 className="max-w-[900px] text-balance text-[30px] font-black tracking-[-0.02em] text-sv-ink md:text-[44px]">
            ბინები {station.near}
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
                { icon: MapPin, label: 'საწყისი ფასი', value: formatUSD(stats.minPrice) },
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
                    <dt className="text-[11px] font-bold uppercase tracking-wide text-sv-ink/60">{s.label}</dt>
                  </div>
                </div>
              ))}
            </dl>
          )}
        </header>

        {/* Link mesh — district hub, search, neighbours, metro index */}
        <div className="mb-8 flex flex-wrap gap-2">
          {districtHub && <Chip label={district!.ka} href={`/tbilisi/${district!.slug}`} />}
          <Chip label={`ძიება: ${station.ka}`} href={`/search?q=${encodeURIComponent(station.ka)}`} />
          <Chip
            label={`${station.ka} — ყველა განცხადება`}
            href={`/search?city=${encodeURIComponent('თბილისი')}&district=${encodeURIComponent(district?.ka ?? 'თბილისი')}`}
          />
          {neighbours.map((n) => (
            <Chip key={n.slug} label={`სადგური: ${n.ka}`} href={`/metro/${n.slug}`} />
          ))}
          <Chip label="ყველა სადგური" href="/metro" active />
        </div>

        {/* Listings */}
        {listings.length > 0 ? (
          <section aria-label="განცხადებები" className="sv-card-grid">
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
              სადგურთან ახლოს ჯერ განცხადება არ არის
            </h2>
            <p className="mx-auto mt-2 max-w-[520px] text-[14px] font-medium leading-relaxed text-sv-ink/60">
              მარაგი ყოველდღე იცვლება — მოძებნეთ ბინა ძიებით, დაათვალიერეთ მთლიანი უბანი ან მეზობელი სადგურები.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Chip label={`ძიება: ${station.ka}`} href={`/search?q=${encodeURIComponent(station.ka)}`} active />
              {district && <Chip label={`უბანი: ${district.ka}`} href={`/tbilisi/${district.slug}`} />}
              {neighbours.map((n) => (
                <Chip key={n.slug} label={n.ka} href={`/metro/${n.slug}`} />
              ))}
            </div>
          </section>
        )}

        {/* SEO intro */}
        <section className="mt-14 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-10">
          <h2 className="text-[20px] font-black tracking-[-0.02em] text-sv-ink md:text-[24px]">
            ბინები {station.near} — ბაზრის მიმოხილვა
          </h2>
          <p className="mt-3 max-w-[860px] text-[15px] font-medium leading-relaxed text-sv-ink/65">
            {introOfStation(station, district, listings)}
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
        dangerouslySetInnerHTML={{
          __html: jsonLd(stationLd(station, district, listings, crumbs, faqs, title, description)),
        }}
      />
    </div>
  )
}
