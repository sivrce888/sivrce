import type { Metadata } from 'next'
import HomeMain from '@/components/HomeMain'
import GeoGate from '@/components/country/GeoGate'
import { jsonLd } from '@/lib/utils'
import { COM_ORIGIN, COUNTRY_IDS, MARKETS } from '@/lib/markets'
import { COUNTRY_NAMES } from '@/lib/country-copy'

/**
 * sivrce.com worldwide hub — same product shell as sivrce.ge (HomeMain),
 * English default. GeoGate + proxy 302 auto-land humans on their market;
 * crawlers / ?worldwide / cookie=global keep this page.
 * ponytail: delete the link-farm; MarketSwitcher covers country hops.
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

export default function GlobalHome() {
  return (
    <>
      <GeoGate />
      <HomeMain lang="en" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
    </>
  )
}
