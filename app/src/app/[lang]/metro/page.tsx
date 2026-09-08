import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, TrainFront } from 'lucide-react'
import { SparkMark } from '@/components/SparkMark'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { METRO_LINES, METRO_STATIONS, metroByLine } from '@/data/tbilisi-metro'
import { DISTRICTS } from '@/lib/seo-pages'
import { jsonLd } from '@/lib/utils'
import { langAlternates } from '@/lib/i18n/server'

const BASE = 'https://sivrce.ge'
const PATH = '/metro'

export const revalidate = 86400

const TITLE = 'ბინები მეტროსთან — თბილისის ყველა მეტროსადგური'
// ≤160 chars — Lighthouse/Google meta-description budget.
const DESCRIPTION =
  'თბილისის მეტროს 22 სადგური ორი ხაზზე — ბინები სადგურიდან 15 წუთიან ფეხით მანძილზე. ' +
  'ვერიფიცირებული განცხადებები, AI ფასის შეფასება.'

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
    images: [{ url: '/images/og-brand.png', width: 1200, height: 630, alt: TITLE }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: ['/images/og-brand.png'] },
}

const districtKa = (slug: string) => DISTRICTS.find((d) => d.slug === slug)?.ka ?? slug

function metroLd() {
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
        '@type': 'ItemList',
        name: 'თბილისის მეტროს სადგურები',
        numberOfItems: METRO_STATIONS.length,
        itemListElement: METRO_STATIONS.map((s, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${BASE}/metro/${s.slug}`,
          name: `ბინები ${s.near}`,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'მთავარი', item: BASE },
          { '@type': 'ListItem', position: 2, name: 'მეტრო', item: `${BASE}${PATH}` },
        ],
      },
    ],
  }
}

export default function MetroIndexPage() {
  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main" className="sv-pt-nav mx-auto max-w-[1440px] px-5 pb-20 md:px-10">
        {/* Breadcrumbs */}
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
                მეტრო
              </span>
            </li>
          </ol>
        </nav>

        <header className="mb-10">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-sv-blue/10 px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-sv-blue-deep">
            <SparkMark className="h-3.5 w-3.5" aria-hidden /> {METRO_STATIONS.length} სადგური · 2 ხაზი
          </span>
          <h1 className="max-w-[900px] text-balance text-[30px] font-black tracking-[-0.02em] text-sv-ink md:text-[44px]">
            ბინები მეტროსთან — თბილისის ყველა სადგური
          </h1>
          <p className="mt-3 max-w-[720px] text-[15px] font-semibold text-sv-ink/60 md:text-[16px]">{DESCRIPTION}</p>
        </header>

        <div className="grid gap-10 lg:grid-cols-2">
          {([1, 2] as const).map((line) => (
            <section key={line} aria-label={`მე-${line} ხაზი`}>
              <h2 className="mb-4 flex items-center gap-2.5 text-[18px] font-black tracking-[-0.02em] text-sv-ink md:text-[20px]">
                <span className="grid h-9 w-9 place-items-center rounded-control bg-sv-blue/10">
                  <TrainFront className="h-4 w-4 text-sv-blue" aria-hidden />
                </span>
                მე-{line} ხაზი · {METRO_LINES[line]}
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
                        ბინები {s.near}
                      </span>
                      <span className="mt-0.5 block text-[12px] font-bold text-sv-ink/50">{districtKa(s.district)}</span>
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(metroLd()) }} />
    </div>
  )
}
