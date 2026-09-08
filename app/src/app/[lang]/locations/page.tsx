import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, MapPin, Mountain } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { GEO_MUNICIPALITIES, GEO_REGIONS } from '@/data/georgia-locations'
import { villagesOf } from '@/data/georgia-villages'
import { jsonLd } from '@/lib/utils'
import {kaOnlyAlternates,  } from '@/lib/i18n/server'

const BASE = 'https://sivrce.ge'
const PATH = '/locations'

export const revalidate = 86400

const CITY_COUNT = new Set(Object.values(GEO_REGIONS).flatMap((r) => r.cities)).size
const VILLAGES_TOTAL = Object.keys(GEO_REGIONS).reduce(
  (n, r) => n + GEO_REGIONS[r]!.munis.reduce((k, m) => k + villagesOf(m).length, 0),
  0,
)
const REGION_VILLAGES: Record<string, number> = Object.fromEntries(
  Object.keys(GEO_REGIONS).map((r) => [
    r,
    GEO_REGIONS[r]!.munis.reduce((n, m) => n + villagesOf(m).length, 0),
  ]),
)

const TITLE = 'საქართველოს ყველა ლოკაცია — რეგიონები, ქალაქები, მუნიციპალიტეტები, სოფლები'
// ≤160 chars — Lighthouse/Google meta-description budget.
const DESCRIPTION =
  'საქართველოს სრული ლოკაციების კატალოგი: 12 რეგიონი, ყველა ქალაქი და მუნიციპალიტეტი, ' +
  '4 500-ზე მეტი სოფელი. იპოვე განცხადებები შენს ადგილას.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: kaOnlyAlternates(PATH),
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    url: `${BASE}${PATH}`,
    siteName: 'sivrce',
    locale: 'ka_GE',
    images: [{ url: '/images/og-brand.png', width: 1200, height: 630, alt: TITLE }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: ['/images/og-brand.png'] },
}

const REGION_ANCHOR: Record<string, string> = {
  'თბილისი': 'tbilisi',
  'აჭარა': 'achara',
  'გურია': 'guria',
  'იმერეთი': 'imereti',
  'კახეთი': 'kakheti',
  'მცხეთა-მთიანეთი': 'mtskheta-mtianeti',
  'რაჭა-ლეჩხუმი და ქვემო სვანეთი': 'racha',
  'სამეგრელო-ზემო სვანეთი': 'samegrelo',
  'სამცხე-ჯავახეთი': 'samtskhe',
  'ქვემო ქართლი': 'kvemo-kartli',
  'შიდა ქართლი': 'shida-kartli',
  'აფხაზეთი': 'abkhazia',
}

function locationsLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: TITLE,
        description: DESCRIPTION,
        url: `${BASE}${PATH}`,
        inLanguage: 'ka',
        isPartOf: { '@id': `${BASE}/#website` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'მთავარი', item: BASE },
          { '@type': 'ListItem', position: 2, name: 'ლოკაციები', item: `${BASE}${PATH}` },
        ],
      },
    ],
  }
}

