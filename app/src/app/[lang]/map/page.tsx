import type { Metadata } from 'next'
import { Suspense } from 'react'
import LocalizedLink from '@/components/LocalizedLink'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { projectsLive } from '@/lib/directory-live'
import { getMapPlatformConfig } from '@/lib/map/platform-config'
import { slimProjectsForMap } from '@/lib/map/slim-projects'
import { isValidLang } from '@/lib/i18n/core'
import { getServerT,pageAlternates,  } from '@/lib/i18n/server'
import { jsonLd } from '@/lib/utils'
import { requestMarket } from '@/lib/request-market'
import { marketCenter } from '@/lib/geo-market'
import { cityBySlug, nearestMapCity } from '@/lib/map/user-place.server'
import { cityShellFor } from '@/lib/countries/world-city-osm'
import { Map3DLazy } from './Map3DLazy'
import MapListLink from './MapListLink'

const SITE = 'https://sivrce.ge'

export const revalidate = 300

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const t = getServerT(lang)
  const title = t('map.meta.title')
  const description = t('map.meta.description')
  return {
    title,
    description,
    alternates: pageAlternates('/map', lang),
    openGraph: {
      title,
      description,
      url: `${SITE}/map`,
      type: 'website',
      images: [{ url: `${SITE}/images/og-brand.png`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE}/images/og-brand.png`],
    },
  }
}

export default async function MapPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const t = getServerT(lang)
  const market = await requestMarket()
  const sp = await searchParams
  // ?city=<slug> deep-links any of the ~1100 shell cities (directory, country hubs).
  const requested = typeof sp.city === 'string' && sp.city ? cityBySlug(sp.city) : null
  const bootBase = marketCenter(market)
  const boot = requested
    ? { lat: requested.lat, lng: requested.lng, slug: requested.slug }
    : bootBase
  // Georgia boots its own deep committed layers (georgia-pois/NBH/metro grid) —
  // a shell here would double-pin; everywhere else the shell is the instant city.
  const shellCity = requested ?? nearestMapCity(boot.lat, boot.lng)
  const cityShell = shellCity && shellCity.cc !== 'GE' ? cityShellFor(shellCity.slug) : null
  // Geometry-only project projection — full Project objects are ~11MB of RSC
  // payload Map3D never renders. Listings/buildings stream from /api/map-data
  // on mount (Map3D's empty-props fetch), platform config is bytes.
  const [projects, platform] = await Promise.all([projectsLive(), getMapPlatformConfig()])
  const slimProjects = slimProjectsForMap(projects)
  const mapLd = {
    '@context': 'https://schema.org',
    '@type': 'Map',
    name: t('map.meta.title'),
    description: t('map.meta.description'),
    url: `${SITE}/map`,
    inLanguage: lang,
    isPartOf: { '@id': `${SITE}/#website` },
    provider: { '@id': `${SITE}/#organization` },
    areaServed: { '@type': 'Place', name: 'Worldwide' },
    geo: { '@type': 'GeoCoordinates', latitude: boot.lat, longitude: boot.lng },
  }
  return (
    <div className="flex h-dvh flex-col bg-sv-navy">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(mapLd) }}
      />
      <header className="z-40 flex h-[calc(4.5rem+env(safe-area-inset-top,0px))] shrink-0 items-center justify-between border-b border-white/8 bg-sv-navy/95 px-4 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md md:h-[calc(5rem+env(safe-area-inset-top,0px))] md:px-8">
        <div className="flex items-center gap-3">
          <LocalizedLink
            href="/"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/70 transition hover:border-sv-blue/40 hover:text-white"
            aria-label={t('map.back')}
          >
            <ArrowLeft className="h-4 w-4" />
          </LocalizedLink>
          <Logo light />
          <h1 className="sr-only">{t('map.meta.title')}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <LocalizedLink
            href="/buildings"
            className="hidden rounded-full border border-white/15 px-4 py-2 text-[13px] font-extrabold text-white/80 transition hover:border-sv-blue/40 hover:text-white sm:inline-flex"
          >
            {t('nav.buildings')}
          </LocalizedLink>
          <Suspense
            fallback={
              <LocalizedLink
                href="/search"
                className="rounded-full bg-sv-orange px-4 py-2 text-[13px] font-extrabold text-sv-ink shadow-glow-orange transition hover:-translate-y-0.5"
              >
                {t('search.list')}
              </LocalizedLink>
            }
          >
            <MapListLink className="rounded-full bg-sv-orange px-4 py-2 text-[13px] font-extrabold text-sv-ink shadow-glow-orange transition hover:-translate-y-0.5">
              {t('search.list')}
            </MapListLink>
          </Suspense>
        </div>
      </header>
      <div id="main" className="min-h-0 flex-1">
        <Map3DLazy
          projects={slimProjects}
          platform={platform}
          bootCenter={{ lat: boot.lat, lng: boot.lng }}
          market={market}
          cityShell={cityShell}
        />
      </div>
    </div>
  )
}
