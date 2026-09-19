import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, TrainFront } from 'lucide-react'
import { SparkMark } from '@/components/SparkMark'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { METRO_LINES, METRO_STATIONS, metroByLine, type MetroStation } from '@/data/tbilisi-metro'
import { DISTRICTS } from '@/lib/seo-pages'
import { WeatherBadge } from '@/components/WeatherBadge'
import { cityCoords } from '@/lib/weather'
import { jsonLd } from '@/lib/utils'
import { isValidLang, translateRaw, type Lang } from '@/lib/i18n/core'
import { kaOnlyAlternates, OG_LOCALE } from '@/lib/i18n/server'

const BASE = 'https://sivrce.ge'
const PATH = '/metro'

export const revalidate = 86400

/** On-page copy per locale — {var}/{plural:one|other} templates resolved via translateRaw. */
interface Copy {
  title: string
  description: string
  ariaCrumbs: string
  crumbHome: string
  crumbMetro: string
  badge: string
  city: string
  h1: string
  lineAria: string
  lineHeading: string
  near: string
  apartmentsNear: string
  ldItemList: string
}

// ka strings verbatim; canonicals stay ka (kaOnlyAlternates) — this localizes the visit, not the index.
const C: Record<'ka' | 'en' | 'ru' | 'de', Copy> = {
  ka: {
    title: 'ბინები მეტროსთან — თბილისის ყველა მეტროსადგური',
    description:
      'თბილისის მეტროს 22 სადგური ორი ხაზზე — ბინები სადგურიდან 15 წუთიან ფეხით მანძილზე. ვერიფიცირებული განცხადებები, AI ფასის შეფასება.',
    ariaCrumbs: 'ბრედკრამბი',
    crumbHome: 'მთავარი',
    crumbMetro: 'მეტრო',
    badge: '{n} სადგური · 2 ხაზი',
    city: 'თბილისი',
    h1: 'ბინები მეტროსთან — თბილისის ყველა სადგური',
    lineAria: 'მე-{line} ხაზი',
    lineHeading: 'მე-{line} ხაზი · {lineName}',
    near: '',
    apartmentsNear: 'ბინები {near}',
    ldItemList: 'თბილისის მეტროს სადგურები',
  },
  en: {
    title: 'Apartments near the metro — all Tbilisi metro stations',
    description:
      '22 Tbilisi metro stations on two lines — apartments within a 15-minute walk of each station. Verified listings, AI price valuation.',
    ariaCrumbs: 'Breadcrumb',
    crumbHome: 'Home',
    crumbMetro: 'Metro',
    badge: '{n} stations · 2 lines',
    city: 'Tbilisi',
    h1: 'Apartments near the metro — every station in Tbilisi',
    lineAria: 'Line {line}',
    lineHeading: 'Line {line} · {lineName}',
    near: 'near {name} Metro Station',
    apartmentsNear: 'Apartments {near}',
    ldItemList: 'Tbilisi metro stations',
  },
  ru: {
    title: 'Квартиры у метро — все станции метро Тбилиси',
    description:
      '22 станции Тбилисского метро на двух линиях — квартиры в 15 минутах ходьбы от станции. Проверенные объявления, ИИ-оценка цены.',
    ariaCrumbs: 'Навигация',
    crumbHome: 'Главная',
    crumbMetro: 'Метро',
    badge: '{n} {plural:станция|станции|станций} · 2 линии',
    city: 'Тбилиси',
    h1: 'Квартиры у метро — все станции Тбилиси',
    lineAria: '{line}-я линия',
    lineHeading: '{line}-я линия · {lineName}',
    near: 'рядом с метро {name}',
    apartmentsNear: 'Квартиры {near}',
    ldItemList: 'Станции метро Тбилиси',
  },
  de: {
    title: 'Wohnungen nahe der Metro — alle Metrostationen in Tiflis',
    description:
      '22 Stationen der Metro Tiflis auf zwei Linien — Wohnungen innerhalb von 15 Gehminuten je Station. Verifizierte Inserate, KI-Preisschätzung.',
    ariaCrumbs: 'Brotkrumen',
    crumbHome: 'Startseite',
    crumbMetro: 'Metro',
    badge: '{n} Stationen · 2 Linien',
    city: 'Tiflis',
    h1: 'Wohnungen nahe der Metro — alle Stationen in Tiflis',
    lineAria: 'Linie {line}',
    lineHeading: 'Linie {line} · {lineName}',
    near: 'nahe der Metrostation {name}',
    apartmentsNear: 'Wohnungen {near}',
    ldItemList: 'Metrostationen in Tiflis',
  },
}

