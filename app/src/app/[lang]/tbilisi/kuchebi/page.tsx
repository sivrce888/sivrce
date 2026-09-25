import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { SparkMark } from '@/components/SparkMark'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { STREETS, type TbilisiStreet } from '@/data/tbilisi-streets'
import { DISTRICTS } from '@/lib/seo-pages'
import { AirBadge, WeatherBadge } from '@/components/WeatherBadge'
import { cityCoords } from '@/lib/weather'
import { jsonLd } from '@/lib/utils'
import { isValidLang, translateRaw, type Lang } from '@/lib/i18n/core'
import { kaOnlyAlternates, OG_LOCALE } from '@/lib/i18n/server'

const BASE = 'https://sivrce.ge'
const PATH = '/tbilisi/kuchebi'

export const revalidate = 86400

/** On-page copy per locale — {var}/{plural:one|other} templates resolved via translateRaw. */
interface Copy {
  title: string
  description: string
  ariaCrumbs: string
  crumbHome: string
  crumbTbilisi: string
  crumbStreets: string
  badge: string
  city: string
  intro: string
  letterAria: string
}

// ka strings verbatim; canonicals stay ka (kaOnlyAlternates) — this localizes the visit, not the index.
const C: Record<'ka' | 'en' | 'ru' | 'de', Copy> = {
  ka: {
    title: 'თბილისის ქუჩები — ბინები ქუჩების მიხედვით',
    description:
      'თბილისის ქუჩების სრული კატალოგი უბნებით: იყიდება და ქირავდება ბინები, ფასები და ბაზრის სტატისტიკა კონკრეტული მისამართისთვის — ვაკე, საბურთალო, მთაწმინდა, ძველი თბილისი და სხვა უბნები.',
    ariaCrumbs: 'ბრედკრამბი',
    crumbHome: 'მთავარი',
    crumbTbilisi: 'თბილისი',
    crumbStreets: 'ქუჩები',
    badge: '{n} ქუჩა',
    city: 'თბილისი',
    intro:
      'თბილისის ყველა ქუჩა ერთ სივრცეში — აირჩიეთ ქუჩა და ნახეთ იყიდება და ქირავდება ბინები, ფასები და ბაზრის სტატისტიკა კონკრეტული მისამართისთვის. {n} ყველაზე მოთხოვნადი ქუჩა — ილია ჭავჭავაძის გამზირიდან შოთა რუსთაველის გამზირამდე — ცოცხალი მარაგით და AI ფასის შეფასებით უკვე ცალკე გვერდზეა.',
    letterAria: 'ასო {letter}',
  },
  en: {
    title: 'Tbilisi streets — apartments by street',
    description:
      'The complete directory of Tbilisi streets by district: apartments for sale and rent, prices and market statistics for a specific address — Vake, Saburtalo, Mtatsminda, Old Tbilisi and other districts.',
    ariaCrumbs: 'Breadcrumb',
    crumbHome: 'Home',
    crumbTbilisi: 'Tbilisi',
    crumbStreets: 'Streets',
    badge: '{n} {plural:street|streets}',
    city: 'Tbilisi',
    intro:
      'Every street in Tbilisi in one place — pick a street and see apartments for sale and rent, prices and market statistics for a specific address. The {n} most sought-after streets — from Ilia Chavchavadze Avenue to Shota Rustaveli Avenue — already have their own page with live inventory and AI price valuation.',
    letterAria: 'Letter {letter}',
  },
  ru: {
    title: 'Улицы Тбилиси — квартиры по улицам',
    description:
      'Полный каталог улиц Тбилиси по районам: квартиры в продаже и в аренду, цены и статистика рынка для конкретного адреса — Ваке, Сабуртало, Мтацминда, Старый Тбилиси и другие районы.',
    ariaCrumbs: 'Навигация',
    crumbHome: 'Главная',
    crumbTbilisi: 'Тбилиси',
    crumbStreets: 'Улицы',
    badge: '{n} {plural:улица|улицы|улиц}',
    city: 'Тбилиси',
    intro:
      'Все улицы Тбилиси в одном месте — выберите улицу и смотрите квартиры в продаже и в аренду, цены и статистику рынка для конкретного адреса. {n} самых востребованных улиц — от проспекта Ильи Чавчавадзе до проспекта Шота Руставели — уже имеют отдельную страницу с живым ассортиментом и ИИ-оценкой цены.',
    letterAria: 'Буква {letter}',
  },
  de: {
    title: 'Straßen in Tiflis — Wohnungen nach Straßen',
    description:
      'Das vollständige Straßenverzeichnis von Tiflis nach Vierteln: Wohnungen zu verkaufen und zur Miete, Preise und Marktstatistik für eine bestimmte Adresse — Vake, Saburtalo, Mtatsminda, Alt-Tiflis und weitere Viertel.',
    ariaCrumbs: 'Brotkrumen',
    crumbHome: 'Startseite',
    crumbTbilisi: 'Tiflis',
    crumbStreets: 'Straßen',
    badge: '{n} {plural:Straße|Straßen}',
    city: 'Tiflis',
    intro:
      'Alle Straßen Tiflis an einem Ort — wählen Sie eine Straße und sehen Sie Wohnungen zu verkaufen und zur Miete, Preise und Marktstatistik für eine bestimmte Adresse. Die {n} gefragtesten Straßen — von der Ilia-Tschawtschawadse-Allee bis zur Schota-Rustaweli-Allee — haben bereits eine eigene Seite mit live Angebot und KI-Preisschätzung.',
    letterAria: 'Buchstabe {letter}',
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

const GEO_ALPHABET = 'აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ'

/** Group streets by first letter, Georgian alphabet order; non-letters under „#". */
function groupStreets(streets: TbilisiStreet[]) {
  const groups = new Map<string, TbilisiStreet[]>()
  for (const s of streets) {
    const first = s.ka[0]!
    const key = GEO_ALPHABET.includes(first) ? first : '#'
    const arr = groups.get(key) ?? []
    arr.push(s)
    groups.set(key, arr)
  }
  const order = [...GEO_ALPHABET, '#']
  return [...groups.entries()]
    .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
    .map(([letter, list]) => ({ letter, list: list.sort((a, b) => a.ka.localeCompare(b.ka, 'ka')) }))
}

const districtLabel = (slug: string, cl: CopyLang) => {
  const d = DISTRICTS.find((x) => x.slug === slug)
  return d ? (cl === 'ka' ? d.ka : cl === 'ru' ? d.ru : d.en) : slug
}

export default async function StreetsDirectoryPage({ params }: PageProps) {
  const { lang: rawLang } = await params
  const lang = isValidLang(rawLang) ? rawLang : 'ka'
  const cl = cLang(lang)
  const c = C[cl]
  const groups = groupStreets(STREETS)
  const linked = STREETS.filter((s) => s.district !== undefined).length

  const crumbs = [
    { name: c.crumbHome, href: '/' },
    { name: c.crumbTbilisi, href: '/tbilisi' },
    { name: c.crumbStreets, href: PATH },
  ]

  const ld = {
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
        itemListElement: crumbs.map((cr, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: cr.name,
          item: `${BASE}${cr.href}`,
        })),
      },
    ],
  }

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main" className="sv-pt-nav mx-auto max-w-[1440px] px-5 pb-20 md:px-10">
        {/* Breadcrumbs */}
        <nav aria-label={c.ariaCrumbs} className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold text-sv-ink/60">
            {crumbs.map((cr, i) => (
              <li key={cr.href} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-sv-ink/30" aria-hidden />}
                {i === crumbs.length - 1 ? (
                  <span aria-current="page" className="text-sv-ink/80">
                    {cr.name}
                  </span>
                ) : (
                  <Link href={cr.href} className="transition-colors hover:text-sv-blue">
                    {cr.name}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-sv-blue/10 px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-sv-blue-deep">
            <SparkMark className="h-3.5 w-3.5" aria-hidden /> {translateRaw(c.badge, { n: STREETS.length })}
          </span>
          <WeatherBadge coords={cityCoords('tbilisi')} label={c.city} className="mb-3 ml-2 rounded-full border border-sv-ink/[0.06] bg-sv-surface px-3 py-1.5 text-sv-ink/60 shadow-card" />
          <AirBadge citySlug="tbilisi" lang={lang} className="mb-3 ml-2 rounded-full border border-sv-ink/[0.06] bg-sv-surface px-3 py-1.5 text-sv-ink/60 shadow-card" />
          <h1 className="max-w-[900px] text-balance text-[30px] font-black tracking-[-0.02em] text-sv-ink md:text-[44px]">
            {c.title}
          </h1>
          <p className="mt-3 max-w-[860px] text-[15px] font-semibold leading-relaxed text-sv-ink/60 md:text-[16px]">
            {translateRaw(c.intro, { n: linked })}
          </p>
        </header>

        {/* Alphabetical directory */}
        <div className="columns-1 gap-10 sm:columns-2 lg:columns-3 xl:columns-4">
          {groups.map((g) => (
            <section key={g.letter} className="mb-10 break-inside-avoid" aria-label={translateRaw(c.letterAria, { letter: g.letter })}>
              <h2 className="mb-3 border-b border-sv-ink/[0.06] pb-2 text-[20px] font-black text-sv-blue">
                {g.letter}
              </h2>
              <ul className="space-y-1.5">
                {g.list.map((s) => (
                  <li key={s.slug} className="flex items-baseline gap-2">
                    {s.district ? (
                      <>
                        <Link
                          href={`/tbilisi/${s.district}/${s.slug}`}
                          className="text-[14px] font-bold text-sv-ink/80 transition-colors hover:text-sv-blue"
                        >
                          {s.ka}
                        </Link>
                        <span className="shrink-0 text-[11px] font-bold text-sv-ink/60">{districtLabel(s.district, cl)}</span>
                      </>
                    ) : (
                      <span className="text-[14px] font-medium text-sv-ink/60">{s.ka}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
    </div>
  )
}
