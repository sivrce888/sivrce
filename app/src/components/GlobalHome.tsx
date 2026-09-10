import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { Reveal } from '@/components/Reveal'
import { jsonLd } from '@/lib/utils'
import { COM_ORIGIN, COUNTRY_IDS, GE_ORIGIN, MARKETS } from '@/lib/markets'
import { COUNTRY_NAMES } from '@/lib/country-copy'

export const metadata: Metadata = {
  title: 'sivrce — real estate, globally',
  description:
    'sivrce is the global real-estate platform. Georgia lives on sivrce.ge. Germany and the UAE use country paths on sivrce.com. sivrce.de and sivrce.ae permanently redirect.',
  alternates: {
    canonical: `${COM_ORIGIN}/`,
    languages: {
      'x-default': `${COM_ORIGIN}/`,
      en: `${COM_ORIGIN}/`,
      ka: `${GE_ORIGIN}/`,
      de: `${GE_ORIGIN}/de`,
      ar: `${COM_ORIGIN}/ar/ae`,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${COM_ORIGIN}/`,
    siteName: 'sivrce',
    title: 'sivrce — real estate, globally',
    description:
      'Georgia on sivrce.ge. Germany at sivrce.com/de. UAE at sivrce.com/ae. One company, country paths, no duplicate indexes.',
    images: [{ url: '/images/og-brand.png', width: 1200, height: 630, alt: 'sivrce' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'sivrce — real estate, globally',
    description: 'Georgia plus Germany and the UAE. Canonical country URLs, not cloned homepages.',
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
          subtitle="Georgia is the live marketplace on sivrce.ge. Germany and the UAE use paths on sivrce.com so Google and answer engines see one canonical URL per market."
        />
        <div className="sv-container py-14">
          <Reveal>
            <ul className="grid gap-4 md:grid-cols-3">
              <li>
                <a
                  href={GE_ORIGIN}
                  className="block rounded-[26px] border border-sv-ink/8 bg-sv-surface p-6 shadow-card"
                >
                  <p className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-sv-blue">Georgia</p>
                  <h2 className="mt-2 text-[22px] font-black tracking-tight">sivrce.ge</h2>
                  <p className="mt-3 text-[15px] font-medium text-sv-ink/70">
                    Live listings, 3D map, cadastre, new-builds. Georgian unprefixed, German at /de, English at /en.
                  </p>
                </a>
              </li>
              <li>
                <Link
                  href="/en/de"
                  className="block rounded-[26px] border border-sv-ink/8 bg-sv-surface p-6 shadow-card"
                >
                  <p className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-sv-blue">Germany · EUR</p>
                  <h2 className="mt-2 text-[22px] font-black tracking-tight">sivrce.com/de</h2>
                  <p className="mt-3 text-[15px] font-medium text-sv-ink/70">
                    Berlin-first guides. sivrce.de redirects here. Listings when verified inventory lands.
                  </p>
                </Link>
              </li>
              <li>
                <Link
                  href="/en/ae"
                  className="block rounded-[26px] border border-sv-ink/8 bg-sv-surface p-6 shadow-card"
                >
                  <p className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-sv-blue">UAE · AED</p>
                  <h2 className="mt-2 text-[22px] font-black tracking-tight">sivrce.com/ae</h2>
                  <p className="mt-3 text-[15px] font-medium text-sv-ink/70">
                    Dubai and Abu Dhabi. sivrce.ae redirects here. Arabic at /ar/ae.
                  </p>
                </Link>
              </li>
            </ul>
          </Reveal>
          <p className="mt-10 max-w-2xl text-[14px] font-medium text-sv-ink/50">
            Adding FR, ES, IT, UK, US, CA or TR is a new row in the market table plus unique copy — not a new app.
            Currency {MARKETS.de.currency} / {MARKETS.ae.currency} / GEL are market settings, not language.
          </p>
        </div>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
    </>
  )
}
