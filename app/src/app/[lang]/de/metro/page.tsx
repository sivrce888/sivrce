import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { SparkMark } from '@/components/SparkMark'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { BERLIN_UBAHN, BERLIN_SBAHN, BERLIN_U_STATIONS, BERLIN_S_STATIONS } from '@/data/germany-metro'
import { jsonLd } from '@/lib/utils'
import { deOnlyAlternates } from '@/lib/i18n/server'

const BASE = 'https://sivrce.com'
const PATH = '/de/metro'

export const revalidate = 86400

const TITLE = `Wohnungen nahe U-Bahn & S-Bahn — Alle ${BERLIN_U_STATIONS.length} Berliner U-Bahn-Stationen`
const DESCRIPTION =
  `Alle ${BERLIN_U_STATIONS.length} U-Bahn-Stationen und ${BERLIN_S_STATIONS.length} wichtige S-Bahn-Stationen in Berlin — ` +
  'Wohnungen innerhalb 10 Gehminuten. Verifizierte Angebote, KI-Bewertung und direkter Kontakt mit Eigentümern.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: deOnlyAlternates(PATH),
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    url: `${BASE}${PATH}`,
    siteName: 'sivrce',
    locale: 'de_DE',
    images: [{ url: '/images/og-brand.png', width: 1200, height: 630, alt: TITLE }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: ['/images/og-brand.png'] },
}

function metroLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: TITLE,
        description: DESCRIPTION,
        url: `${BASE}${PATH}`,
        inLanguage: 'de',
        isPartOf: { '@id': `${BASE}/#website` },
      },
      {
        '@type': 'ItemList',
        name: 'Berliner U-Bahn-Stationen',
        numberOfItems: BERLIN_U_STATIONS.length,
        itemListElement: BERLIN_U_STATIONS.map((s, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${BASE}/de/metro/${s.slug}`,
          name: `Wohnungen ${s.name}`,
        })),
      },
      {
        '@type': 'ItemList',
        name: 'Berliner S-Bahn-Stationen',
        numberOfItems: BERLIN_S_STATIONS.length,
        itemListElement: BERLIN_S_STATIONS.map((s, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${BASE}/de/metro/${s.slug}`,
          name: `Wohnungen ${s.name}`,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Startseite', item: BASE },
          { '@type': 'ListItem', position: 2, name: 'Berlin U-Bahn', item: `${BASE}${PATH}` },
        ],
      },
    ],
  }
}

function LineBadge({ line }: { line: { name: string; color: string; type: string } }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-white"
      style={{ backgroundColor: line.color }}
    >
      {line.type === 'u-bahn' ? 'U' : 'S'} {line.name}
    </span>
  )
}