type CopyLang = keyof typeof C
const cLang = (l: Lang): CopyLang => (l === 'ka' || l === 'ru' || l === 'de' ? l : 'en')

const nearOf = (s: MetroStation, cl: CopyLang) => (cl === 'ka' ? s.near : translateRaw(C[cl].near, { name: s.en }))
const districtLabel = (slug: string, cl: CopyLang) => {
  const d = DISTRICTS.find((x) => x.slug === slug)
  return d ? (cl === 'ka' ? d.ka : cl === 'ru' ? d.ru : d.en) : slug
}

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

function metroLd(c: Copy, cl: CopyLang) {
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
        '@type': 'ItemList',
        name: c.ldItemList,
        numberOfItems: METRO_STATIONS.length,
        itemListElement: METRO_STATIONS.map((s, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${BASE}/metro/${s.slug}`,
          name: translateRaw(c.apartmentsNear, { near: nearOf(s, cl) }),
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: c.crumbHome, item: BASE },
          { '@type': 'ListItem', position: 2, name: c.crumbMetro, item: `${BASE}${PATH}` },
        ],
      },
    ],
  }
}

export default async function MetroIndexPage({ params }: PageProps) {
  const { lang: rawLang } = await params
  const cl = cLang(isValidLang(rawLang) ? rawLang : 'ka')
  const c = C[cl]
  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main" className="sv-pt-nav mx-auto max-w-[1440px] px-5 pb-20 md:px-10">
        {/* Breadcrumbs */}
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
                {c.crumbMetro}
              </span>
            </li>
          </ol>
        </nav>

        <header className="mb-10">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-sv-blue/10 px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-sv-blue-deep">
            <SparkMark className="h-3.5 w-3.5" aria-hidden /> {translateRaw(c.badge, { n: METRO_STATIONS.length })}
          </span>
          <WeatherBadge coords={cityCoords('tbilisi')} label={c.city} className="mb-3 ml-2 rounded-full border border-sv-ink/[0.06] bg-sv-surface px-3 py-1.5 text-sv-ink/60 shadow-card" />
          <h1 className="max-w-[900px] text-balance text-[30px] font-black tracking-[-0.02em] text-sv-ink md:text-[44px]">
            {c.h1}
          </h1>
          <p className="mt-3 max-w-[720px] text-[15px] font-semibold text-sv-ink/60 md:text-[16px]">{c.description}</p>
        </header>

        <div className="grid gap-10 lg:grid-cols-2">
          {([1, 2] as const).map((line) => (
            <section key={line} aria-label={translateRaw(c.lineAria, { line })}>
              <h2 className="mb-4 flex items-center gap-2.5 text-[18px] font-black tracking-[-0.02em] text-sv-ink md:text-[20px]">
                <span className="grid h-9 w-9 place-items-center rounded-control bg-sv-blue/10">
                  <TrainFront className="h-4 w-4 text-sv-blue" aria-hidden />
                </span>
                {translateRaw(c.lineHeading, { line, lineName: METRO_LINES[line] })}
              </h2>
              <div className="grid gap-2">
                {metroByLine(line).map((s) => (
                  <Link
                    key={s.slug}
                    href={`/metro/${s.slug}`}
                    className="group flex items-center justify-between gap-3 rounded-module border border-sv-ink/[0.06] bg-sv-surface px-4 py-3 shadow-card transition-shadow hover:shadow-card-hover"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-extrabold text-sv-ink group-hover:text-sv-blue">
                        {translateRaw(c.apartmentsNear, { near: nearOf(s, cl) })}
                      </span>
                      <span className="mt-0.5 block text-[12px] font-bold text-sv-ink/50">{districtLabel(s.district, cl)}</span>
                    </span>
                    <ChevronRight
                      className="h-4 w-4 shrink-0 text-sv-ink/30 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-sv-blue"
                      aria-hidden
                    />
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(metroLd(c, cl)) }} />
    </div>
  )
}