export default function LocationsIndexPage() {
  const regions = Object.keys(GEO_REGIONS)
  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main" className="sv-pt-nav mx-auto max-w-[1440px] px-5 pb-20 md:px-10">
        <nav aria-label="ბრედკრამბი" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold text-sv-ink/60">
            <li>
              <Link href="/" className="transition-colors hover:text-sv-blue">
                მთავარი
              </Link>
            </li>
            <li className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-sv-ink/30" aria-hidden />
              <span aria-current="page" className="text-sv-ink/80">
                ლოკაციები
              </span>
            </li>
          </ol>
        </nav>

        <header className="mb-8">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-sv-blue/10 px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-sv-blue-deep">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            ლოკაციების კატალოგი
          </span>
          <h1 className="max-w-3xl text-balance text-[32px] font-black leading-[1.1] tracking-tight text-sv-ink md:text-[44px]">
            საქართველოს ყველა ლოკაცია ერთ სიაში
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] font-semibold leading-relaxed text-sv-ink/60">
            რეგიონები, ყველა ქალაქი და მუნიციპალიტეტი, ყველა სოფელი — აირჩიე ადგილი და ნახავ
            აქტიურ განცხადებებს.
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ['რეგიონი', regions.length],
              ['ქალაქი', CITY_COUNT],
              ['მუნიციპალიტეტი', GEO_MUNICIPALITIES.length],
              ['სოფელი', VILLAGES_TOTAL],
            ].map(([label, n]) => (
              <div key={label} className="rounded-module border border-sv-ink/[0.06] bg-sv-surface px-4 py-3">
                <dt className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-sv-ink/50">{label}</dt>
                <dd className="mt-0.5 text-[24px] font-black tabular-nums tracking-tight text-sv-ink">{n}</dd>
              </div>
            ))}
          </dl>
        </header>

        <nav
          aria-label="რეგიონები"
          className="sticky top-16 z-10 -mx-5 mb-8 border-y border-sv-ink/[0.06] bg-sv-cloud/90 px-5 py-2.5 backdrop-blur-md md:-mx-10 md:px-10"
        >
          <ul className="flex flex-wrap gap-1.5">
            {regions.map((r) => (
              <li key={r}>
                <a
                  href={`#${REGION_ANCHOR[r]}`}
                  className="inline-flex items-center rounded-full bg-sv-surface px-3 py-1.5 text-[12px] font-extrabold text-sv-ink/70 shadow-card transition-colors hover:text-sv-blue"
                >
                  {r}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-6">
          {regions.map((region) => {
            const { cities, munis } = GEO_REGIONS[region]!
            return (
              <section
                key={region}
                id={REGION_ANCHOR[region]}
                className="scroll-mt-32 rounded-tile border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card md:p-7"
              >
                <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-[22px] font-black tracking-tight text-sv-ink md:text-[26px]">{region}</h2>
                  <p className="text-[12px] font-bold text-sv-ink/50">
                    {cities.length} ქალაქი · {munis.length} მუნიციპალიტეტი · {REGION_VILLAGES[region]} სოფელი
                  </p>
                </div>

                {cities.length > 0 && (
                  <ul className="mb-4 flex flex-wrap gap-1.5" aria-label={`${region} — ქალაქები`}>
                    {cities.map((c) => (
                      <li key={c}>
                        <Link
                          href={`/search?city=${encodeURIComponent(c)}`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-sv-blue/[0.07] px-3 py-1.5 text-[13px] font-extrabold text-sv-blue-deep transition-colors hover:bg-sv-blue hover:text-white"
                        >
                          <MapPin className="h-3.5 w-3.5" aria-hidden />
                          {c}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                {munis.length > 0 && (
                  <ul className="grid gap-2 lg:grid-cols-2">
                    {munis.map((m) => {
                      const villages = villagesOf(m)
                      return (
                        <li key={m} className="rounded-module border border-sv-ink/[0.06] bg-sv-cloud/60">
                          <details className="group">
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                              <span className="min-w-0">
                                <span className="block truncate text-[14px] font-extrabold text-sv-ink">{m}</span>
                                <span className="mt-0.5 block text-[12px] font-bold text-sv-ink/50">
                                  {villages.length > 0 ? `${villages.length} სოფელი` : 'სოფლების გარეშე'}
                                </span>
                              </span>
                              <ChevronRight
                                className="h-4 w-4 shrink-0 text-sv-ink/30 transition-transform duration-300 group-open:rotate-90"
                                aria-hidden
                              />
                            </summary>
                            <div className="border-t border-sv-ink/[0.06] px-4 py-3">
                              {villages.length > 0 && (
                                <p className="text-[13px] font-semibold leading-[1.9] text-sv-ink/70">
                                  {villages.map((v) => (
                                    <a
                                      key={v}
                                      href={`/search?city=${encodeURIComponent(m)}&district=${encodeURIComponent(v)}`}
                                      className="transition-colors after:text-sv-ink/25 after:content-['·'] hover:text-sv-blue last:after:content-none"
                                    >
                                      {v}
                                    </a>
                                  ))}
                                </p>
                              )}
                              <Link
                                href={`/search?city=${encodeURIComponent(m)}`}
                                className="mt-2 inline-block text-[13px] font-extrabold text-sv-blue transition-colors hover:text-sv-blue-deep"
                              >
                                ყველა განცხადება {m} →
                              </Link>
                            </div>
                          </details>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>
            )
          })}
        </div>

        <p className="mt-8 flex items-start gap-2 text-[12px] font-semibold leading-relaxed text-sv-ink/40">
          <Mountain className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          კატალოგი: საქართველოს ოფიციალური ადმინისტრაციული დაყოფა · სოფლები — OpenStreetMap
          წვლილის შემქმნელები (ODbL).
        </p>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(locationsLd()) }} />
    </div>
  )
}
