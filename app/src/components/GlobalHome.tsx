import type { Metadata } from 'next'
import HomeMain from '@/components/HomeMain'
import GeoGate from '@/components/country/GeoGate'
import { jsonLd } from '@/lib/utils'
import { COM_ORIGIN, COUNTRY_IDS, MARKETS } from '@/lib/markets'
import { COUNTRY_NAMES } from '@/lib/country-copy'

/**
 * sivrce.com worldwide hub — same product shell as sivrce.ge (HomeMain),
 * English default. GeoGate + proxy 302 auto-land humans on their market;
 * crawlers / ?worldwide / cookie=global keep this page. Country grid below
 * the rails gives crawlers and wanderers a visible world index.
 */

export const metadata: Metadata = {
  title: 'sivrce — real estate, globally',
  description:
    'sivrce.com is the global sivrce product — same search, map, and rails as sivrce.ge, auto-located to your market. Georgia live inventory at /ge. Every other country is an ISO path on this host.',
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
      'One sivrce product worldwide. Georgia on /ge (and sivrce.ge). Other markets auto-open from your location.',
    images: [{ url: '/images/og-brand.png', width: 1200, height: 630, alt: 'sivrce' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'sivrce — real estate, globally',
    description: 'Same sivrce product on every host — location picks the market and the inventory.',
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
        { '@type': 'ListItem', position: 1, name: 'Georgia', url: `${COM_ORIGIN}/ge` },
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

const titleCase = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

export default function GlobalHome() {
  return (
    <>
      <GeoGate />
      <HomeMain lang="en" market="global" />
      <section aria-labelledby="world-countries" className="border-t border-sv-ink/[0.06] bg-sv-cloud">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <h2 id="world-countries" className="mb-2 text-2xl font-black tracking-[-0.02em] text-sv-ink">
            Real estate in {COUNTRY_IDS.length} countries
          </h2>
          <p className="mb-8 text-sv-ink/60">
            Every market on one product — pick a country, land on its hub with live search, map and city guides.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {COUNTRY_IDS.map((cc) => {
              const m = MARKETS[cc]
              return (
                <a
                  key={cc}
                  href={`${COM_ORIGIN}${m.pathPrefix}`}
                  className="group rounded-module border border-sv-edge bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:border-sv-blue/40 hover:shadow-card-hover"
                >
                  <span className="block text-sm font-bold text-sv-ink group-hover:text-sv-blue">
                    {COUNTRY_NAMES[cc]}
                  </span>
                  <span className="mt-0.5 block truncate text-xs font-semibold text-sv-ink/45">
                    {titleCase(m.defaultCitySlug)}
                  </span>
                </a>
              )
            })}
          </div>
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
    </>
  )
}
