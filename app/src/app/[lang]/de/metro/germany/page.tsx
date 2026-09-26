import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, ExternalLink } from 'lucide-react'
import { SparkMark } from '@/components/SparkMark'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { BERLIN_SBAHN, BERLIN_S_STATIONS, BERLIN_UBAHN, BERLIN_U_STATIONS, GERMAN_METRO_SYSTEMS, lineBadge } from '@/data/germany-metro'
import { jsonLd } from '@/lib/utils'
import { deOnlyAlternates } from '@/lib/i18n/server'

const BASE = 'https://sivrce.com'
const PATH = '/de/metro/germany'

export const revalidate = 86400

const TITLE = 'Deutsche U-Bahn & Stadtbahnen — Alle Systeme'
const DESCRIPTION =
  'Alle U-Bahn-, Stadtbahn- und S-Bahn-Systeme in Deutschland: Berlin, München, Hamburg, ' +
  'Frankfurt, Köln, Stuttgart, Nürnberg und mehr. Linien und Stationen im Überblick.'

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

function totalStations() {
  return GERMAN_METRO_SYSTEMS.reduce((sum, sys) => sum + sys.stations.length, 0)
}

function totalLines() {
  return GERMAN_METRO_SYSTEMS.reduce((sum, sys) => sum + sys.lines.length, 0)
}

