import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound, permanentRedirect } from 'next/navigation'
import SeoLanding, { seoMetadata } from '@/components/seo/SeoLanding'
import { isValidLang } from '@/lib/i18n/core'
import { filterListings } from '@/lib/listings-db'
import { requestMarket } from '@/lib/request-market'
import { countryIsoForMarket } from '@/lib/markets'
import {
  DEALS,
  TYPES,
  generateSeoBuildParams,
  parseSeoSlug,
  seoLocOf,
} from '@/lib/seo-pages'

/**
 * Programmatic SEO landings for all 10 locales (ka unprefixed, /en…/de prefixed).
 * Dynamically resolves the user's active market (Germany, Georgia, UAE, USA, etc.)
 * so the page delivers verified country-specific inventory and localized headings.
 */
export const revalidate = 300
export const maxDuration = 15

export function generateStaticParams() {
  return generateSeoBuildParams().map((seo) => ({ lang: 'ka', seo }))
}

interface PageProps {
  params: Promise<{ lang: string; seo: string[] }>
}

function decodeSlug(seo: string[]): string[] {
  return seo.map((s) => {
    try {
      return decodeURIComponent(s)
    } catch {
      return s
    }
  })
}

/** Live inventory — cache() dedupes metadata + page in one request. */
const hydrateSeoListings = cache(async (seoPath: string, countryIso = 'GE') => {
  const def = parseSeoSlug(seoPath.split('/').filter(Boolean), countryIso)
  if (!def) return null
  const live = await filterListings({
    dealType: def.dealSlug ? DEALS[def.dealSlug]?.deal : undefined,
    propType: def.typeSlug ? TYPES[def.typeSlug]?.type : undefined,
    city: def.city?.ka ?? def.city?.en,
    district: def.district?.ka ?? def.district?.en,
    country: countryIso,
  }).catch(() => [])
  const listings = !def.rooms
    ? live
    : live.filter((l) => (def.rooms === 4 ? l.rooms >= 4 : l.rooms === def.rooms))
  return { def, listings }
})

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, seo } = await params
  if (!isValidLang(lang)) return {}
  const decoded = decodeSlug(seo)
  const market = await requestMarket()
  const marketIso = countryIsoForMarket(market) ?? (lang === 'ka' ? 'GE' : market === 'global' ? 'all' : market.toUpperCase())
  const hydrated = await hydrateSeoListings(decoded.join('/'), marketIso)
  if (!hydrated) return {}
  return seoMetadata(
    { ...hydrated.def, listings: hydrated.listings },
    seoLocOf(lang),
    lang === 'ka' ? '' : `/${lang}`,
    marketIso,
  )
}

export default async function SeoLandingPage({ params }: PageProps) {
  const { lang, seo } = await params
  if (!isValidLang(lang)) notFound()
  const decoded = decodeSlug(seo)
  const market = await requestMarket()
  const marketIso = countryIsoForMarket(market) ?? (lang === 'ka' ? 'GE' : market === 'global' ? 'all' : market.toUpperCase())
  const hydrated = await hydrateSeoListings(decoded.join('/'), marketIso)
  if (!hydrated) notFound()

  // 100/100 Apple-grade SEO: On Georgian locale (ka), legacy ASCII URLs (/sale/apartments)
  // or hyphenated compound search queries (/იყიდება/ბინები-თბილისში) 308 redirect
  // to the canonical organic Georgian hierarchy (/იყიდება/ბინები, /იყიდება/ბინები/თბილისი)!
  if (lang === 'ka' && hydrated.def.kaPath) {
    const requestedPath = `/${decoded.join('/')}`
    if (requestedPath !== hydrated.def.kaPath) {
      permanentRedirect(hydrated.def.kaPath)
    }
  }

  return (
    <SeoLanding
      def={{ ...hydrated.def, listings: hydrated.listings }}
      loc={seoLocOf(lang)}
      urlPrefix={lang === 'ka' ? '' : `/${lang}`}
      marketIso={marketIso}
    />
  )
}

