import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { Reveal } from '@/components/Reveal'
import { jsonLd } from '@/lib/utils'
import { COM_ORIGIN, COUNTRY_IDS, GE_ORIGIN, MARKETS } from '@/lib/markets'
import { COUNTRY_NAMES } from '@/lib/country-copy'
import GeoGate from '@/components/country/GeoGate'

export const metadata: Metadata = {
  title: 'sivrce — real estate, globally',
  description:
    'sivrce is the global real-estate company. Georgia’s live marketplace is sivrce.ge. Country markets use ISO paths on sivrce.com — /de, /ae, /fr, /es, /it, /gb, /us, /ca, /tr. /uae redirects to /ae; /uk redirects to /gb.',
  alternates: {
    canonical: `${COM_ORIGIN}/`,
    languages: {
      'x-default': `${COM_ORIGIN}/`,
      en: `${COM_ORIGIN}/`,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${COM_ORIGIN}/`,
    siteName: 'sivrce',
    title: 'sivrce — real estate, globally',
    description:
      'Georgia on sivrce.ge. Country markets on sivrce.com with one canonical URL each. No cloned homepages.',
    images: [{ url: '/images/og-brand.png', width: 1200, height: 630, alt: 'sivrce' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'sivrce — real estate, globally',
    description: 'Georgia plus ISO country paths on sivrce.com. Canonical URLs, not duplicate indexes.',
    images: ['/images/og-brand.png'],
  },
}

const ld = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${COM_ORIGIN}/#organization`,
      name: 'sivrce',
      url: COM_ORIGIN,
      logo: { '@type': 'ImageObject', url: `${COM_ORIGIN}/icon.png`, width: 512, height: 512 },
      email: 'hi@sivrce.ge',
      areaServed: [
        { '@type': 'Country', name: 'Georgia' },
        ...COUNTRY_IDS.map((cc) => ({ '@type': 'Country' as const, name: COUNTRY_NAMES[cc] })),
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${COM_ORIGIN}/#website`,
      url: COM_ORIGIN,
      name: 'sivrce',
      inLanguage: ['en', 'ka', 'ar', 'de'],
      publisher: { '@id': `${COM_ORIGIN}/#organization` },
    },
    {
      '@type': 'ItemList',
      name: 'sivrce markets',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Georgia', url: GE_ORIGIN },
        ...COUNTRY_IDS.map((cc, i) => ({
          '@type': 'ListItem' as const,
          position: i + 2,
          name: COUNTRY_NAMES[cc],
          url: `${COM_ORIGIN}${MARKETS[cc].pathPrefix}`,
        })),
      ],
    },
  ],
}

export default function GlobalHome() {
  return (
    <>
      <GeoGate />
      <Navbar />
      <main id="main">
        <PageHero
          kicker="sivrce.com"
          title={
            <>
              <span className="block">Real estate</span>
              <span className="text-gradient-blue">country by country</span>
            </>
          }
          subtitle="Georgia is the live marketplace on sivrce.ge. Every other country is an ISO path on sivrce.com so Google and answer engines see one canonical URL per market."
        />
        <div className="sv-container py-14">
          <Reveal>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <li>
                <a
                  href={GE_ORIGIN}
                  className="block rounded-[26px] border border-sv-ink/8 bg-sv-surface p-6 shadow-card"
                >
                  <p className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-sv-blue">Georgia · GEL</p>
                  <h2 className="mt-2 text-[22px] font-black tracking-tight">sivrce.ge</h2>
                  <p className="mt-3 text-[15px] font-medium text-sv-ink/70">
                    Live listings, 3D map, cadastre, new-builds. Georgian unprefixed, English at /en.
                  </p>
                </a>
              </li>
              {COUNTRY_IDS.map((cc) => (
                <li key={cc}>
                  <Link
                    href={`/en${MARKETS[cc].pathPrefix}`}
                    className="block rounded-[26px] border border-sv-ink/8 bg-sv-surface p-6 shadow-card"
                  >
                    <p className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-sv-blue">
                      {COUNTRY_NAMES[cc]} · {MARKETS[cc].currency}
                    </p>
                    <h2 className="mt-2 text-[22px] font-black tracking-tight">
                      sivrce.com{MARKETS[cc].pathPrefix}
                    </h2>
                    <p className="mt-3 text-[15px] font-medium text-sv-ink/70">
                      {cc === 'ae'
                        ? 'Dubai and Abu Dhabi. /uae redirects here. Arabic at /ar/ae.'
                        : cc === 'gb'
                          ? 'London and Manchester. /uk redirects here so it never collides with Ukrainian locale.'
                          : `City guides now, verified listings as inventory lands.`}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
    </>
  )
}
