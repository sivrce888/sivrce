import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, LayoutGrid, MapPin, Search, TrendingUp } from 'lucide-react'
import { SparkMark } from '@/components/SparkMark'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import ListingCard from '@/components/ListingCard'
import MetroStationMapIdle from '@/components/MetroStationMapLazy'
import { Chip } from '@/components/seo/SeoLanding'
import { formatUSD, type Listing } from '@/data/listings'
import {
  getBerlinStation,
  DE_METRO_RADIUS_M,
  type DeMetroStation,
} from '@/data/germany-metro'
import { getListingsNearMetro } from '@/lib/listings-db'
import { jsonLd } from '@/lib/utils'
import { listingPath } from '@/lib/listing-slug'
import { deOnlyAlternates } from '@/lib/i18n/server'

const BASE = 'https://sivrce.com'

export const revalidate = 300

async function resolve(stationSlug: string) {
  const station = getBerlinStation(stationSlug)
  if (!station) return null
  const listings = await getListingsNearMetro(station.lat, station.lng, DE_METRO_RADIUS_M)
  return { station, listings }
}

interface PageProps {
  params: Promise<{ station: string }>
}

function titleOfStation(station: DeMetroStation, count: number): string {
  const base = `Wohnungen ${station.name}, Berlin`
  return count > 0 ? `${base} — ${count} Angebote` : `${base} — Kaufen & Mieten`
}

function descriptionOfStation(station: DeMetroStation, listings: Listing[]): string {
  if (listings.length === 0) {
    return (
      `Wohnungen ${station.name}, Berlin — kaufen und mieten. ` +
      `Verifizierte Angebote, KI-Bewertung und direkter Kontakt auf sivrce.`
    )
  }
  const s = listings.length
  return (
    `${s} Angebote bei ${station.name}, Berlin — Preise ab ${formatUSD(Math.min(...listings.map((l) => l.priceUSD)))}. ` +
    `KI-Bewertung und direkter Kontakt auf sivrce.`
  )
}

function introOfStation(station: DeMetroStation, listings: Listing[]): string {
  const lines = station.lines.join(' / ')
  if (listings.length === 0) {
    return (
      `„${station.name}" — Station der Linie ${lines}${station.zone ? ` in Zone ${station.zone}` : ''}. ` +
      `Derzeit gibt es keine aktiven Angebote in Gehweite, aber das Angebot ändert sich täglich — ` +
      `sobald ein Angebot erscheint, finden Sie hier Preis, Fotos und KI-Bewertung.`
    )
  }
  return (
    `„${station.name}" — Station der Linie ${lines}${station.zone ? ` in Zone ${station.zone}` : ''}. ` +
    `Der Berliner Nahverkehr (BVG / S-Bahn Berlin) ist dicht getaktet und zuverlässig — ` +
    `Wohnungen in Stationsnähe sind daher gefragt. Aktuell ${listings.length} Angebote in ${DE_METRO_RADIUS_M}m Gehweite. ` +
    `Jedes Angebot wird von sivrce verifiziert: Eigentümer-Verifizierung, Fotoauthentizität und KI-Preisbewertung.`
  )
}

function faqsOfStation(station: DeMetroStation, listings: Listing[]) {
  return [
    {
      q: `Was kostet eine Wohnung ${station.name}?`,
      a: listings.length > 0
        ? `Derzeit ${listings.length} Angebote ab ${formatUSD(Math.min(...listings.map((l) => l.priceUSD)))}. Die KI-Preisbewertung steht auf jeder Angebotskarte.`
        : `Der Preis hängt von Größe, Etage, Ausstattung und Entfernung zur Station ab. Schauen Sie auf der Bezirksseite nach aktuellen Preisen.`,
    },
    {
      q: `Warum sind Wohnungen ${station.name} gefragt?`,
      a: `Die Berliner U-Bahn und S-Bahn sind dicht getaktet und zuverlässig — die Fahrzeit ist zu jeder Tageszeit vorhersagbar. Daher sind Wohnungen in Stationsnähe gefragter und verkaufen sich schneller.`,
    },
    {
      q: `Wie finde ich verifizierte Angebote ${station.name}?`,
      a: `Auf dieser Seite sehen Sie alle aktiven Angebote innerhalb von ${DE_METRO_RADIUS_M}m Gehweite. Auf sivrce wird jedes Angebot verifiziert: Eigentümer-Verifizierung, Fotoauthentizität und KI-Preisbewertung.`,
    },
  ]
}

