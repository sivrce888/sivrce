import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { SparkMark } from '@/components/SparkMark'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { STREETS, type TbilisiStreet } from '@/data/tbilisi-streets'
import { DISTRICTS } from '@/lib/seo-pages'
import { jsonLd } from '@/lib/utils'
import { langAlternates } from '@/lib/i18n/server'

const BASE = 'https://sivrce.ge'
const PATH = '/tbilisi/kuchebi'

const TITLE = 'თბილისის ქუჩები — ბინები ქუჩების მიხედვით'
const DESCRIPTION =
  'თბილისის ქუჩების სრული კატალოგი უბნებით: იყიდება და ქირავდება ბინები, ფასები და ბაზრის სტატისტიკა კონკრეტული მისამართისთვის — ვაკე, საბურთალო, მთაწმინდა, ძველი თბილისი და სხვა უბნები.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH, languages: langAlternates(PATH) },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    url: `${BASE}${PATH}`,
    siteName: 'sivrce',
    locale: 'ka_GE',
    images: [{ url: '/images/og.jpg', width: 1200, height: 630, alt: TITLE }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: ['/images/og.jpg'] },
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

const districtKa = (slug: string) => DISTRICTS.find((d) => d.slug === slug)?.ka ?? slug

export default function StreetsDirectoryPage() {
  const groups = groupStreets(STREETS)
  const linked = STREETS.filter((s) => s.district !== undefined).length

  const crumbs = [
    { name: 'მთავარი', href: '/' },
    { name: 'თბილისი', href: '/tbilisi' },
    { name: 'ქუჩები', href: PATH },
  ]

  const ld = {
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
        itemListElement: crumbs.map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: c.name,
          item: `${BASE}${c.href}`,
        })),
      },
    ],
  }

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
        <header className="mb-10">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-sv-blue/10 px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-sv-blue">
            <SparkMark className="h-3.5 w-3.5" aria-hidden /> {STREETS.length} ქუჩა
          </span>
          <h1 className="max-w-[900px] text-balance text-[30px] font-black tracking-[-0.02em] text-sv-ink md:text-[44px]">
            {TITLE}
          </h1>
          <p className="mt-3 max-w-[860px] text-[15px] font-semibold leading-relaxed text-sv-ink/60 md:text-[16px]">
            თბილისის ყველა ქუჩა ერთ სივრცეში — აირჩიეთ ქუჩა და ნახეთ იყიდება და ქირავდება ბინები, ფასები
            და ბაზრის სტატისტიკა კონკრეტული მისამართისთვის. {linked} ყველაზე მოთხოვნადი ქუჩა — ილია
            ჭავჭავაძის გამზირიდან შოთა რუსთაველის გამზირამდე — ცოცხალი მარაგით და AI ფასის შეფასებით
            უკვე ცალკე გვერდზეა.
          </p>
        </header>

        {/* Alphabetical directory */}
        <div className="columns-1 gap-10 sm:columns-2 lg:columns-3 xl:columns-4">
          {groups.map((g) => (
            <section key={g.letter} className="mb-10 break-inside-avoid" aria-label={`ასო ${g.letter}`}>
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
                        <span className="shrink-0 text-[11px] font-bold text-sv-ink/40">{districtKa(s.district)}</span>
                      </>
                    ) : (
                      <span className="text-[14px] font-medium text-sv-ink/45">{s.ka}</span>
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
