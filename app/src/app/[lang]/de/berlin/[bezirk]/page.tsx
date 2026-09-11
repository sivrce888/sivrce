import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowUpRight, Building2, Home, MapPin, ShieldCheck } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { Reveal } from '@/components/Reveal'
import DeProjectCard from '@/components/country/DeProjectCard'
import { BERLIN_BEZIRKE } from '@/lib/countries/de'
import {
  bezirkBySlug,
  bezirkCenter,
  bezirkStats,
  developersOfBezirk,
  ortsteileOfBezirk,
  projectsOfBezirk,
} from '@/lib/countries/de-berlin'
import { isValidLang, type Lang } from '@/lib/i18n/core'
import { COM_ORIGIN, canonicalIntent } from '@/lib/markets'
import CountryPage, { countryMetadata } from '@/components/country/CountryMarket'
import { jsonLd } from '@/lib/utils'

/**
 * /de/berlin/<bezirk> — one page per official Berlin Bezirk. Every number is
 * derived at build from the street-verified catalog + OSM Ortsteile table
 * (de-berlin.ts); nothing here is hand-written, so pages can't drift.
 * This route is more specific than /de/[[...slug]], so the intent slugs
 * (buy/sale/rent) that used to fall through to the catch-all are delegated
 * back to it unchanged.
 */

export const revalidate = 86400

/** buy/sale/rent under /de/berlin belong to CountryPage's intent flow. */
function isIntentSlug(seg: string): boolean {
  return canonicalIntent(seg) !== null
}

function asCountryParams(lang: string, bezirk: string): Promise<{ lang: string; slug?: string[] }> {
  return Promise.resolve({ lang, slug: ['berlin', bezirk] })
}

export function generateStaticParams() {
  return BERLIN_BEZIRKE.map((b) => ({ bezirk: b.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; bezirk: string }>
}): Promise<Metadata> {
  const { lang: raw, bezirk: slug } = await params
  if (isIntentSlug(slug)) {
    return countryMetadata('de', asCountryParams(raw, slug))
  }
  const de = raw === 'de'
  const b = bezirkBySlug(slug)
  if (!b) return {}
  const s = bezirkStats(slug)
  const url = `${COM_ORIGIN}/de/berlin/${slug}`
  const title = de
    ? `${b.de}: ${s.projects} Neubau-Projekte & Bauträger | sivrce`
    : `${b.de}, Berlin: ${s.projects} new-build projects & developers | sivrce`
  const description = de
    ? `Neubau in ${b.de}: ${s.projects} straßenverifizierte Projekte, ${s.pipelineUnits} Wohnungen in der Pipeline, ${s.developers} Bauträger, ${s.ortsteile} Ortsteile. Adressgenau getrackt.`
    : `New-builds in ${b.de}, Berlin: ${s.projects} street-verified projects, ${s.pipelineUnits} homes in the pipeline, ${s.developers} developers, ${s.ortsteile} Ortsteile. Tracked to the address.`
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: url,
      languages: { en: url, 'x-default': url, de: `${COM_ORIGIN}/de/de/berlin/${slug}` },
    },
    openGraph: {
      type: 'website',
      locale: de ? 'de_DE' : 'en_US',
      url,
      siteName: 'sivrce',
      title,
      description,
      images: [{ url: '/images/og-brand.png', width: 1200, height: 630, alt: b.de }],
    },
    robots: { index: true, follow: true },
  }
}

const nfEn = new Intl.NumberFormat('en-US')
const nfDe = new Intl.NumberFormat('de-DE')