function stationLd(
  station: DeMetroStation,
  listings: Listing[],
  crumbs: { name: string; href: string }[],
  faqs: { q: string; a: string }[],
  title: string,
  description: string,
) {
  const path = `/de/metro/${station.slug}`
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: title,
        description,
        url: `${BASE}${path}`,
        inLanguage: 'de',
        isPartOf: { '@id': `${BASE}/#website` },
      },
      {
        '@type': 'TransitStation',
        name: `${station.name} — Berliner ${station.lines[0]?.startsWith('U') ? 'U-Bahn' : 'S-Bahn'}-Station`,
        alternateName: `${station.nameEn} Station Berlin`,
        geo: { '@type': 'GeoCoordinates', latitude: station.lat, longitude: station.lng },
        containedInPlace: { '@type': 'City', name: 'Berlin' },
        address: { '@type': 'PostalAddress', addressLocality: 'Berlin', addressCountry: 'DE' },
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
  const description = descriptionOfStation(ctx.station, ctx.listings)
  const path = `/de/metro/${ctx.station.slug}`
  return {
    title,
    description,
    alternates: deOnlyAlternates(path),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${BASE}${path}`,
      siteName: 'sivrce',
      locale: 'de_DE',
      images: [{ url: '/images/og-brand.png', width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: ['/images/og-brand.png'] },
  }
}

export default async function BerlinMetroStationPage({ params }: PageProps) {
  const { station: s } = await params
  const ctx = await resolve(s)
  if (!ctx) notFound()
  const { station, listings } = ctx

  const stats = listings.length > 0
    ? {
        count: listings.length,
        minPrice: Math.min(...listings.map((l) => l.priceUSD)),
        maxPrice: Math.max(...listings.map((l) => l.priceUSD)),
        avgPerM2: listings.length > 0 && listings[0].perM2USD
          ? Math.round(listings.reduce((sum, l) => sum + (l.perM2USD ?? 0), 0) / listings.length)
          : null,
      }
    : null

  const faqs = faqsOfStation(station, listings)
  const title = titleOfStation(station, listings.length)
  const description = descriptionOfStation(station, listings)

  const crumbs = [
    { name: 'Startseite', href: '/de' },
    { name: 'U-Bahn & S-Bahn', href: '/de/metro' },
    { name: station.name, href: `/de/metro/${station.slug}` },
  ]

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main" className="sv-pt-nav mx-auto max-w-[1440px] px-5 pb-20 md:px-10">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6">
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
            <SparkMark className="h-3.5 w-3.5" aria-hidden />
            {station.lines.join(' / ')} · Berlin
          </span>
          <h1 className="max-w-[900px] text-balance text-[30px] font-black tracking-[-0.02em] text-sv-ink md:text-[44px]">
            Wohnungen {station.name}
          </h1>
          <p className="mt-3 max-w-[720px] text-[15px] font-semibold text-sv-ink/60 md:text-[16px]">{description}</p>

          {/* Live stats */}
          {stats && (
            <dl className="mt-6 flex flex-wrap gap-3">
              {[
                { icon: LayoutGrid, label: 'Angebote', value: String(stats.count) },
                ...(stats.avgPerM2
                  ? [{ icon: TrendingUp, label: 'Durchschnitt', value: `${formatUSD(stats.avgPerM2)}/m²` }]
                  : []),
                { icon: MapPin, label: 'Ab', value: formatUSD(stats.minPrice) },
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

        {/* Link mesh */}
        <div className="mb-8 flex flex-wrap gap-2">
          <Chip label={`Suche: ${station.name}`} href={`/en/search?country=DE&q=${encodeURIComponent(station.name)}`} />
          {station.interchange && station.lines.length > 1 && (
            <Chip label={`${station.name} — Alle Linien`} href={`/en/search?country=DE&q=${encodeURIComponent(station.name)}`} active />
          )}
          <Chip label="Alle Stationen" href="/de/metro" />
        </div>

        {/* Station map */}
        <section aria-label="Karte" className="mb-8">
          <MetroStationMapIdle
            lat={station.lat}
            lng={station.lng}
            stationName={station.name}
            lines={station.lines}
          />
        </section>

        {/* Listings */}
        {listings.length > 0 ? (
          <section aria-label="Angebote" className="sv-card-grid">
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
              Noch keine Angebote in der Nähe
            </h2>
            <p className="mx-auto mt-2 max-w-[520px] text-[14px] font-medium leading-relaxed text-sv-ink/60">
              Das Angebot ändert sich täglich — suchen Sie nach Wohnung, durchstöbern Sie den Bezirk oder besuchen Sie benachbarte Stationen.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Chip label={`Suche: ${station.name}`} href={`/en/search?country=DE&q=${encodeURIComponent(station.name)}`} active />
              <Chip label="Alle Stationen" href="/de/metro" />
            </div>
          </section>
        )}

        {/* SEO intro */}
        <section className="mt-14 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-10">
          <h2 className="text-[20px] font-black tracking-[-0.02em] text-sv-ink md:text-[24px]">
            Wohnungen {station.name} — Marktübersicht
          </h2>
          <p className="mt-3 max-w-[860px] text-[15px] font-medium leading-relaxed text-sv-ink/65">
            {introOfStation(station, listings)}
          </p>
        </section>

        {/* FAQ */}
        <section className="mt-10" aria-label="Häufig gestellte Fragen">
          <h2 className="mb-5 text-[20px] font-black tracking-[-0.02em] text-sv-ink md:text-[24px]">
            Häufig gestellte Fragen
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
          __html: jsonLd(stationLd(station, listings, crumbs, faqs, title, description)),
        }}
      />
    </div>
  )
}