export default function BerlinMetroIndexPage() {
  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main" className="sv-pt-nav mx-auto max-w-[1440px] px-5 pb-20 md:px-10">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold text-sv-ink/60">
            <li>
              <Link href="/de" className="transition-colors hover:text-sv-blue">
                Startseite
              </Link>
            </li>
            <li className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-sv-ink/30" aria-hidden />
              <span aria-current="page" className="text-sv-ink/80">
                U-Bahn & S-Bahn
              </span>
            </li>
          </ol>
        </nav>

        <header className="mb-10">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-sv-blue/10 px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-sv-blue-deep">
            <SparkMark className="h-3.5 w-3.5" aria-hidden /> {BERLIN_U_STATIONS.length + BERLIN_S_STATIONS.length} Stationen · {BERLIN_UBAHN.length + BERLIN_SBAHN.length} Linien
          </span>
          <h1 className="max-w-[900px] text-balance text-[30px] font-black tracking-[-0.02em] text-sv-ink md:text-[44px]">
            Wohnungen nahe U-Bahn & S-Bahn — Berlin
          </h1>
          <p className="mt-3 max-w-[720px] text-[15px] font-semibold text-sv-ink/60 md:text-[16px]">{DESCRIPTION}</p>
        </header>

        {/* U-Bahn Lines */}
        <section aria-label="U-Bahn Linien" className="mb-12">
          <h2 className="mb-5 flex items-center gap-2.5 text-[22px] font-black tracking-[-0.02em] text-sv-ink">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-yellow-400 text-[14px] font-black text-black">
              U
            </span>
            U-Bahn — {BERLIN_UBAHN.length} Linien
          </h2>
          <div className="grid gap-6 lg:grid-cols-2">
            {BERLIN_UBAHN.map((line) => {
              const stations = BERLIN_U_STATIONS.filter((s) => s.lines.includes(line.name))
              return (
                <section key={line.name} className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card">
                  <h3 className="mb-3 flex items-center gap-2 text-[17px] font-black text-sv-ink">
                    <LineBadge line={line} />
                    <span className="text-sv-ink/50 text-[13px] font-bold">
                      {line.stations} Stationen · {line.km} km
                    </span>
                  </h3>
                  <div className="grid gap-1.5">
                    {stations.map((s) => (
                      <Link
                        key={s.slug}
                        href={`/de/metro/${s.slug}`}
                        className="group flex items-center justify-between gap-3 rounded-lg border border-transparent px-3 py-2 transition-all hover:border-sv-ink/[0.06] hover:bg-sv-cloud"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[14px] font-extrabold text-sv-ink group-hover:text-sv-blue">
                            {s.name}
                          </span>
                          {s.interchange && (
                            <span className="mt-0.5 flex flex-wrap gap-1">
                              {s.lines.filter((l) => l !== line.name).map((l) => (
                                <span key={l} className="text-[10px] font-bold text-sv-ink/40">{l}</span>
                              ))}
                            </span>
                          )}
                        </span>
                        <ChevronRight
                          className="h-3.5 w-3.5 shrink-0 text-sv-ink/20 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-sv-blue"
                          aria-hidden
                        />
                      </Link>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        </section>

        {/* S-Bahn Lines */}
        <section aria-label="S-Bahn Linien">
          <h2 className="mb-5 flex items-center gap-2.5 text-[22px] font-black tracking-[-0.02em] text-sv-ink">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-green-700 text-[14px] font-black text-white">
              S
            </span>
            S-Bahn — {BERLIN_SBAHN.length} Linien
          </h2>
          <div className="grid gap-6 lg:grid-cols-2">
            {BERLIN_SBAHN.map((line) => {
              const stations = BERLIN_S_STATIONS.filter((s) => s.lines.includes(line.name))
              return (
                <section key={line.name} className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card">
                  <h3 className="mb-3 flex items-center gap-2 text-[17px] font-black text-sv-ink">
                    <LineBadge line={line} />
                    <span className="text-sv-ink/50 text-[13px] font-bold">
                      {stations.length} Stationen · {line.km} km
                    </span>
                  </h3>
                  <div className="grid gap-1.5">
                    {stations.map((s) => (
                      <Link
                        key={s.slug}
                        href={`/de/metro/${s.slug}`}
                        className="group flex items-center justify-between gap-3 rounded-lg border border-transparent px-3 py-2 transition-all hover:border-sv-ink/[0.06] hover:bg-sv-cloud"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[14px] font-extrabold text-sv-ink group-hover:text-sv-blue">
                            {s.name}
                          </span>
                          {s.interchange && (
                            <span className="mt-0.5 flex flex-wrap gap-1">
                              {s.lines.filter((l) => l !== line.name).map((l) => (
                                <span key={l} className="text-[10px] font-bold text-sv-ink/40">{l}</span>
                              ))}
                            </span>
                          )}
                        </span>
                        <ChevronRight
                          className="h-3.5 w-3.5 shrink-0 text-sv-ink/20 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-sv-blue"
                          aria-hidden
                        />
                      </Link>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        </section>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(metroLd()) }} />
    </div>
  )
}
