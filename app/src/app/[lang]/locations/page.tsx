import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, MapPin, Mountain } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { GEO_MUNICIPALITIES, GEO_REGIONS } from '@/data/georgia-locations'
import { villagesOf } from '@/data/georgia-villages'
import { cityName } from '@/lib/directory-seo-lite'
import { jsonLd } from '@/lib/utils'
import { isValidLang, translateRaw, type Lang } from '@/lib/i18n/core'
import { kaOnlyAlternates, OG_LOCALE } from '@/lib/i18n/server'

const BASE = 'https://sivrce.ge'
const PATH = '/locations'

export const revalidate = 86400

/** Catalog keys are ka — EN/RU labels for the 12 official regions (de → en). */
const REGION_LABELS: Record<string, { en: string; ru: string }> = {
  'თბილისი': { en: 'Tbilisi', ru: 'Тбилиси' },
  'აჭარა': { en: 'Adjara', ru: 'Аджария' },
  'გურია': { en: 'Guria', ru: 'Гурия' },
  'იმერეთი': { en: 'Imereti', ru: 'Имеретия' },
  'კახეთი': { en: 'Kakheti', ru: 'Кахетия' },
  'მცხეთა-მთიანეთი': { en: 'Mtskheta-Mtianeti', ru: 'Мцхета-Мтианети' },
  'რაჭა-ლეჩხუმი და ქვემო სვანეთი': { en: 'Racha-Lechkhumi and Kvemo Svaneti', ru: 'Рача-Лечхуми и Квемо Сванети' },
  'სამეგრელო-ზემო სვანეთი': { en: 'Samegrelo-Zemo Svaneti', ru: 'Самегрело-Верхняя Сванетия' },
  'სამცხე-ჯავახეთი': { en: 'Samtskhe-Javakheti', ru: 'Самцхе-Джавахети' },
  'ქვემო ქართლი': { en: 'Kvemo Kartli', ru: 'Квемо Картли' },
  'შიდა ქართლი': { en: 'Shida Kartli', ru: 'Шида Картли' },
  'აფხაზეთი': { en: 'Abkhazia', ru: 'Абхазия' },
}

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

/** On-page copy per locale — {var}/{plural:one|other} templates resolved via translateRaw. */
interface Copy {
  title: string
  description: string
  ariaCrumbs: string
  crumbHome: string
  crumbLocations: string
  badge: string
  h1: string
  lead: string
  statRegion: string
  statCity: string
  statMunicipality: string
  statVillage: string
  regionsNavAria: string
  sumCities: string
  sumMunis: string
  sumVillages: string
  citiesAria: string
  villagesCount: string
  noVillages: string
  allListingsIn: string
  footnote: string
}