function germanyLd() {
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
        name: 'Deutsche U-Bahn-Systeme',
        numberOfItems: GERMAN_METRO_SYSTEMS.length,
        itemListElement: GERMAN_METRO_SYSTEMS.map((sys, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${BASE}/de/${sys.citySlug}`,
          name: `${sys.name} — ${sys.stations.length} Stationen`,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Startseite', item: BASE },
          { '@type': 'ListItem', position: 2, name: 'Deutsche U-Bahn', item: `${BASE}${PATH}` },
        ],
      },
    ],
  }
}

function SystemBadge({ sys }: { sys: typeof GERMAN_METRO_SYSTEMS[number] }) {
  const ubahnLines = sys.lines.filter((l) => l.type === 'u-bahn')
  const stadtLines = sys.lines.filter((l) => l.type !== 'u-bahn')
  return (
    <div className="flex flex-wrap gap-1">
      {ubahnLines.length > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-sv-blue/10 px-2 py-0.5 text-[10px] font-black text-sv-blue">
          U · {ubahnLines.length}
        </span>
      )}
      {stadtLines.length > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-sv-navy px-2 py-0.5 text-[10px] font-black text-white">
          S · {stadtLines.length}
        </span>
      )}
    </div>
  )
}

export default function GermanyMetroPage() {
  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main" className="sv-pt-nav mx-auto max-w-[1440px] px-5 pb-20 md:px-10">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold text-sv-ink/60">
            <li>
              <Link href="/de/de" className="transition-colors hover:text-sv-blue">
                Startseite
              </Link>
            </li>
            <li className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-sv-ink/30" aria-hidden />
              <Link href="/de/metro" className="transition-colors hover:text-sv-blue">
                U-Bahn & S-Bahn
              </Link>
            </li>
            <li className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-sv-ink/30" aria-hidden />
              <span aria-current="page" className="text-sv-ink/80">
                Deutschland
              </span>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-sv-blue/10 px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-sv-blue-deep">
            <SparkMark className="h-3.5 w-3.5" aria-hidden /> {GERMAN_METRO_SYSTEMS.length} Systeme · {totalLines()} Linien · {totalStations()} Stationen
          </span>
          <h1 className="max-w-[900px] text-balance text-[30px] font-black tracking-[-0.02em] text-sv-ink md:text-[44px]">
            U-Bahn & Stadtbahnen in Deutschland
          </h1>
          <p className="mt-3 max-w-[720px] text-[15px] font-semibold text-sv-ink/60 md:text-[16px]">{DESCRIPTION}</p>
        </header>

        {/* Berlin highlight */}
        <section className="mb-10 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-8">
          <h2 className="mb-4 flex items-center gap-2.5 text-[20px] font-black tracking-[-0.02em] text-sv-ink">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-sv-blue text-[13px] font-black text-white">
              B
            </span>
            Berlin
          </h2>
          <p className="mb-4 text-[14px] font-medium text-sv-ink/60">
            Die größte U-Bahn Deutschlands — {BERLIN_UBAHN.length + BERLIN_SBAHN.length} Linien,{' '}
            {BERLIN_U_STATIONS.length + BERLIN_S_STATIONS.length} Stationen auf sivrce.
          </p>
          <Link
            href="/de/metro"
            className="inline-flex items-center gap-2 rounded-module bg-sv-blue px-5 py-2.5 text-[13px] font-black text-white shadow-card transition hover:shadow-card-hover"
          >
            Alle Berliner Stationen
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </section>

        {/* All systems grid */}
        <section aria-label="Alle Systeme">
          <h2 className="mb-5 text-[22px] font-black tracking-[-0.02em] text-sv-ink">
            Alle Systeme
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {GERMAN_METRO_SYSTEMS.map((sys) => {
              const sysLines = sys.lines.length
              const sysStations = sys.stations.length
              return (
                <Link
                  key={sys.citySlug}
                  href={`/de/${sys.citySlug}`}
                  className="group block rounded-card border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card transition hover:border-sv-blue/20 hover:shadow-card-hover"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-[17px] font-black text-sv-ink group-hover:text-sv-blue">
                        {sys.name}
                      </h3>
                      <p className="mt-1 text-[12px] font-bold text-sv-ink/60">Deutschland</p>
                    </div>
                    <SystemBadge sys={sys} />
                  </div>
                  <dl className="mb-4 grid grid-cols-2 gap-3">
                    <div>
                      <dd className="text-[16px] font-black text-sv-ink">{sysStations}</dd>
                      <dt className="text-[11px] font-bold uppercase tracking-wide text-sv-ink/60">Stationen</dt>
                    </div>
                    <div>
                      <dd className="text-[16px] font-black text-sv-ink">{sysLines}</dd>
                      <dt className="text-[11px] font-bold uppercase tracking-wide text-sv-ink/60">Linien</dt>
                    </div>
                  </dl>
                  <div className="flex flex-wrap gap-1.5">
                    {sys.lines.slice(0, 6).map((l) => (
                      <span
                        key={`${sys.citySlug}-${l.name}`}
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${lineBadge(l.color).cls}`}
                        style={{ backgroundColor: lineBadge(l.color).bg }}
                      >
                        {l.name}
                      </span>
                    ))}
                    {sys.lines.length > 6 && (
                      <span className="inline-flex items-center rounded-full bg-sv-ink/10 px-2 py-0.5 text-[10px] font-bold text-sv-ink/60">
                        +{sys.lines.length - 6}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* SEO text */}
        <section className="mt-14 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-10">
          <h2 className="text-[20px] font-black tracking-[-0.02em] text-sv-ink md:text-[24px]">
            Deutsche Nahverkehrssysteme — Übersicht
          </h2>
          <p className="mt-3 max-w-[860px] text-[15px] font-medium leading-relaxed text-sv-ink/65">
            Deutschland verfügt über ein dichtes, regional unterschiedlich organisiertes Nahverkehrsnetz. Die Berliner U-Bahn und S-Bahn sind mit {BERLIN_UBAHN.length + BERLIN_SBAHN.length} Linien und {BERLIN_U_STATIONS.length + BERLIN_S_STATIONS.length} erfassten Stationen der umfangreichste Abschnitt dieser Übersicht. München, Hamburg und Frankfurt folgen mit ihren eigenen Systemen. sivrce zeigt Linien und Stationen als Orientierung für die Wohnungssuche; Angebote erscheinen erst, wenn sie veröffentlicht und prüfbar sind.
          </p>
        </section>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(germanyLd()) }} />
    </div>
  )
}