export default async function BezirkPage({
  params,
}: {
  params: Promise<{ lang: string; bezirk: string }>
}) {
  const { lang: raw, bezirk: slug } = await params
  if (isIntentSlug(slug)) {
    return CountryPage({ country: 'de', params: asCountryParams(raw, slug) })
  }
  const lang: Lang = isValidLang(raw) ? raw : 'en'
  const de = lang === 'de'
  const b = bezirkBySlug(slug)
  if (!b) notFound()

  const s = bezirkStats(slug)
  const projects = projectsOfBezirk(slug).sort(
    (a, x) => (a.done >= 100 ? 1 : 0) - (x.done >= 100 ? 1 : 0) || x.done - a.done,
  )
  const devs = developersOfBezirk(slug)
  const ortsteile = ortsteileOfBezirk(slug)
  const center = bezirkCenter(slug)
  const fmt = de ? nfDe : nfEn

  const url = `${COM_ORIGIN}/de/berlin/${slug}`
  const crumbs = [
    { name: 'sivrce', href: 'https://sivrce.com/' },
    { name: de ? 'Deutschland' : 'Germany', href: `${COM_ORIGIN}/de` },
    { name: 'Berlin', href: `${COM_ORIGIN}/de/berlin` },
    { name: b.de, href: url },
  ]

  const stats = [
    { icon: Building2, n: fmt.format(s.projects), label: de ? 'straßenverifizierte Neubauten' : 'street-verified new-builds' },
    { icon: Home, n: fmt.format(s.pipelineUnits), label: de ? 'Wohnungen in der Pipeline' : 'homes in the pipeline' },
    { icon: ShieldCheck, n: fmt.format(s.developers), label: de ? 'aktive Bauträger' : 'active developers' },
    s.medianEurM2 !== null
      ? { icon: MapPin, n: `${fmt.format(s.medianEurM2)} €/m²`, label: de ? `Median (${s.priced} veröffentlichte)` : `median (${s.priced} published)` }
      : { icon: MapPin, n: fmt.format(s.ortsteile), label: de ? 'Ortsteile' : 'Ortsteile' },
  ]

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: `${b.de} — ${de ? 'Neubau' : 'new-builds'}`,
        inLanguage: de ? 'de' : 'en',
        isPartOf: { '@id': `${COM_ORIGIN}/#website` },
      },
      {
        '@type': 'Place',
        '@id': `${url}#place`,
        name: `Bezirk ${b.de}`,
        containedInPlace: { '@type': 'Place', name: 'Berlin', address: { '@type': 'PostalAddress', addressCountry: 'DE', addressLocality: 'Berlin' } },
        ...(center ? { geo: { '@type': 'GeoCoordinates', latitude: center.lat, longitude: center.lng } } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.href })),
      },
      ...(projects.length
        ? [{
            '@type': 'ItemList',
            itemListElement: projects.map((p, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              url: `${COM_ORIGIN}/de/projects/${p.slug}`,
              name: p.name,
            })),
          }]
        : []),
    ],
  }

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        {/* Visible breadcrumb stays same-origin (sivrce.com). */}
        <nav aria-label="Breadcrumb" className="mx-auto max-w-[1440px] px-5 pt-6 md:px-10">
          <ol className="flex flex-wrap items-center gap-1.5 text-[12px] font-bold text-sv-ink/50">
            {crumbs.map((c, i) => (
              <li key={c.href} className="flex items-center gap-1.5">
                {i > 0 && <span aria-hidden>/</span>}
                {i === crumbs.length - 1 ? (
                  <span className="text-sv-ink/75">{c.name}</span>
                ) : (
                  <a href={c.href} className="hover:text-sv-blue">{c.name}</a>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <section className="mx-auto max-w-[1440px] px-5 py-10 md:px-10 md:py-14">
          <Reveal>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-sv-blue/10 px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-sv-blue-deep dark:text-sv-blue-light">
              <MapPin className="h-3.5 w-3.5" /> {de ? 'Bezirk · Berlin' : 'Borough · Berlin'}
            </span>
            <h1 className="sv-h1 text-sv-ink">
              {de ? `Neubau in ${b.de}` : `New-builds in ${b.de}`}
            </h1>
            <p className="mt-3 max-w-2xl text-[16px] font-semibold leading-relaxed text-sv-ink/65">
              {de
                ? `${s.projects} Projekte mit Hausnummer, ${s.pipelineUnits} Wohnungen in der Pipeline und ${s.developers} Bauträger — bezirksgenau aus dem straßenverifizierten Katalog,${s.medianEurM2 !== null ? ` Median ${nfDe.format(s.medianEurM2)} €/m² wo veröffentlicht.` : ' Preise, wo der Bauträger sie nennt.'}`
                : `${s.projects} address-verified projects, ${s.pipelineUnits} homes in the pipeline and ${s.developers} developers — computed borough-exact from the street-verified catalog,${s.medianEurM2 !== null ? ` median ${nfEn.format(s.medianEurM2)} €/m² where published.` : ' prices where developers publish them.'}`}
            </p>
          </Reveal>
        </section>

        <section className="bg-sv-cloud py-10 md:py-14">
          <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-4 px-5 md:grid-cols-4 md:px-10">
            {stats.map((st, i) => (
              <Reveal key={st.label} delay={i * 0.02} className="h-full">
                <div className="flex h-full flex-col gap-2 rounded-card border border-sv-ink/[0.07] bg-sv-surface p-5 shadow-card md:p-6">
                  <st.icon className="h-5 w-5 text-sv-blue" aria-hidden />
                  <span className="text-[28px] font-black tracking-tight text-sv-ink md:text-[34px]">{st.n}</span>
                  <span className="text-[13px] font-bold leading-snug text-sv-ink/60">{st.label}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {projects.length > 0 && (
          <section className="mx-auto max-w-[1440px] px-5 py-14 md:px-10 md:py-20">
            <Reveal className="mb-8">
              <h2 className="sv-h2 text-sv-ink">{de ? `Projekte in ${b.de}` : `Projects in ${b.de}`}</h2>
              <p className="mt-2 max-w-2xl text-[15px] font-semibold text-sv-ink/65">
                {de
                  ? 'Jede Zeile ist gegen die offizielle Bauträgerquelle geprüft — Hausnummer, Einheiten, Fertigstellung.'
                  : 'Every row is verified against the official developer source — house number, units, completion.'}
              </p>
            </Reveal>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {projects.map((p) => (
                <li key={p.slug} className="flex">
                  <DeProjectCard p={p} dev={devs.find((d) => d.slug === p.developerSlug)?.name.en} de={de} full />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="bg-sv-cloud py-14 md:py-20">
          <div className="mx-auto max-w-[1440px] px-5 md:px-10">
            <Reveal className="mb-8">
              <h2 className="sv-h2 text-sv-ink">
                {de ? `${ortsteile.length} Ortsteile in ${b.de}` : `${ortsteile.length} Ortsteile in ${b.de}`}
              </h2>
              <p className="mt-2 max-w-2xl text-[15px] font-semibold text-sv-ink/65">
                {de
                  ? 'Amtliche Ortsteilgrenzen (admin_level=10), Mittelpunkte aus OpenStreetMap.'
                  : 'Official Ortsteile (admin_level=10), centers from OpenStreetMap.'}
              </p>
            </Reveal>
            <Reveal>
              <ul className="flex flex-wrap gap-2.5">
                {ortsteile.map((o) => (
                  <li
                    key={o.slug}
                    className="rounded-full border border-sv-ink/[0.07] bg-sv-surface px-4 py-2 text-[13px] font-extrabold text-sv-ink/75"
                  >
                    {o.de}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {devs.length > 0 && (
          <section className="mx-auto max-w-[1440px] px-5 py-14 md:px-10 md:py-20">
            <Reveal className="mb-8">
              <h2 className="sv-h2 text-sv-ink">{de ? 'Bauträger im Bezirk' : 'Developers in this borough'}</h2>
            </Reveal>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {devs.map((d) => (
                <li key={d.slug}>
                  <Link
                    href={`/en/developers/${d.slug}`}
                    className="group flex h-full items-center gap-4 rounded-module border border-sv-ink/[0.07] bg-sv-surface px-5 py-4 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-sv-blue/30 hover:shadow-card-hover"
                  >
                    <span
                      aria-hidden
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-sv-blue/10 text-[14px] font-black text-sv-blue-deep dark:text-sv-blue-light"
                    >
                      {d.name.en.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-black text-sv-ink">{d.name.en}</span>
                      <span className="block truncate text-[12px] font-bold text-sv-ink/60">
                        {d.yearsActive} {de ? 'J.' : 'yrs'} · {fmt.format(d.unitsDelivered)} {de ? 'WE übergeben' : 'units delivered'}
                      </span>
                    </span>
                    <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-sv-ink/30 transition-colors group-hover:text-sv-blue" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="bg-sv-cloud py-14 md:py-20">
          <div className="mx-auto max-w-[1440px] px-5 md:px-10">
            <Reveal className="mb-8">
              <h2 className="sv-h2 text-sv-ink">{de ? 'Alle Berliner Bezirke' : 'All Berlin boroughs'}</h2>
            </Reveal>
            <Reveal>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {BERLIN_BEZIRKE.filter((x) => x.slug !== slug).map((x) => (
                  <li key={x.slug}>
                    <Link
                      href={`/de/berlin/${x.slug}`}
                      className="flex items-center justify-between gap-3 rounded-module border border-sv-ink/[0.07] bg-sv-surface px-5 py-4 font-extrabold text-sv-ink shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-sv-blue/30 hover:shadow-card-hover"
                    >
                      <span className="text-[15px]">{x.de}</span>
                      <span className="text-[12px] font-black text-sv-blue">
                        {bezirkStats(x.slug).projects} {de ? 'Projekte' : 'projects'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 pb-16 md:px-10 md:pb-24">
          <Reveal>
            <p className="text-[13px] font-semibold leading-relaxed text-sv-ink/45">
              {de
                ? `Methodik: Projektdaten aus dem straßenverifizierten Katalog (offizielle Bauträgerquellen, Stand 2026-09); Bezirkszuordnung über Katalog-Distrikt, Fallback nächstgelegener Ortsteil. Ortsteile und Mittelpunkte: © OpenStreetMap contributors (ODbL). Zahlen neu berechnet bei jedem Katalog-Update.`
                : `Methodology: project data from the street-verified catalog (official developer sources, as of 2026-09); borough assignment via catalog district, falling back to nearest Ortsteil. Ortsteile and centers: © OpenStreetMap contributors (ODbL). Counts recompute on every catalog update.`}
            </p>
          </Reveal>
        </section>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
    </div>
  )
}