// ka strings verbatim; canonicals stay ka (kaOnlyAlternates) — this localizes the visit, not the index.
const C: Record<'ka' | 'en' | 'ru' | 'de', Copy> = {
  ka: {
    title: 'საქართველოს ყველა ლოკაცია — რეგიონები, ქალაქები, მუნიციპალიტეტები, სოფლები',
    description:
      'საქართველოს სრული ლოკაციების კატალოგი: 12 რეგიონი, ყველა ქალაქი და მუნიციპალიტეტი, 4 500-ზე მეტი სოფელი. იპოვე განცხადებები შენს ადგილას.',
    ariaCrumbs: 'ბრედკრამბი',
    crumbHome: 'მთავარი',
    crumbLocations: 'ლოკაციები',
    badge: 'ლოკაციების კატალოგი',
    h1: 'საქართველოს ყველა ლოკაცია ერთ სიაში',
    lead: 'რეგიონები, ყველა ქალაქი და მუნიციპალიტეტი, ყველა სოფელი — აირჩიე ადგილი და ნახავ აქტიურ განცხადებებს.',
    statRegion: 'რეგიონი',
    statCity: 'ქალაქი',
    statMunicipality: 'მუნიციპალიტეტი',
    statVillage: 'სოფელი',
    regionsNavAria: 'რეგიონები',
    sumCities: '{n} ქალაქი',
    sumMunis: '{n} მუნიციპალიტეტი',
    sumVillages: '{n} სოფელი',
    citiesAria: '{region} — ქალაქები',
    villagesCount: '{n} სოფელი',
    noVillages: 'სოფლების გარეშე',
    allListingsIn: 'ყველა განცხადება {m} →',
    footnote:
      'კატალოგი: საქართველოს ოფიციალური ადმინისტრაციული დაყოფა · სოფლები — OpenStreetMap წვლილის შემქმნელები (ODbL).',
  },
  en: {
    title: 'All locations in Georgia — regions, cities, municipalities, villages',
    description:
      'The complete directory of locations in Georgia: 12 regions, every city and municipality, more than 4,500 villages. Find listings in your place.',
    ariaCrumbs: 'Breadcrumb',
    crumbHome: 'Home',
    crumbLocations: 'Locations',
    badge: 'Location directory',
    h1: 'Every location in Georgia in one list',
    lead: 'Regions, every city and municipality, every village — pick a place and see active listings.',
    statRegion: 'Region',
    statCity: 'City',
    statMunicipality: 'Municipality',
    statVillage: 'Village',
    regionsNavAria: 'Regions',
    sumCities: '{n} {plural:city|cities}',
    sumMunis: '{n} {plural:municipality|municipalities}',
    sumVillages: '{n} {plural:village|villages}',
    citiesAria: '{region} — cities',
    villagesCount: '{n} {plural:village|villages}',
    noVillages: 'No villages',
    allListingsIn: 'All listings in {m} →',
    footnote: 'Directory: official administrative divisions of Georgia · villages — OpenStreetMap contributors (ODbL).',
  },
  ru: {
    title: 'Все локации Грузии — регионы, города, муниципалитеты, сёла',
    description:
      'Полный каталог локаций Грузии: 12 регионов, все города и муниципалитеты, более 4 500 сёл. Найдите объявления в вашем месте.',
    ariaCrumbs: 'Навигация',
    crumbHome: 'Главная',
    crumbLocations: 'Локации',
    badge: 'Каталог локаций',
    h1: 'Все локации Грузии в одном списке',
    lead: 'Регионы, все города и муниципалитеты, все сёла — выберите место и увидите активные объявления.',
    statRegion: 'Регион',
    statCity: 'Город',
    statMunicipality: 'Муниципалитет',
    statVillage: 'Село',
    regionsNavAria: 'Регионы',
    sumCities: '{n} {plural:город|города|городов}',
    sumMunis: '{n} {plural:муниципалитет|муниципалитета|муниципалитетов}',
    sumVillages: '{n} {plural:село|села|сёл}',
    citiesAria: '{region} — города',
    villagesCount: '{n} {plural:село|села|сёл}',
    noVillages: 'Без сёл',
    allListingsIn: 'Все объявления в {m} →',
    footnote: 'Каталог: официальное административное деление Грузии · сёла — участники OpenStreetMap (ODbL).',
  },
  de: {
    title: 'Alle Orte in Georgien — Regionen, Städte, Munizipalitäten, Dörfer',
    description:
      'Das vollständige Ortsverzeichnis Georgiens: 12 Regionen, alle Städte und Munizipalitäten, über 4.500 Dörfer. Finden Sie Inserate an Ihrem Ort.',
    ariaCrumbs: 'Brotkrumen',
    crumbHome: 'Startseite',
    crumbLocations: 'Orte',
    badge: 'Ortsverzeichnis',
    h1: 'Alle Orte Georgiens in einer Liste',
    lead: 'Regionen, alle Städte und Munizipalitäten, alle Dörfer — wählen Sie einen Ort und sehen Sie aktive Inserate.',
    statRegion: 'Region',
    statCity: 'Stadt',
    statMunicipality: 'Munizipalität',
    statVillage: 'Dorf',
    regionsNavAria: 'Regionen',
    sumCities: '{n} {plural:Stadt|Städte}',
    sumMunis: '{n} {plural:Munizipalität|Munizipalitäten}',
    sumVillages: '{n} {plural:Dorf|Dörfer}',
    citiesAria: '{region} — Städte',
    villagesCount: '{n} {plural:Dorf|Dörfer}',
    noVillages: 'Ohne Dörfer',
    allListingsIn: 'Alle Inserate in {m} →',
    footnote: 'Verzeichnis: offizielle administrative Gliederung Georgiens · Dörfer — OpenStreetMap-Mitwirkende (ODbL).',
  },
}

type CopyLang = keyof typeof C
const cLang = (l: Lang): CopyLang => (l === 'ka' || l === 'ru' || l === 'de' ? l : 'en')

interface PageProps {
  params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang: rawLang } = await params
  const cl = cLang(isValidLang(rawLang) ? rawLang : 'ka')
  const c = C[cl]
  return {
    title: c.title,
    description: c.description,
    alternates: kaOnlyAlternates(PATH),
    openGraph: {
      title: c.title,
      description: c.description,
      type: 'website',
      url: `${BASE}${PATH}`,
      siteName: 'sivrce',
      locale: OG_LOCALE[cl],
      images: [{ url: '/images/og-brand.png', width: 1200, height: 630, alt: c.title }],
    },
    twitter: { card: 'summary_large_image', title: c.title, description: c.description, images: ['/images/og-brand.png'] },
  }
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

function locationsLd(c: Copy, cl: CopyLang) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: c.title,
        description: c.description,
        url: `${BASE}${PATH}`,
        inLanguage: cl,
        isPartOf: { '@id': `${BASE}/#website` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: c.crumbHome, item: BASE },
          { '@type': 'ListItem', position: 2, name: c.crumbLocations, item: `${BASE}${PATH}` },
        ],
      },
    ],
  }
}

export default async function LocationsIndexPage({ params }: PageProps) {
  const { lang: rawLang } = await params
  const cl = cLang(isValidLang(rawLang) ? rawLang : 'ka')
  const c = C[cl]
  const regions = Object.keys(GEO_REGIONS)
  const regionLabel = (r: string) => (cl === 'ka' ? r : REGION_LABELS[r]?.[cl === 'de' ? 'en' : cl] ?? r)
  const cityLabel = (city: string) => (cl === 'ka' ? city : cityName(city, cl === 'de' ? 'de' : cl))
  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main" className="sv-pt-nav mx-auto max-w-[1440px] px-5 pb-20 md:px-10">
        <nav aria-label={c.ariaCrumbs} className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold text-sv-ink/60">
            <li>
              <Link href="/" className="transition-colors hover:text-sv-blue">
                {c.crumbHome}
              </Link>
            </li>
            <li className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-sv-ink/30" aria-hidden />
              <span aria-current="page" className="text-sv-ink/80">
                {c.crumbLocations}
              </span>
            </li>
          </ol>
        </nav>

        <header className="mb-8">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-sv-blue/10 px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-sv-blue-deep">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {c.badge}
          </span>
          <h1 className="max-w-3xl text-balance text-[32px] font-black leading-[1.1] tracking-tight text-sv-ink md:text-[44px]">
            {c.h1}
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] font-semibold leading-relaxed text-sv-ink/60">
            {c.lead}
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              [c.statRegion, regions.length],
              [c.statCity, CITY_COUNT],
              [c.statMunicipality, GEO_MUNICIPALITIES.length],
              [c.statVillage, VILLAGES_TOTAL],
            ].map(([label, n]) => (
              <div key={label} className="rounded-module border border-sv-ink/[0.06] bg-sv-surface px-4 py-3">
                <dt className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-sv-ink/50">{label}</dt>
                <dd className="mt-0.5 text-[24px] font-black tabular-nums tracking-tight text-sv-ink">{n}</dd>
              </div>
            ))}
          </dl>
        </header>

        <nav
          aria-label={c.regionsNavAria}
          className="sticky top-16 z-10 -mx-5 mb-8 border-y border-sv-ink/[0.06] bg-sv-cloud/90 px-5 py-2.5 backdrop-blur-md md:-mx-10 md:px-10"
        >
          <ul className="flex flex-wrap gap-1.5">
            {regions.map((r) => (
              <li key={r}>
                <a
                  href={`#${REGION_ANCHOR[r]}`}
                  className="inline-flex items-center rounded-full bg-sv-surface px-3 py-1.5 text-[12px] font-extrabold text-sv-ink/70 shadow-card transition-colors hover:text-sv-blue"
                >
                  {regionLabel(r)}
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
                  <h2 className="text-[22px] font-black tracking-tight text-sv-ink md:text-[26px]">{regionLabel(region)}</h2>
                  <p className="text-[12px] font-bold text-sv-ink/50">
                    {[
                      translateRaw(c.sumCities, { n: cities.length }),
                      translateRaw(c.sumMunis, { n: munis.length }),
                      translateRaw(c.sumVillages, { n: REGION_VILLAGES[region] }),
                    ].join(' · ')}
                  </p>
                </div>

                {cities.length > 0 && (
                  <ul className="mb-4 flex flex-wrap gap-1.5" aria-label={translateRaw(c.citiesAria, { region })}>
                    {cities.map((city) => (
                      <li key={city}>
                        <Link
                          href={`/search?city=${encodeURIComponent(city)}`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-sv-blue/[0.07] px-3 py-1.5 text-[13px] font-extrabold text-sv-blue-deep transition-colors hover:bg-sv-blue hover:text-white"
                        >
                          <MapPin className="h-3.5 w-3.5" aria-hidden />
                          {cityLabel(city)}
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
                                  {villages.length > 0 ? translateRaw(c.villagesCount, { n: villages.length }) : c.noVillages}
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
                                  {/* ponytail: 4616 village links ≈ 4 MB of HTML+RSC; the
                                      summary already shows the total and the muni-wide
                                      search link below reaches every village. Raise the
                                      cap only if village pages (not query links) exist. */}
                                  {villages.slice(0, 30).map((v) => (
                                    <a
                                      key={v}
                                      href={`/search?city=${encodeURIComponent(m)}&district=${encodeURIComponent(v)}`}
                                      className="transition-colors after:text-sv-ink/25 after:content-['·'] hover:text-sv-blue last:after:content-none"
                                    >
                                      {v}
                                    </a>
                                  ))}
                                  {villages.length > 30 && (
                                    <span className="text-sv-ink/40">
                                      +{villages.length - 30}
                                    </span>
                                  )}
                                </p>
                              )}
                              <Link
                                href={`/search?city=${encodeURIComponent(m)}`}
                                className="mt-2 inline-block text-[13px] font-extrabold text-sv-blue transition-colors hover:text-sv-blue-deep"
                              >
                                {translateRaw(c.allListingsIn, { m })}
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
          {c.footnote}
        </p>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(locationsLd(c, cl)) }} />
    </div>
  )
}
